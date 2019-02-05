var timeEntry = {
    create: function(issueId, timeTaken) {
        var timeData = {
            issue_id: issueId,
            hours: timeTaken,
            activity_id: 9
        };
        service.createTimeEntry(issueId, timeData);
    }
};
