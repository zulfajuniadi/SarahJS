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
                data.createdAt = new Date(data.createdAt);
                data.updatedAt = new Date(data.updatedAt);
                if (data.deletedAt === '1970-01-01T00:00:00.000Z' || data.deletedAt === null) {
                    data.deletedAt = null;
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