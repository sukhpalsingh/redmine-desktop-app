var issues = {
    currentId: null,
    timer : null,
    startTime: null,
    edit: function(id) {
        service.getIssue(id, function(result) {
            app.showTemplate('issueDetails', { issue: result.issue, tab: 'all' }, function(result) {
                $('#pageContent').html(result);
            });
        });
    },
    openIssue: function() {
        issues.edit($('#issue_id').val());
    },
    showStartTime: function() {
        var d = new Date();
        issues.startTime = '00:' + (d.getHours() + 1);
        issues.startTime += ':' + d.getMinutes();
        issues.startTime = Timr.timeToSeconds(issues.startTime)
        issues.timer = Timr(issues.startTime, { formatOutput: 'hh:mm:ss', 'countdown' : false });
        issues.timer.ticker(({ formattedTime, percentDone }) => {
            var endTime = Timr.timeToSeconds(formattedTime);
            var diff = endTime - issues.startTime;
            $('#timer').html('' + Timr.formatTime(diff, 'hh:mm:ss').formattedTime);
        });
        issues.timer.start();
        $('#start_time_btn').addClass('hidden');
        $('#stop_time_btn').removeClass('hidden');
    },
    stopTime: function() {
        var endTime = issues.timer.getCurrentTime();
        var timeTaken = (endTime - issues.startTime) / 60; //mins
        var TimeMinChunks = ((timeTaken / 15) + "").split(".");
        var timechunks = parseInt(TimeMinChunks[0]);
        if (TimeMinChunks[1] > 0) {
            timechunks += 1;
        }
        var hoursTaken = (timechunks * 15) / 60;
        issues.timer.destroy();
        $('#start_time_btn').removeClass('hidden');
        $('#stop_time_btn').addClass('hidden');
        $('#timer').html('');
        timeEntry.create(issues.currentId, hoursTaken);
    },
    listAssigned: function() {
        service.getIssues('assigned_to_id=me&status_id=open', function(issueList) {
            app.showTemplate('projectIssueList', { issueList: issueList, tab: 'assigned'}, 'pageContent');
        });
    }
};
