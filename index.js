require.config({
    paths: {
        /* SarahJS Required libraries */
        "lodash" : "lib/lodash",
        "text" : "lib/text.min",

        /* SarahJS Modules */
        "sarah" : "lib/SarahJS/sarah.min",
        "sarah.modules" : "lib/SarahJS/sarah.modules.min",
    }
});

require(['sarah', 'lodash'], function(app){
    app.Configure({
        app : 'app/app.js',
        rootUrl : '',
        base : 'lib/SarahJS/',
        plugins : ['session.localstorage', 'db.localstorage'],
        depsInterval : 200
    });
});