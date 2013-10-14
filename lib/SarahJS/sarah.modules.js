define(['sarah', 'lodash'], function(app){
    return {
        load : function(moduleName, req, onload, config) {
            req([
                'sarah',
                'app/' + moduleName + '/' + moduleName
            ], function(app, mod){

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
                require(templateArray, function(){
                    _.each(arguments, function(text, i){
                        var name = Object.keys(templates)[i];
                        var template = new app.Template({
                            html : text,
                            name : name
                        });
                        var events = templates[name].events || {};
                        if(app.Utils.isFunction(templates[name].after)) {
                            template.afterRender = templates[name].after;
                        }
                        if(app.Utils.isFunction(templates[name].before)) {
                            template.beforeRender = templates[name].before;
                        }
                        template.events(events);
                        app.Templates[name] = template;
                    });

                    app.Utils.publish('MODULE:LOAD:' + moduleName);

                    /* process routes */

                    if(typeof mod.routes !== 'undefined');
                    app.Router(mod.routes);

                    onload(mod);
                });
            });
        }
    }
});