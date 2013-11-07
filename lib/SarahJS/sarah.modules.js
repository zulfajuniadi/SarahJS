define(['sarah', 'lodash'], function(app, _){
    var Utils = app.Utils;
    return {
        load : function(moduleName, req, onload, config) {
            requirejs([
                'sarah',
                Utils.cleanUrl(app.Runtime.Config.appDir + '/' +  moduleName + '/' + moduleName + '.js')
            ], function(app, mod){
                
                var Utils = app.Utils;

                if(mod) {
                    /* fire preInit */

                    if(Utils.isFunction(mod.preInit)){
                        mod.preInit.call(mod, app);
                    };

                    /* process collections */

                    var collections = mod.collections || {};

                    mod.Collections = {};
                    mod.Templates = {};

                    _.each(collections, function(options, name){
                        mod.Collections[name] = app.Collections[name] = new app.Collection(name, options);
                    });
                    delete mod.collections;

                    /* process templates */

                    var templates = mod.templates || {};
                    var startPath = 'text!' + app.Runtime.Config.appDir + '/' + moduleName + '/';
                    var done = [];
                    var templateArray = _.map(templates, function(data, name){
                        if(done.indexOf(data.template) === -1) {
                            done.push(data.template);
                            return startPath + data.template;
                        }
                        return;
                    });

                    req(templateArray, function(){

                        _.each(arguments, function(text, i){
                            var name = Object.keys(templates)[i];
                            var template = mod.Templates[name] = new app.Template({
                                html : text,
                                name : name
                            });
                            var events = templates[name].events || {};
                            if(Utils.isFunction(templates[name].afterRender)) {
                                template.afterRender = templates[name].afterRender;
                            }
                            if(Utils.isFunction(templates[name].beforeRender)) {
                                template.beforeRender = templates[name].beforeRender;
                            }
                            template.events(events);
                            app.Templates[name] = template;
                        });

                        delete mod.templates;

                        Utils.publish('MODULE:LOAD:' + moduleName, mod);
                        Utils.publish('MODULE:LOAD', [moduleName, mod]);

                        /* process routes */

                        if(typeof mod.routes !== 'undefined') {
                            app.Router(mod.routes, mod);
                        }

                        /* fire postInit */

                        if(Utils.isFunction(mod.postInit)){
                            mod.postInit.call(mod);
                        };

                        app.Modules[moduleName] = mod;
                        onload(mod);
                    });
                } else {
                    onload({});
                }
            });
        }
    }
});