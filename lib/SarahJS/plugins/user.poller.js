;define(['sarah', '/js/SarahJS/lib/SarahJS/plugins/base.poller.js'], function(app){
    var InitCheckUser = function() {
        var error = 0;
        setInterval(function() {
            $.ajax({
                url: '/sarahphp/poller/me',
                cache: false,
                error: function() {
                    error++;
                    console.log('Error validating user');
                    if (error >= 3)
                        window.location = '/logout';
                }
            });
        }, 60 * 1000);
    }

    app.Utils.subscribe('LOAD:COLLECTION:Users', function() {
        $.ajax({
            url: '/sarahphp/poller/me',
            cache: false,
            success: function(res) {
                var data = res.data;
                var done = false;
                Deps.register('_user', function() {
                    return app.Collections.Users.get(data._id);
                }, function(result) {
                    if (result) {
                        app.User = result;
                    }
                });
                InitCheckUser();
            },
            error: function() {
                window.location = '/logout';
            }
        });
    });
    app.Runtime.Persistance['user.poller'] = function(){};
    return {};
});