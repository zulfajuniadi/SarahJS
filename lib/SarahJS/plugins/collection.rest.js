;
define(['sarah', 'jquery'], function (app, $) {

    var Utils = app.Utils;

    var fn = function (name, config, collection) {

        if (typeof config.url === 'undefined')
            throw 'rest storage must have a url option.';

        var self = this;
        self.name = name;
        self.url = config.url;
        self.restful = config.restful || true;

        var data = Utils.Store.get('PERSISTANCE:' + (config.name || name));
        if (data === undefined) {
            Utils.Store.set('PERSISTANCE:' + (config.name || name), []);
        }

        Utils.subscribe('LOAD:COLLECTION:' + name, function () {
            self.ajax(self.url, 'GET', {}, function (data) {
                try {
                    var data = JSON.parse(data);
                    collection.save(data);
                } catch (e) {
                    console.error(e);
                }
            });
        });

        Utils.subscribe('COLLECTION:INSERT:' + self.name, function (data) {
            self.ajax(self.url, 'POST', data);
        });

        Utils.subscribe('COLLECTION:UPDATE:' + self.name, function (data) {
            self.ajax(self.url + '/' + data._id, 'PUT', data);
        });

        Utils.subscribe('COLLECTION:REMOVE:' + self.name, function (data) {
            self.ajax(self.url + '/' + data._id, 'DELETE', data);
        });
    }

    fn.prototype.errorHandler = function (err) {
        console.error(err);
    }

    fn.prototype.ajax = function (url, method, data, success, error) {
        $.ajax((url || self.url), {
            async: true,
            cache: false,
            type: (method || 'GET'),
            contentType: 'application/json',
            accepts: 'application/json',
            dataType: 'json',
            error: self.errorHandler,
            processData: false,
            contents: (data || {}),
            success: (success || function () {}),
            error: (error || self.errorHandler)
        });
    }

    fn.prototype.sync = function () {

    }

    app.Runtime.Persistance.rest = fn;

    return fn;
});