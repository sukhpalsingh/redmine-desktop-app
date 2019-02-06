var project = {
    names: [],
    show: function(id) {
        issues.list(id, 1);
    },
    prevList: function(limit, offset) {
        offset -= limit;
        project.list(offset);
    },
    nextList: function(count, limit, offset) {
        if (count > (offset + limit)) {
            offset += limit;
            project.list(offset);
        }
    },
    list: function(offset) {
        service.getProjects(offset, 10, function(projectList) {
            app.showTemplate('projectList', { projectList: projectList }, 'pageContent');
            project.getAll(projectList.total_count);
        });
    },
    listFavourites: function(favourites) {
        if (typeof favourites === 'undefined') {
            favourites = {};
        }

        service.getCurrentUser(
            function(currentUser) {
                app.showTemplate('myProjectList', { memberships:  currentUser.user.memberships}, 'pageContent');
            },
            'include=memberships'
        );
    },
    getAll: function(count) {
        var rounds = Math.floor(count / 100) + (count % 100 > 0 ? 1 : 0);
        var offset;
        var deferreds = [];
        for (var i = 0; i < rounds; i++) {
            offset = i * 100;
            deferreds.push(project.getProjectNames(offset));
        }

        $.when.apply($, deferreds).done(function() {
            $('#project-list').html('<option value=""></option>');
            for (var j = 0; j < project.names.length; j++) {
                $('#project-list').append(
                    '<option value="' + project.names[j].identifier + '">' + project.names[j].name + '</option>'
                );
            }

            $('#project-list').chosen({disable_search_threshold: 10, width: "100%"});
            console.log(project.names);
        });
    },
    getProjectNames: function(offset) {
        var promise = new $.Deferred();
        service.getProjects(offset, 100, function(projectList) {
            var projectDetails;
            for (var i = 0; i < projectList.projects.length; i++) {
                projectDetails = projectList.projects[i];
                project.names.push({identifier: projectDetails.identifier, name: projectDetails.name});
            }
            promise.resolve();
        })

        return promise;
    }
};

var timesheet = {
    spentTimes: {},
    project_alias: null,
    showingDate: null,
    overallSpentTime: function(startDate, endDate) {
        timesheet.showingDate = startDate;
        if (timesheet.project_alias === null) {
            $.ajax({
                dataType: "json",
                url: 'project_alias.json',
                // data: data,
                success: function(result) {
                    timesheet.project_alias = result;
                }
            });
        }

        timesheet.spentTimes = {};

        var mondayObj = new Date(startDate);
        var times = [];
        for(var i = 0; i < 7; i++) {
            times.push(this.formatDate(mondayObj));
            mondayObj.setDate(mondayObj.getDate() + 1);
        }

        service.getTimeEntries(
            '&user_id=' + localStorage.currentUserId
            + '&spent_on=><' + startDate + '|' + endDate
            + '&limit=100&include=issues',
            function(response) {
                var deferreds = timesheet.getTimeEntriesDetails(response);

                $.when.apply($, deferreds).done(function() {
                    var projects = Object.keys(timesheet.spentTimes);
                    for(var i = 0; i < projects.length; i++) {
                        for(var j = 0; j < times.length; j++) {
                            if (!timesheet.spentTimes[projects[i]].hasOwnProperty(times[j])) {
                                timesheet.spentTimes[projects[i]][times[j]] = 0;
                            }
                        }
                    }

                    var projectList = {};
                    for(var i = 0; i < projects.length; i++) {
                        var spentTimes = [];
                        for(var j = 0; j < times.length; j++) {
                            spentTimes.push(timesheet.spentTimes[projects[i]][times[j]]);
                        }

                        projectList[i] = {
                            'project': projects[i],
                            'alias' : timesheet.project_alias[projects[i]],
                            'times' : spentTimes
                        };
                    }

                    app.showTemplate('timesheetPage', { spentTimes:  timesheet.spentTimes, times: times, projectList, projectList, date: timesheet.showingDate}, 'pageContent');
                })
            }
        );
    },
    getTimeEntriesDetails: function(response) {
        var deferreds = [];

        for (var key in response.time_entries) {
            deferreds.push(timesheet.getIssueDetails(key, response));
        }

        return deferreds;
    },
    getIssueDetails: function(key, response) {
        var promise = new $.Deferred();

        var spent_on = response.time_entries[key].spent_on;
        
        $.get({
            url: service.url + '/issues/' + response.time_entries[key].issue.id + '.json?key=' + service.key,
            success: function(issueDetails) {
                var versionName = issueDetails.issue.fixed_version.name;
                if (!timesheet.spentTimes.hasOwnProperty(versionName)) {
                    timesheet.spentTimes[versionName] = {};
                    timesheet.spentTimes[versionName][spent_on] = 0;
                }

                if (!timesheet.spentTimes[versionName].hasOwnProperty(spent_on)) {
                    timesheet.spentTimes[versionName][spent_on] = 0;
                }

                timesheet.spentTimes[versionName][spent_on] += response.time_entries[key].hours;
                promise.resolve(issueDetails);
            },
            error: function(data) {
                promise.reject(data);
            }
        });

        return promise;
    },
    getThursday: function(date) {
        var day = date.getDay() || 7;  
        if( day !== 1 ) 
            date.setHours(-24 * (day - 1));
        date.setDate(date.getDate() + 3);
        return timesheet.formatDate(date);
    },
    formatDate: function(date) {
        var month = date.getMonth() + 1;
        var year = date.getFullYear();
        var date = date.getDate();

        var dateString = year + "-";

        if (month < 10) {
            dateString += 0;
        }

        dateString += month + "-";

        if (date < 10) {
            dateString += 0;
        }
        dateString += date;

        

        return dateString;
    },
    showTimeSpentFromDate: function(dateValue) {
        $('#pageContent').html('loading...');
        var date = new Date(dateValue);
        
        var monday = timesheet.getThursday(date);

        var enddate = new Date(monday);
        enddate.setDate(enddate.getDate() + 6);
        enddate = this.formatDate(enddate);
        timesheet.overallSpentTime(monday, enddate);
    },
    showPrevWeek: function() {
        var date = new Date(timesheet.showingDate);
        date.setDate(date.getDate() - 7);
        timesheet.showingDate = timesheet.formatDate(date);
        timesheet.showTimeSpentFromDate(timesheet.showingDate);
    },
    showNextWeek: function() {
        var date = new Date(timesheet.showingDate);
        date.setDate(date.getDate() + 7);
        timesheet.showingDate = timesheet.formatDate(date);
        timesheet.showTimeSpentFromDate(timesheet.showingDate);
    }
};
