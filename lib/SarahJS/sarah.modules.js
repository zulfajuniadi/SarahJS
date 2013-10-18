define(['sarah', 'lodash'], function(app, _){
    var Utils = app.Utils;
    return {
        load : function(moduleName, req, onload, config) {
            requirejs([
                'sarah',
                'app/' + moduleName + '/' + moduleName
            ], function(app, mod){

                /* fire preInit */

                if(Utils.isFunction(mod.preInit)){
                    mod.preInit.apply(mod);
                };

                /* process collections */

                var collections = mod.collections || {};

                _.each(collections, function(options, name){
                    app.Collections[name] = new app.Collection(name, options);
                });

                /* process templates */

                var templates = mod.templates || {};
                var startPath = 'text!app/' + moduleName + '/';
                var done = [];
                var templateArray = _.map(templates, function(data, name){
                    if(done.indexOf(data.template) === -1) {
                        done.push(data.template);
                        return startPath + data.template;
                    }
                    return;
                });
                requirejs(templateArray, function(){
                    _.each(arguments, function(text, i){
                        var name = Object.keys(templates)[i];
                        var template = new app.Template({
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

                    Utils.publish('MODULE:LOAD:' + moduleName, mod);
                    Utils.publish('MODULE:LOAD', [moduleName, mod]);

                    /* process routes */

                    if(typeof mod.routes !== 'undefined');
                    app.Router(mod.routes, mod);

                    /* fire postInit */

                    if(Utils.isFunction(mod.postInit)){
                        mod.postInit.apply(mod);
                    };

                    onload(mod);
                });
            });
        }
    }
});