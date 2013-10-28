
/* we use window.requirejs because require conflicts with node-webkit require function */

requirejs.config({
    baseUrl : '',
    paths: {
        /* SarahJS Required libraries */
        "lodash" : "lib/lodash",
        "text" : "lib/text.min",

        /* SarahJS Modules */
        "sarah" : "lib/SarahJS/sarah",
        "sarah.modules" : "lib/SarahJS/sarah.modules",

        /* Needed by template.handlebars.js */
        "Handlebars" : "lib/handlebars",

        /* Uncomment if using jQuery */
        // "jquery" : "lib/jquery"

        /* Uncomment if using Zepto */
        "jquery" : "lib/zepto"
    },
    shim: {
        'lodash' : {
            exports : '_'
        },
        
        /* Needed by template.handlebars.js plugin */
        'Handlebars' : {
            deps : ['lodash'],
            exports: 'Handlebars'
        },

        /* Uncomment if using jQuery */
        // 'jquery': {
        //     exports: '$'
        // }

        /* Uncomment if using zepto */
        'jquery': {
            exports: '$'
        }
    }
});

requirejs(['sarah'], function(app){
    app.Configure({

        /* The main application startup file */
        app : 'app/app.js',
        
        /* The base path which SarahJS is located on */
        base : 'lib/SarahJS/',

        /* SarahJS Plugins loaded. Plugins are stored under lib/SarahJS/plugins */
        plugins : ['session.localstorage', 'collection.localstorage', 'template.handlebars'],

        /* Dependency checking interval */
        depsInterval : 200,

        /* If set to true, a SarahJS's instance can be referenced from window.Sarah */
        debug : true
    });
});