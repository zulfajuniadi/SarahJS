
/* we use window.requirejs because require conflicts with node-webkit require function */

var SarahJSLib = '/SarahJS/lib';
var AppDir = '/SarahJS/examples';
var AppMain = 'app.js';

requirejs.config({
    baseUrl : SarahJSLib,
    paths: {
        /* SarahJS Required libraries */
        "lodash" : "lodash",
        "text" : "text.min",

        /* SarahJS Modules */
        "sarah" : "SarahJS/sarah",
        "sarah.modules" : "SarahJS/sarah.modules",

        /* Needed by template.handlebars.js */
        "Handlebars" : "handlebars",

        /* Uncomment if using jQuery */
        // "jquery" : "jquery"

        /* Uncomment if using Zepto */
        "jquery" : "zepto"
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

        /* Uncomment if using zepto / jquery */
        'jquery': {
            exports: '$'
        }
    }
});

requirejs(['sarah'], function(app){
    app.Configure({

        /* The main application startup file */
        app : AppMain,
        
        /* The application directory */
        appDir : AppDir,
        
        /* The base path which SarahJS is located on */
        base : SarahJSLib,

        /* SarahJS Plugins loaded. Plugins are stored under lib/SarahJS/plugins */
        plugins : [

            /* Saves user session inside localstorage */
            'session.localstorage', 

            /* Saves collection data inside localstorage */
            'collection.localstorage', 

            /* Users Handlebars Templating Engine for rendering views */
            'template.handlebars',

            /* Detects when a users goes offline */
            // 'base.offline.js',

            /* Initiates either long poll of short poll to a remote resource. Needed by collection.sarahphp.js */
            // 'base.poller.js',

            /* Synchronizes local collection with SarahPHP. Load base.poller.js first */
            // 'collection.sarahphp.js',

            /* Checks user session from a remote resource */
            // 'user.poller.js',

            /* Stores files on the filesystem */
            // 'utils.fileStorage.js',

            /* Shorthand for Bootstrap Modal */
            // 'utils.modal.js',

            /* Shorthand for NodeWebkit Utilities */
            // 'utils.nodewebkit.js',

            /* Touch Events for Devices supporting touch. */
            // 'utils.touch.js',

            /* Fetches and uploads resources via XHR */
            // 'utils.xhrxfer.js',
        ],

        /* Dependency checking interval, 200 for mobile 100 for desktop */
        depsInterval : 200,

        /* If set to true, a SarahJS's instance and It's promary objects can be referenced from the window namespace (INSECURE) */
        debug : true
    });
});