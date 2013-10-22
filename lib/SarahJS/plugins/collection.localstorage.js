;
define(['sarah'], function(app){

    var Utils = app.Utils;

    var fn = function(name, config) {

        var self = this;
        self.name = name;

        var data = Utils.Store.get('PERSISTANCE:' + (config.name || name));
        if (data === undefined) {
            Utils.Store.set('PERSISTANCE:' + (config.name || name), []);
        }

        Utils.subscribe('LOAD:COLLECTION:' + name, function() {
            (Utils.Store.get('PERSISTANCE:' + (config.name || self.name)) || []).forEach(function(data) {
                data.createdAt = (typeof data.createdAt !== 'undefined') ? new Date(data.createdAt) : new Date();
                data.updatedAt = (typeof data.updatedAt !== 'undefined') ? new Date(data.updatedAt) : new Date();
                if(typeof data.deletedAt !== 'undefined') {
                    if (data.deletedAt === '1970-01-01T00:00:00.000Z' || data.deletedAt === null) {
                        data.deletedAt = null;
                        app.Collections[self.name].insert(data, true);
                    }
                } else {
                    app.Collections[self.name].insert(data, true);
                }
            });
        });

        self.sync = function() {
            Utils.Store.set('PERSISTANCE:' + (config.name || self.name), app.Collections[self.name].export())
        }
        Utils.subscribe('COLLECTION:INSERT:' + self.name + '', function(data) {
            self.sync();
        });

        Utils.subscribe('COLLECTION:UPDATE:' + self.name + '', function(data) {
            self.sync();
        });

        Utils.subscribe('COLLECTION:REMOVE:' + self.name + '', function(data) {
            self.sync();
        });
    }

    app.Runtime.Persistance.localstorage = fn;

    return fn;
});