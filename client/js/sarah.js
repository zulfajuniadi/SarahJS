;
(function(Sarah, Handlebars, _, $) {

    var Utils = Sarah.Utils;

    Sarah.Configure = function(options) {
        var defaults = {
            jsonPollInterval: 10000,
            syncOnConnect: true,
            ImmidateSyncOnDataChange: true,
            apiKey: null,
            emulateHttp: false
        }
        Sarah.config = _.extend(defaults, options || {});
    }

    Sarah.init = function() {
        $('[type="template"]').each(function(idx, template) {
            var template = $(template);
            var name = template.attr('name');
            if (template.length > 0 && name) {
                Sarah.Templates[name] = new Sarah.Template(name, template.html());
            }
        });

        window.Session = new Sarah.Session();
        window.Deps = new Sarah.Deps();
        window.Template = Sarah.Templates;
        window.Router = new Sarah.Router();
        window.Collection = Sarah.Collection;
        window.Utils = Sarah.Utils;
        window.View = Sarah.View;
        window.Views = Sarah.Views;
    }

    /************************************************** DEPENDENCIES **************************************************/

    Sarah.Dependency = function(name, watch, callback) {
        var self = this.self = this;
        self.name = name;
        self.watch = watch;
        self.lastResult = null;
        self.callback = callback;
    }

    Sarah.Deps = function() {
        var self = this;
        this.watchList = [];
        this.interval;
        var i = 0;
        var to;
        this.evalLoop = function() {
            if (self.watchList.length > 0) {
                self.interval = setInterval(function() {
                    self.watchList = self.watchList.map(function(dep) {
                        var val = dep.watch();
                        if (val) {
                            if (JSON.stringify(val) !== JSON.stringify(dep.lastResult)) {
                                dep.callback(val);
                                dep.lastResult = JSON.parse(JSON.stringify(val));
                            }
                        }
                        return dep;
                    });
                }, 16)
            } else {
                to = setTimeout(function() {
                    if (self.watchList.length > 0) {
                        self.evalLoop();
                        clearTimeout(to);
                    }
                }, 100);
            }
        }
        this.run();
    }

    Sarah.Deps.prototype.run = function() {
        this.evalLoop();
    }

    Sarah.Deps.prototype.stop = function() {
        clearInterval(this.interval);
    }

    Sarah.Deps.prototype.reset = function() {
        this.watchList = [];
        this.run();
    }

    Sarah.Deps.prototype.register = function(name, watch, callback) {
        var watch = watch || '';
        if (watch.isFunction && callback.isFunction) {
            var dep = new Sarah.Dependency(name, watch, callback);
            this.watchList.push(dep);
        }
    }

    Sarah.Deps.prototype.unregister = function(name) {
        this.watchList = _.without(this.watchList, _.where(this.watchList, {
            name: name
        }));
    }

    /************************************************** ROUTER ********************************************************/

    /*
     Adapted from the works of:
     Copyright 2011 Paul Kinlan
     https://github.com/PaulKinlan/leviroutes
    */

    var router = Sarah.Router = function() {
        var _routes = [];
        var self = this;
        this.init();
    };

    router.prototype._routes = [];

    router.prototype.parseRoute = function(path) {
        this.parseGroups = function(loc) {
            var nameRegexp = new RegExp(":([^/.\\\\]+)", "g");
            var newRegexp = "" + loc;
            var groups = {};
            var matches = null;
            var i = 0;

            // Find the places to edit.
            while (matches = nameRegexp.exec(loc)) {
                groups[matches[1]] = i++;
                newRegexp = newRegexp.replace(matches[0], "([^/.\\\\]+)");
            }

            newRegexp += "$"; // Only do a full string match

            return {
                "groups": groups,
                "regexp": new RegExp(newRegexp)
            };
        };

        return this.parseGroups(path);
    };

    router.prototype.matchRoute = function(url, e) {
        var route = null;
        if (this._routes.length > 0) {
            for (var i = 0; route = this._routes[i]; i++) {
                var routeMatch = route.regex.regexp.exec(url);
                if ( !! routeMatch == false) continue;

                var params = {};
                for (var g in route.regex.groups) {
                    var group = route.regex.groups[g];
                    params[g] = routeMatch[group + 1];
                }

                var values = {};
                if (e && e.target instanceof HTMLFormElement) {
                    var form = e.target;
                    var items = form.length;
                    var item;
                    for (var j = 0; item = form[j]; j++) {
                        if ( !! item.name) values[item.name] = item.value;
                    }
                }

                var obj = _.extend(e, {
                    "url": url,
                    "params": params,
                    "values": values
                });

                // remove non persistant templates
                _.each(Sarah.Templates, function(template) {
                    if (!template._persistant) {
                        template.removeOutlets();
                    }
                })

                route.callback(obj);
                return true;
            }
        }

        return false;
    };

    router.prototype.get = function(route, callback) {
        this._routes.push({
            regex: this.parseRoute(route),
            "callback": callback,
            method: "get"
        });
    };

    router.prototype.post = function(route, callback) {
        this._routes.push({
            regex: this.parseRoute(route),
            "callback": callback,
            method: "post"
        });
    };

    router.prototype.test = function(url) {
        this.matchRoute(url);
    };

    router.prototype.getRoutes = function() {
        return this._routes;
    };

    router.prototype.init = function() {
        var self = this;
        var triggered = false;
        var cancelHashChange = false;
        var cancelPopstate = false;

        // Add a new event to HTML5 History
        if ( !! window.history && !! window.history.pushState) {

            var pushStateProxy = history.__proto__.pushState;

            history.__proto__.pushState = function(state, title, url) {
                pushStateProxy.apply(history, arguments);

                //var evt = document.createEvent("PopStateEvent");
                //evt.initPopStateEvent("statechange", false, false, state);
                var evt = document.createEvent("Event");
                evt.initEvent("statechanged", false, false);
                evt.state = state;
                window.dispatchEvent(evt);
                return;
            };
        }

        self.run = function() {
            if (!triggered) {
                self.matchRoute(document.location.pathname);
                triggered = true;
            }
            Utils.publish('Route', {
                router: self,
                route: document.location.pathname
            });
        };

        // Intercept FORM submissions.
        window.addEventListener("submit", function(e) {
            e.preventDefault();
            if (e.target.method == "post") {
                if (self.matchRoute(e.target.action, e)) {
                    e.preventDefault();
                    Utils.publish('Route', {
                        router: self,
                        route: e.target.action
                    });
                    return false;
                }
            }
            // If we haven't matched a URL let the normal request happen.
            return true;
        });

        window.addEventListener("popstate", function(e) {
            if (cancelPopstate) {
                cancelPopstate = false;
                cancelHashChange = false;
                return;
            }
            self.matchRoute(document.location.pathname);

            // popstate fires before a hash change, don't fire twice.
            cancelHashChange = true;
            Utils.publish('Route', {
                router: self,
                route: document.location.pathname
            });
        }, false);

        window.addEventListener("load", function(e) {
            if (!triggered) {
                self.matchRoute(document.location.pathname);
                triggered = true;
            }

            cancelHashChange = true;
            cancelPopstate = true;
            Utils.publish('Route', {
                router: self,
                route: document.location.pathname
            });
        }, false);

        window.addEventListener("hashchange", function(e) {
            if (cancelHashChange) {
                cancelHashChange = false;
                cancelPopstate = false;
                return;
            }
            self.matchRoute(document.location.pathname);
            Utils.publish('Route', {
                router: self,
                route: document.location.pathname
            });
        }, false);

        window.addEventListener("click", function(e) {
            if (cancelHashChange) {
                cancelHashChange = false;
                cancelPopstate = false;
                return;
            }
            var origEl = event.target || event.srcElement;
            if (origEl.tagName === 'A' || origEl.parentNode.tagName === 'A') {
                var href = origEl.href || origEl.parentNode.href;
                if (self.matchRoute(href)) {
                    e.preventDefault();
                    Utils.publish('Route', {
                        router: self,
                        route: href
                    });
                    window.history.pushState({}, document.title, href);
                    return false;
                }
            }
        }, false);
    };


    /************************************************** DATABASE ******************************************************/

    Sarah.Cache.db = {};

    var collection = Sarah.Collection = function(name, options) {
        this.name = name;
        Sarah.Cache.db[name] = [];
        this.init(options);
    }

    collection.prototype._softDelete = false;

    collection.prototype.get = function(id) {
        var obj = {
            _id: id
        };
        if (this._softDelete) {
            obj.deletedAt = null
        }
        if (id) {
            return _.findWhere(Sarah.Cache.db[this.name], obj);
        } else {
            delete(obj._id);
            return _.findWhere(Sarah.Cache.db[this.name], obj);
        }
    }

    collection.prototype.getAll = function() {
        var obj;
        if (this._softDelete) {
            obj = {};
            obj.deletedAt = null
        }
        return _.where(Sarah.Cache.db[this.name], obj);
    }

    collection.prototype.where = function(obj) {
        var obj = obj;
        if (this._softDelete) {
            obj.deletedAt = null
        }
        return _.where(Sarah.Cache.db[this.name], obj);
    }

    collection.prototype.findWhere = function(obj) {
        var obj = obj;
        if (this._softDelete) {
            obj.deletedAt = null
        }
        return _.findWhere(Sarah.Cache.db[this.name], obj);
    }

    collection.prototype.insert = function(data, quiet) {
        var quiet = quiet || false;
        if (data._id === undefined) {
            data._id = Utils.genId();
            data.insertedAt = new Date();
            data.updatedAt = new Date();
            data.deletedAt = null;
        }
        Sarah.Cache.db[this.name].push(data);
        if (!quiet) {
            Utils.publish('Collection:' + this.name + '.insert', data);
            Session.setFlash({
                type: 'notification',
                message: 'Data inserted successfully.',
                level: 'success'
            });
        }
        return true;
    }

    collection.prototype.update = function(find, obj, quiet) {
        var quiet = quiet || false;
        var data = this.findWhere(find);
        if (data) {
            var index = Sarah.Cache.db[this.name].indexOf(data);
            obj.updatedAt = new Date();
            var obj = _.extend(data, obj);
            Sarah.Cache.db[this.name][index] = obj;
        }
        if (!quiet) {
            Utils.publish('Collection:' + this.name + '.update', obj);
            Session.setFlash({
                type: 'notification',
                message: 'Data updated successfully.',
                level: 'success'
            });
        }
        return false;
    }

    collection.prototype.remove = function(obj, quiet) {
        var quiet = quiet || false;
        var data = this.findWhere(obj);
        var deleted = _.extend(data);
        if (this._softDelete) {
            data.deletedAt = new Date();
            this.update({
                _id: data.id
            }, data);
        } else {
            Sarah.Cache.db[this.name] = _.without(Sarah.Cache.db[this.name], this.findWhere(obj));
        }
        if (!quiet) {
            Utils.publish('Collection:' + this.name + '.remove', deleted);
            Session.setFlash({
                type: 'notification',
                message: 'Data removed successfully.',
                level: 'success'
            });
        }
    }

    collection.prototype.export = function() {
        return _.where(Sarah.Cache.db[this.name], {
            isFixture: undefined
        });
    }

    collection.prototype.import = function(source, replace) {
        var replace = replace || true;
        if (replace) {
            Sarah.Cache.db[this.name] = source;
        }
        return JSON.stringify(Sarah.Cache.db[this.name]);
    }

    collection.prototype.init = function(options) {
        var self = this;
        if (options.fixtures) {
            options.fixtures.forEach(function(fixture) {
                fixture.isFixture = true;
                self.insert(fixture, true);
            });
        }
        if (options.persistance) {
            if (options.persistance.localStorage) {
                var doLocalStorageUpdate = function() {
                    Utils.Store.set(self.name, self.export())
                }
                Utils.subscribe('Collection:' + self.name + '.insert', function(data) {
                    doLocalStorageUpdate();
                });

                Utils.subscribe('Collection:' + self.name + '.update', function(data) {
                    doLocalStorageUpdate();
                });

                Utils.subscribe('Collection:' + self.name + '.remove', function(data) {
                    doLocalStorageUpdate();
                });

                (Utils.Store.get(self.name) || []).forEach(function(data) {
                    data.insertedAt = new Date(data.insertedAt);
                    data.updatedAt = new Date(data.updatedAt);
                    data.deletedAt = new Date(data.deletedAt);
                    self.insert(data, true);
                });
            }
            // if(options.persistance.rest) {
            //     var doAjaxSync = function() {
            //         Utils.Store.set(self.name, self.export())
            //     }
            //     Utils.subscribe('Collection:' +self.name+ '.insert', function(data){
            //         doAjaxSync();
            //     });

            //     Utils.subscribe('Collection:' +self.name+ '.update', function(data){
            //         doAjaxSync();
            //     });

            //     Utils.subscribe('Collection:' +self.name+ '.remove', function(data){
            //         doAjaxSync();
            //     });

            //     (Utils.Store.get(self.name) || []).forEach(function(data){
            //         self.insert(data, true);
            //     });
            // }
        }
        if (options.softDelete) {
            this._softDelete = options.softDelete;
        }
    }


    /************************************************** TEMPLATES *****************************************************/

    Sarah.Templates = {};

    var _rendered = [];

    var template = Sarah.Template = function(name, _html) {
        var self = this;
        this._name = name;
        this._html = _html;
        Handlebars.registerPartial(name, _html);
        this._outlets = [];
        this._attributes = {};
        this._persistant = false;

        Utils.watch(this, ['_outlets'], function() {
            // console.log('_outlets changed');
            self.renderAll(false);
        });

        Utils.watch(this, ['_eventsList'], function() {
            console.log('_eventsList changed');
            self.renderAll(true);
        });

        Utils.getTemplateVars(_html).forEach(function(vars) {
            self[vars] = '';
            Utils.watch(self, [vars], function() {
                if (self[vars].isFunction) {
                    var hash = {};
                    hash[vars] = self[vars];
                    self.attributes(hash);
                }
            });
        });
    }

    template.prototype.setOutlet = function(selector, persistant) {
        if (persistant) {
            this._persistant = true;
        }
        this._outlets.push(selector);
    }

    template.prototype.removeOutlet = function(selector) {
        Deps.unregister(self._name);
        this.unbindEvents($(selector));
        $(selector).empty();
        this._outlets = _.without(this._outlets, selector);
    }

    template.prototype.removeOutlets = function() {
        var self = this;
        this._outlets.forEach(function(outlet) {
            self.removeOutlet(outlet);
        })
    }

    template.prototype.template = function() {
        return Handlebars.compile(this._html);
    }

    template.prototype.renderHtml = function(data) {
        return this.template(data);
    }

    template.prototype.renderAll = function(rerender) {
        var rerender = rerender || false;
        var self = this;

        self._outlets.forEach(function(outlet) {
            var outlet = $(outlet);
            self.unbindEvents(outlet);
            outlet.empty();
            self.renderToElement(outlet);
            self.bindEvents(outlet);
        });
    }

    template.prototype.attributes = function(hash) {
        var self = this;
        Deps.unregister(self._name);
        _.each(hash, function(fn, attr) {
            if (fn.isFunction) {
                Deps.register(self._name, fn, function(value) {
                    self._attributes[attr] = value;
                    self.renderAll(true);
                });
            }
        });
    }

    template.prototype.unbindEvents = function(target) {
        var target = $(target);
        $('*', target).each(function(idx, childOutlet) {
            $(childOutlet).off();
        });
        target.off();
    }

    template.prototype.bindEvents = function(target) {
        var self = this;
        var target = $(target);
        _.each(this._eventsList, function(fn, hashStr) {
            hashStr.split(',').forEach(function(hashStr) {
                var hstrArray = hashStr.trim().split(/\s+/);
                var elems = $(hstrArray[1], $(target));
                if (elems.length > 0) {
                    elems.each(function(idx, elem) {
                        var elem = $(elem);
                        var bindingId = elem.data('binding');
                        var data = {};
                        if (bindingId) {
                            data = Sarah.Cache.bindElement[bindingId];
                        }
                        elem.on(hstrArray[0], elem, function(e) {
                            var e = _.extend(e, {
                                data: data
                            })
                            fn(e, elem);
                        });
                    })
                }
            });
        })

    }

    template.prototype._eventsList = {};

    template.prototype.events = function(hash) {
        var self = this;
        _.each(hash, function(fn, attr) {
            if (fn.isFunction) {
                self._eventsList[attr] = fn;
            }
        });
    }

    template.prototype.render = function() {
        return this.template()(this._attributes);
    }

    template.prototype.renderToElement = function(elem) {
        var elem = $(elem);
        elem.html(this.render());
    }

    /* Listen for route changes */

    /**************************************************** SESSION *****************************************************/

    var sess = Sarah.Session = function() {
        var self = this;
        this.data = Utils.Store.get('___session___') || {};
        this.flashTimeout = 1000;
        Utils.watch(this, '_flash', function(property, method, values, old) {
            if (method === 'push') {
                setTimeout(function() {
                    self.unsetFlash(values[0]);
                }, self.flashTimeout)
                Utils.publish('Session:flash.set', values[0])
            } else {
                Utils.publish('Session:flash.unset', old[0])
            }
        })
    }

    sess.prototype._flash = [];

    sess.prototype.setFlash = function(data) {
        this._flash.push(data);
    };

    sess.prototype.unsetFlash = function(data) {
        this._flash = _.without(this._flash, data);
    };

    sess.prototype.getFlash = function() {
        return this._flash || [];
    }

    sess.prototype.set = function(variable, value) {
        if (value)
            this.data[variable] = value;
        else
            delete(this.data[variable]);
    };
    sess.prototype.get = function(variable, value) {
        return this.data[variable] || value || [];
    }

    sess.prototype.push = function(variable, values) {
        var self = this;
        if (this.data[variable] === undefined) {
            this.data[variable] = [];
        }

        if (this.data[variable].map) {
            if (values.map) {
                values.forEach(function(value) {
                    self.data[variable].push(value);
                })
            } else {
                self.data[variable].push(values);
            }
        }
    }

    sess.prototype.pull = function(variable, value) {
        if (this.data[variable].map) {
            this.data[variable] = _.without(this.data[variable], value);
        }
    }

    /****************************************************** VIEWS *****************************************************/

    Sarah.Views = {};

    var view = Sarah.View = function(name, options) {
        var self = this;
        if (name && options) {
            this.name = name;
            this._renderList = [];
            var layout = options.layout;
            var partials = options.partials;
            if (layout) {
                var outlet = _.keys(layout)[0];
                self.outlet = outlet;
                applyViewData(layout);
            }
            if (partials) {
                applyViewData(partials);
            }
        }

        function applyViewData(object) {
            _.each(object, function(properties, outlet) {
                if (properties.template) {
                    var template = properties.template;
                    if (properties.attributes) {
                        template.attributes(properties.attributes);
                    }
                    if (properties.events) {
                        template.events(properties.events);
                    }
                    self._renderList.push([template, outlet]);
                }
            })
        }

        this.render = function() {
            setTimeout(function() {
                self._renderList.forEach(function(render) {
                    render[0].setOutlet(render[1]);
                })
            }, 100)
        }
    }


    /**************************************************** MODULES *****************************************************/

    Sarah.Modules = {};

    var mo = Sarah.Module = function(options) {
        var self = this;
        self.onLeave = [];
        self.onEnter = [];
        self.listen = [];
        self.states = {};
    };

    mo.prototype.register = function(name, options) {

    }

    Sarah.init();

})(Sarah, Handlebars, _, $);