var app = {
    showRootPage: function() {
        service.loadConfig();
        if (service.url === '') {
            app.showTemplate('loginForm');
        } else {
            app.showHomePage();
        }
    },
    showTemplate: function(name, options, callback) {
        $.get('templates/' + name + '.html', function(source) {
            if (typeof options !== 'undefined') {
                var template = Handlebars.compile(source);
                source = template(options);
            }

            if (typeof callback === 'function') {
                callback(source);
            } else if (typeof callback !== 'undefined') {
                $('#' + callback).html(source);
            } else {
                $('#page').html(source);
            }
        });
    },
    login: function() {
        service.setConfig(
            $('#url').val(),
            $('#key').val()
        );
        app.showHomePage();
    },
    showHomePage: function() {
        service.getCurrentUser(function(data) {
            localStorage.currentUserId = data.user.id;
            app.showTemplate('homePage', { currentUser: data.user }, function(source) {
                $('#page').html(source);
                service.getProjects(0, function(projectList) {
                    app.showTemplate('projectList', { projectList: projectList }, 'pageContent');
                });
            });
        });
    },
    logout: function() {
        service.url = '';
        service.apiKey = '';
        localStorage.removeItem('url');
        localStorage.removeItem('apiKey');
        app.showRootPage();
    }
};

Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});
