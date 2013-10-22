/* we use window.requirejs because require conflicts with node-webkit require function */

requirejs.config({
    paths: {
        /* SarahJS Required libraries */
        "lodash" : "lib/lodash",
        "text" : "lib/text.min",

        /* SarahJS Modules */
        "sarah" : "lib/SarahJS/sarah",
        "sarah.modules" : "lib/SarahJS/sarah.modules",

        /* Needed by template.handlebars.js */
        "Handlebars" : "lib/handlebars"

        /* Uncomment if using jQuery */

        // "jquery" : "lib/jquery"

    },
    shim: {
        'lodash' : {
            exports : '_'
        },
        
        /* Needed by template.handlebars.js */
        'Handlebars' : {
            deps : ['lodash'],
            exports: 'Handlebars'
        },

        /* Uncomment if using jQuery */

        // 'jquery': {
        //     exports: '$'
        // }
    }
});

requirejs(['sarah'], function(app){
    app.Configure({
        app : 'app/app.js',
        rootUrl : '',
        base : 'lib/SarahJS/',
        plugins : ['session.localstorage', 'collection.localstorage', 'template.handlebars'],
        depsInterval : 200,
        debug : true
    });
});