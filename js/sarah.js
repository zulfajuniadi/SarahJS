;
(function(Sarah, Handlebars, _, $) {
    var Sarah = Sarah || {};

    Sarah.init = function() {
        initializeTemplates();
        window.Session = new Sarah.Session();
        window.Deps = new Sarah.Deps();
        window.Template = Sarah.Templates;
        window.Router = new Sarah.Router();
        window.Collection = Sarah.Collection;
        window.Utils = Sarah.Utils;
    }


    /************************************************** DEPENDENCIES **************************************************/

    Sarah.Dependency = function(dfn, wfn) {
        var self = this.self = this;
        self.wfn = wfn;
        self.lastResult = null;
        self._isInvalid = false;
        self.watchers = [dfn];
    }

    Sarah.Deps = function() {
        var self = this;
        this.watchList = [];
        var i = 0;
        this.evalLoop = function() {
            if (self.watchList.length > 0) {
                setInterval(function() {
                    self.watchList = self.watchList.map(function(dep) {
                        var val = dep.wfn();
                        if(val) {
                            if (JSON.stringify(val) !== JSON.stringify(dep.lastResult)) {
                                // console.log(dep.lastResult);
                                dep.watchers.forEach(function(wfn) {
                                    wfn(val);
                                });
                                dep.lastResult = JSON.parse(JSON.stringify(val));
                            }
                        }
                        return dep;
                    });
                }, 10)
            } else {
                var to = setInterval(function() {
                    if (self.watchList.length > 0) {
                        self.evalLoop();
                        clearInterval(to);
                    }
                }, 10);
            }
        }
        this.run();
    }

    Sarah.Deps.prototype.run = function() {
        this.evalLoop();
    }

    Sarah.Deps.prototype.register = function(wfn, dfn) {
        if (wfn.isFunction && dfn.isFunction) {
            if (_.pluck(this.watchers, 'dependecies').indexOf(wfn) > -1) {
                this.watchList = this.watchList.map(function(obj) {
                    if (obj.wfn === wfn) {
                        obj.watchers.push(dfn);
                    }
                })
            } else {
                var dep = new Sarah.Dependency(dfn, wfn);
                this.watchList.push(dep);
            }
        }
    }


    /************************************************** ROUTER ********************************************************/

    /*

     Adapted from the works of:

     Copyright 2011 Paul Kinlan
     https://github.com/PaulKinlan/leviroutes

     Licensed under the Apache License, Version 2.0 (the "License");
     you may not use this file except in compliance with the License.
     You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

     Unless required by applicable law or agreed to in writing, software
     distributed under the License is distributed on an "AS IS" BASIS,
     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     See the License for the specific language governing permissions and
     limitations under the License.
    */

    Sarah.Router = function() {
        var _routes = [];
        var self = this;

        this.init();
    };

    Sarah.Router.prototype._routes = [];

    Sarah.Router.prototype.parseRoute = function(path) {
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

    Sarah.Router.prototype.matchRoute = function(url, e) {
        var route = null;
        if(this._routes.length > 0) {
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

                route.callback(obj);
                return true;
            }
        }

        return false;
    };

    Sarah.Router.prototype.get = function(route, callback) {
        this._routes.push({
            regex: this.parseRoute(route),
            "callback": callback,
            method: "get"
        });
    };

    Sarah.Router.prototype.post = function(route, callback) {
        this._routes.push({
            regex: this.parseRoute(route),
            "callback": callback,
            method: "post"
        });
    };

    Sarah.Router.prototype.test = function(url) {
        this.matchRoute(url);
    };

    Sarah.Router.prototype.getRoutes = function() {
        return this._routes;
    };

    Sarah.Router.prototype.init = function() {
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
        };

        // Intercept FORM submissions.
        window.addEventListener("submit", function(e) {
            e.preventDefault();
            if (e.target.method == "post") {
                if (self.matchRoute(e.target.action, e)) {
                    e.preventDefault();
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
        }, false);

        window.addEventListener("load", function(e) {
            if (!triggered) {
                self.matchRoute(document.location.pathname);
                triggered = true;
            }

            cancelHashChange = true;
            cancelPopstate = true;
        }, false);

        window.addEventListener("hashchange", function(e) {
            if (cancelHashChange) {
                cancelHashChange = false;
                cancelPopstate = false;
                return;
            }
            self.matchRoute(document.location.pathname);
        }, false);
    };


    /************************************************** DATABASE ******************************************************/

    Sarah.Cache.db = {};

    Sarah.Collection = function(name, options) {
        // var storage = (['memory'].indexOf(storage) > -1) ? storage || 'memory';
        this.name = name;
        Sarah.Cache.db[name] = [];
        this.init(options);
    }

    Sarah.Collection.prototype._softDelete = false;

    Sarah.Collection.prototype.get = function(id) {
        var obj = {_id : id};
        if(this._softDelete) {
            obj.deletedAt = null
        }
        if (id) {
            return _.findWhere(Sarah.Cache.db[this.name], obj);
        } else {
            delete(obj._id);
            return _.findWhere(Sarah.Cache.db[this.name], obj);
        }
    }

    Sarah.Collection.prototype.getAll = function() {
        var obj;
        if(this._softDelete) {
            obj = {};
            obj.deletedAt = null
        }
        return _.where(Sarah.Cache.db[this.name], obj);
    }

    Sarah.Collection.prototype.where = function(obj) {
        var obj = obj;
        if(this._softDelete) {
            obj.deletedAt = null
        }
        return _.where(Sarah.Cache.db[this.name], obj);
    }

    Sarah.Collection.prototype.findWhere = function(obj) {
        var obj = obj;
        if(this._softDelete) {
            obj.deletedAt = null
        }
        return _.findWhere(Sarah.Cache.db[this.name], obj);
    }

    Sarah.Collection.prototype.insert = function(data, quiet) {
        var quiet = quiet || false;
        if(data._id === undefined) {
            data._id = Sarah.Utils.genId();
            data.insertedAt = new Date();
            data.updatedAt = new Date();
            data.deletedAt = null;
        }
        Sarah.Cache.db[this.name].push(data);
        if(!quiet) {
            Sarah.Utils.publish('Collection:' + this.name + '.insert', data);
            Session.setFlash({ type : 'notification', message : 'Data inserted successfully.', level : 'success' });
        }
        return true;
    }

    Sarah.Collection.prototype.update = function(find, obj, quiet) {
        var quiet = quiet || false;
        var data = this.findWhere(find);
        if (data) {
            var index = Sarah.Cache.db[this.name].indexOf(data);
            obj.updatedAt = new Date();
            var obj = _.extend(data, obj);
            Sarah.Cache.db[this.name][index] = obj;
        }
        if(!quiet) {
            Sarah.Utils.publish('Collection:' + this.name + '.update', obj);
            Session.setFlash({ type : 'notification', message : 'Data updated successfully.', level : 'success' });
        }
        return false;
    }

    Sarah.Collection.prototype.remove = function(obj, quiet) {
        var quiet = quiet || false;
        var data = this.findWhere(obj);
        var deleted = _.extend(data);
        if(this._softDelete) {
            data.deletedAt = new Date();
            this.update({_id : data.id}, data);
        } else {
            Sarah.Cache.db[this.name] = _.without(Sarah.Cache.db[this.name], this.findWhere(obj));
        }
        if(!quiet) {
            Sarah.Utils.publish('Collection:' + this.name + '.remove', deleted);
            Session.setFlash({ type : 'notification', message : 'Data removed successfully.', level : 'success' });
        }
    }

    Sarah.Collection.prototype.export = function() {
        return _.where(Sarah.Cache.db[this.name], {isFixture : undefined});
    }

    Sarah.Collection.prototype.import = function(source, replace) {
        var replace = replace || true;
        if (replace) {
            Sarah.Cache.db[this.name] = source;
        }
        return JSON.stringify(Sarah.Cache.db[this.name]);
    }

    Sarah.Collection.prototype.init = function(options) {
        var self = this;
        if(options.fixtures) {
            options.fixtures.forEach(function(fixture) {
                fixture.isFixture = true;
                self.insert(fixture, true);
            });
        }
        if(options.persistance) {
            if(options.persistance.localStorage) {
                var doUpdate = function() {
                    Sarah.Utils.Store.set(self.name, self.export())
                }
                Utils.subscribe('Collection:' +self.name+ '.insert', function(data){
                    doUpdate();
                });

                Utils.subscribe('Collection:' +self.name+ '.update', function(data){
                    doUpdate();
                });

                Utils.subscribe('Collection:' +self.name+ '.remove', function(data){
                    doUpdate();
                });

                (Sarah.Utils.Store.get(self.name) || []).forEach(function(data){
                    self.insert(data, true);
                });
            }
        }
        if(options.softDelete) {
            this._softDelete = options.softDelete;
        }
    }


    /************************************************** TEMPLATES *****************************************************/

    Sarah.Templates = {};

    // Detect New Variables in Template

    var initializeTemplates = function() {
        var old = {};
        var whitelists = ['_html', '_outlets', '_eventsList'];
        setInterval(function() {
            _.each(Sarah.Templates, function(obj, name) {
                if (old[name] === undefined) {
                    old[name] = [];
                }
                nwOld = old[name];
                var keys = _.keys(obj).forEach(function(key) {
                    if (nwOld.indexOf(key) === -1 && whitelists.indexOf(key) == -1) {
                        // console.log(key);
                        if (obj[key]) {
                            if (obj[key].isFunction) {
                                var hash = {};
                                hash[key] = obj[key];
                                Sarah.Templates[name].setAttributes(hash);
                            }
                        }
                        nwOld.push(key);
                    }
                });
            })
        });
        Sarah.loadTemplates();
    }

    // var rendered = [];

    Sarah.Template = function(name, _html) {
        var self = this;
        this._html = _html;
        Handlebars.registerPartial(name, _html);
        this._outlets = [];
        this.attributes = {};

        watch(this, ['_outlets'], function() {
            // console.log('_outlets changed');
            self.renderAll(false);
        });

        watch(this, ['_eventsList'], function() {
            console.log('_eventsList changed');
            self.renderAll(true);
        });
    }

    Sarah.Template.prototype.setOutlet = function(selector) {
        this._outlets.push(selector);
    }

    Sarah.Template.prototype.removeOutlet = function(selector) {
        this.unbindEvents($(selector));
        $(selector).html('');
        this._outlets = _.without(this._outlets, selector);
    }

    Sarah.Template.prototype.template = function() {
        return Handlebars.compile(this._html);
    }

    Sarah.Template.prototype.rendered = [];

    Sarah.Template.prototype.renderHtml = function(data) {
        return this.template(data);
    }

    Sarah.Template.prototype.renderAll = function(rerender) {
        var rerender = rerender || false;
        var self = this;

        // remove old _outlets
        this.rendered.forEach(function(rendered) {
            if (self._outlets.indexOf(rendered) === -1) {
                $(rendered).html('');
                self.unbindEvents(rendered);
            };
        });

        // render new _outlets
        this.rendered = self._outlets.map(function(target) {
            // console.log(target)
            if (rerender) {
                self.unbindEvents(target);
                self.renderToElement(target);
                self.bindEvents(target);
            } else {
                if (self.rendered.indexOf(target) === -1) {
                    self.unbindEvents(target);
                    self.renderToElement(target);
                    self.bindEvents(target);
                }
            }
            return target;
        });
    }

    Sarah.Template.prototype.setAttributes = function(hash) {
        var self = this;
        _.each(hash, function(fn, attr) {
            if (fn.isFunction) {
                Deps.register(fn, function(value) {
                    self.attributes[attr] = value;
                    self.renderAll(true);
                })
            }
        });
    }

    Sarah.Template.prototype.unbindEvents = function(target) {
        $(target).off();
    }

    Sarah.Template.prototype.bindEvents = function(target) {
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
                        elem.on(hstrArray[0], elem, function(e){
                            var e = _.extend(e, {data : data})
                            fn(e, elem);
                        });
                    })
                }
            });
        })

    }

    Sarah.Template.prototype._eventsList = {};

    Sarah.Template.prototype.events = function(hash) {
        var self = this;
        _.each(hash, function(fn, attr) {
            if (fn.isFunction) {
                self._eventsList[attr] = fn;
            }
        });
    }

    Sarah.Template.prototype.render = function() {
        return this.template()(this.attributes);
    }

    Sarah.Template.prototype.renderToElement = function(elem) {
        var elem = $(elem);
        elem.html(this.render());
    }

    Sarah.loadTemplates = function() {
        $('[type="template"]').each(function(idx, template) {
            var template = $(template);
            var name = template.attr('name');
            if (template.length > 0 && name) {
                Sarah.Templates[name] = new Sarah.Template(name, template.html());
            }
        });
    }

    /**************************************************** SESSION *****************************************************/

    Sarah.Session = function() {
        var self = this;
        this.data = Sarah.Utils.Store.get('___session___') || {};
        this.flashTimeout = 1000;
        watch(this, '_flash', function(property, method, values, old) {
            if (method === 'push') {
                setTimeout(function() {
                    self.unsetFlash(values[0]);
                }, self.flashTimeout)
                Sarah.Utils.publish('Session:flash.set', values[0])
            } else {
                Sarah.Utils.publish('Session:flash.unset', old[0])
            }
        })
    }
    Sarah.Session.prototype._flash = [];
    Sarah.Session.prototype.setFlash = function(data) {
        this._flash.push(data);
    };
    Sarah.Session.prototype.unsetFlash = function(data) {
        this._flash = _.without(this._flash, data);
    };
    Sarah.Session.prototype.getFlash = function() {
        return this._flash || [];
    }
    Sarah.Session.prototype.set = function(variable, value) {
        if(value)
            this.data[variable] = value;
        else
            delete(this.data[variable]);
    };
    Sarah.Session.prototype.get = function(variable, value) {
        return this.data[variable] || value;
    }

    Sarah.init();

})(Sarah, Handlebars, _, $)