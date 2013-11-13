;define(['sarah', 'jQuery'], function(app, jQuery){
    if(typeof(jQuery) === 'undefined') {
        throw 'jQuery (or Zepto) is not loaded. Please update your index.js file.';
    }
    var InitCheckUser = function() {
        var error = 0;
        setInterval(function() {
            jQuery.ajax({
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
        jQuery.ajax({
            url: '/sarahphp/poller/me',
            cache: false,
            success: function(res) {
                var data = res.data;
                var done = false;
                console.log(res);
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