/*jslint nomen: true, regexp: false*/
/*global define, require, window, document, console*/
define(['lodash'], function (_) {
    "use strict";
    var Cache = {},
        Runtime = {},
        psCache = Cache.pubsub = {},
        Utils = {},
        store = {},
        doc = document,
        localStorageName = 'localStorage',
        namespace = '__storejs__',
        storage;
    Runtime.Loaded = {};
    Runtime.Persistance = {};
    Runtime.onClose = [];
    Runtime.onEnter = [];
    Runtime.onAway = [];
    Runtime.onBack = [];
    Runtime.onHidden = [];
    Runtime.onVisible = [];
    Runtime.Collections = {};
    Runtime.Templates = {};
    Utils.getTemplateVars = function (html) {
        return _.uniq(_.compact(_.flatten((html.match(/\{\{#?[\w].+?\}\}|\{\{#if?[\w].+?\}\}/g) || []).map(function (hash) {
            return hash.replace(/#[\w.]+\s/, '').split(' ');
        })).map(function (word) {
            return word.replace(/\{\{|\}\}/g, '').replace('../', '');
        }).map(function (word) {
            return word.indexOf('"') > -1 || word.indexOf('\'') > -1 || _.keys(Handlebars.helpers).indexOf(word) > -1 || word === 'else' ? undefined : word;
        })));
    };
    Utils.cleanUrl = function (url) {
        url = url.replace('http://', 'HTTPCOLSLASH').replace('https://', 'HTTPSCOLSLASH').replace('//', '/').replace('HTTPCOLSLASH', 'http://').replace('HTTPSCOLSLASH', 'https://');
        return url;
    };
    Utils.isNumber = function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };
    Utils.isString = function (value) {
        return value && value.constructor === String;
    };
    Utils.isObject = function (value) {
        return (value && value.constructor === Object) || false;
    };
    Utils.isArray = function (value) {
        if (value === undefined) {
            return false;
        }
        return typeof value.forEach === 'function' && typeof value.map === 'function';
    };
    Utils.isFunction = function (func) {
        if (typeof func === 'function') {
            return true;
        }
        return false;
    };
    Utils.arrayPull = function (arr, item) {
        if(arr !== undefined && item && undefined) {
            if(Utils.isArray(arr)) {
                if(arr.indexOf(item) > -1) {
                    arr = _.without(arr, item);
                    return arr;
                }
            }
        }
        return null;
    };
    Utils.isEmail = function (email) {
        if (Utils.isString(email)) {
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }
        return false;
    };
    Utils.autoCast = function (data) {
        var nested = false;
        if (!Utils.isObject(data) || !Utils.isArray(data)) {
            data = [data];
            nested = true;
        }
        data = _.map(data, function (data) {
            var common_strings = {
                'true': true,
                'false': false,
                'undefined': undefined,
                'null': null,
                'NaN': NaN
            };
            if (data instanceof Date) {
                return data;
            }
            if (Utils.isNumber(data)) {
                return Number(data);
            }
            Object.keys(common_strings).forEach(function (key) {
                if (data === key) {
                    return common_strings[key];
                }
            });
            return data;
        });
        return nested ? data[0] : data;
    };
    Utils.serializeForm = function (form) {
        var o = {}, elements = form.elements,
            i, element, value;
        for (i = 0; i < elements.length; i += 1) {
            element = elements[i];
            if (element.name) {
                if(element.type && element.type === 'checkbox' && element.checked === false) {

                } else if(element.value) {
                    value = element.value || null;
                    var name = ((element.name).indexOf('[]') > -1) ? element.name.replace('[]','') : element.name;
                    if (o[name]) {
                        if(!Utils.isArray(o[name])) {
                            var val = o[name];
                            o[name] = [];
                            o[name].push(val);
                        }
                        o[name].push(value);
                    } else {
                        o[name] = value;
                    }
                }
            }
        }
        return o;
    };
    Utils._doDeepPluck = function (data, key) {
        var self = this;
        return _.map(data, function (d, idx) {
            if (d === undefined || d === null) {
                return;
            }
            if (Utils.isArray(key)) {
                if (key.indexOf(d) > -1 || key.indexOf(idx) > -1) {
                    return d;
                }
            } else {
                if (key === d || idx === key) {
                    return d;
                }
            }
            if (Utils.isObject(d) || Utils.isArray(d)) {
                return self._doDeepPluck(d, key);
            }
        });
    };
    Utils.deepPluck = function (data, key) {
        return Utils.cleanArray(_.flatten(this._doDeepPluck(data, key)));
    };
    Utils.toTitleCase = function (str) {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    };
    Utils.sumArray = function (arr) {
        if (!Utils.isArray(arr) && !Utils.isObject(arr)) {
            return 0;
        }
        var val = 0;
        _.each(arr, function (num) {
            num = parseInt(num, 10);
            if (!isNaN(num)) {
                val += num;
            }
        });
        return val;
    };
    Utils.isBoolean = function (bool) {
        if (['true', 'false', true, false].indexOf(bool) > -1) {
            return true;
        }
        return false;
    };
    Utils.cleanArray = function (actual) {
        var i = 0;
        for (i = 0; i < actual.length; i += 1) {
            if (actual[i] === undefined || actual[i] === null || actual[i] === '') {
                actual.splice(i, 1);
                i -= 1;
            }
        }
        return actual;
    };
    Utils.genId = function () {
        function S4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
    };
    Utils.publish = function (topic, args) {
        (psCache[topic] || []).forEach(function (sub) {
            sub.apply(Utils, ([args] || []));
        });
    };
    Utils.subscribe = function (namespace, path, callback) {
        if (Utils.isFunction(path)) {
            callback = path;
            path = '';
        } else {
            namespace = namespace + ':' + path;
        }
        if (!psCache[namespace]) {
            psCache[namespace] = [];
        }
        psCache[namespace].push(callback);
        return [
            namespace,
            callback
        ];
    };
    Utils.unsubscribe = function (handle, callback) {
        psCache[handle] = _.without(psCache[handle], callback);
    };
    Utils.triggerEvent = function (element, event) {
        if (document.createEvent) {
            var evt = document.createEvent('HTMLEvents');
            evt.initEvent(event, true, true);
            return !element.dispatchEvent(evt);
        }
        var evt = document.createEventObject();
        return element.fireEvent('on' + event, evt);
    };
    Utils.emitEvent = Utils.triggerEvent;
    Utils.fireEvent = Utils.triggerEvent;
    Cache.bindElement = {};
    store.disabled = false;
    store.transact = function (key, defaultVal, transactionFn) {
        var val = store.get(key);
        if (transactionFn === null) {
            transactionFn = defaultVal;
            defaultVal = null;
        }
        if (val === undefined) {
            val = defaultVal || {};
        }
        transactionFn(val);
        store.set(key, val);
    };
    store.serialize = function (value) {
        return JSON.stringify(value);
    };
    store.deserialize = function (value) {
        if (typeof value !== 'string') {
            return undefined;
        }
        try {
            return JSON.parse(value);
        } catch (e) {
            return value || undefined;
        }
    };
    var isLocalStorageNameSupported = function () {
        try {
            return window[localStorageName];
        } catch (err) {
            return false;
        }
    };
    var withIEStorage = function (storeFunction) {
        return function () {
            var args = Array.prototype.slice.call(arguments, 0);
            args.unshift(storage);
            storageOwner.appendChild(storage);
            storage.addBehavior('#default#userData');
            storage.load(localStorageName);
            var result = storeFunction.apply(store, args);
            storageOwner.removeChild(storage);
            return result;
        };
    };
    var ieKeyFix = function (key) {
        return key.replace(forbiddenCharsRegex, '___');
    };
    if (isLocalStorageNameSupported()) {
        storage = window[localStorageName];
        store.set = function (key, val) {
            if (val === undefined) {
                return store.remove(key);
            }
            storage.setItem(key, store.serialize(val));
            return val;
        };
        store.get = function (key) {
            return store.deserialize(storage.getItem(key));
        };
        store.remove = function (key) {
            storage.removeItem(key);
        };
        store.clear = function () {
            storage.clear();
        };
        store.getAll = function () {
            var ret = {};
            for (var i = 0; i < storage.length; ++i) {
                var key = storage.key(i);
                ret[key] = store.get(key);
            }
            return ret;
        };
    } else if (doc.documentElement.addBehavior) {
        var storageOwner, storageContainer;
        try {
            storageContainer = new ActiveXObject('htmlfile');
            storageContainer.open();
            storageContainer.write('<s' + 'cript>document.w=window</s' + 'cript><iframe src="/favicon.ico"></iframe>');
            storageContainer.close();
            storageOwner = storageContainer.w.frames[0].document;
            storage = storageOwner.createElement('div');
        } catch (e) {
            storage = doc.createElement('div');
            storageOwner = doc.body;
        }
        var forbiddenCharsRegex = new RegExp('[!"#$%&\'()*+,/\\\\:;<=>?@[\\]^`{|}~]', 'g');
        store.set = withIEStorage(function (storage, key, val) {
            key = ieKeyFix(key);
            if (val === undefined) {
                return store.remove(key);
            }
            storage.setAttribute(key, store.serialize(val));
            storage.save(localStorageName);
            return val;
        });
        store.get = withIEStorage(function (storage, key) {
            key = ieKeyFix(key);
            return store.deserialize(storage.getAttribute(key));
        });
        store.remove = withIEStorage(function (storage, key) {
            key = ieKeyFix(key);
            storage.removeAttribute(key);
            storage.save(localStorageName);
        });
        store.clear = withIEStorage(function (storage) {
            var attributes = storage.XMLDocument.documentElement.attributes;
            storage.load(localStorageName);
            for (var i = 0, attr; attr = attributes[i]; i += 1) {
                storage.removeAttribute(attr.name);
            }
            storage.save(localStorageName);
        });
        store.getAll = withIEStorage(function (storage) {
            var attributes = storage.XMLDocument.documentElement.attributes;
            var ret = {};
            for (var i = 0, attr; attr = attributes[i]; ++i) {
                var key = ieKeyFix(attr.name);
                ret[attr.name] = store.deserialize(storage.getAttribute(key));
            }
            return ret;
        });
    }
    try {
        store.set(namespace, namespace);
        if (store.get(namespace) !== namespace) {
            store.disabled = true;
        }
        store.remove(namespace);
    } catch (e) {
        store.disabled = true;
    }
    Utils.Store = store;
    Utils.getBinding = function (id) {
        return Cache.bindElement[id];
    };
    Utils.onElementReady = function (selector, handler) {
        var el = document.querySelectorAll(selector);
        if (el.length > 0) {
            handler(el[0]);
        } else {
            var interval = setInterval(function () {
                el = document.querySelectorAll(selector);
                if (el.length > 0) {
                    clearInterval(interval);
                    handler(el[0]);
                }
            }, 15);
        }
    };
    var Dependency = function (name, watch, callback) {
        var self = this;
        self.name = name;
        self.watch = watch;
        self.lastResult = null;
        self.callback = callback;
        self.isActive = true;
        return this;
    };
    var Deps = function () {
        var self = this;
        this.watchList = [];
        this.Timeout;
        var i = 0;
        var j = 0;
        var sum = 0;
        var to;
        var errorCount = 0;
        self.interval = 15;
        self.loopDuration = 0;
        this.start();
    };
    Deps.prototype.loop = function (timeOut, once) {
        var errorCount = 0;
        var self = this;
        var once = once || false;
        var val;
        var timeOut = function(){
            return self.getInterval();
        }
        self.Timeout = setTimeout(function () {
            var i = 0;
            var sdate = new Date().getTime();
            self.watchList.forEach(function (dep) {
                if (dep && dep.isActive) {
                    try {
                        val = JSON.stringify(dep.watch());
                        if (val) {
                            if (val !== dep.lastResult) {
                                dep.callback(JSON.parse(val), JSON.parse(dep.lastResult));
                                dep.lastResult = val;
                            }
                        }
                        errorCount = 0;
                        return dep;
                    } catch (e) {
                        if (typeof dep !== undefined)
                            console.error('Dependency Error. Failed evaluating function ' + String(dep.watch));
                            errorCount++;
                        if (errorCount === 10) {
                            self.stop();
                            once = true;
                        }
                    }
                    i++;
                }
            });
            var loopDuration = new Date().getTime() - sdate;
            if (loopDuration !== self.loopDuration) {
                self.loopDuration = loopDuration;
            }
            if (once === false)
                self.start();
        }, timeOut);
    };
    Deps.prototype.setInterval = function (interval) {
        this.interval = interval;
    };
    Deps.prototype.getInterval = function () {
        return this.interval + this.loopDuration;
    };
    Deps.prototype.start = function () {
        var timeOut = this.getInterval();
        this.loop(timeOut);
        return true;
    };
    Deps.prototype.stop = function () {
        clearTimeout(this.Timeout);
        return true;
    };
    Deps.prototype.reset = function () {
        this.stop();
        this.watchList = [];
        this.start();
    };
    Deps.prototype.register = function (name, watch, callback) {
        var watch = watch || '';
        if (Utils.isFunction(watch) && Utils.isFunction(callback)) {
            var dep = new Dependency(name, watch, callback);
            this.watchList.push(dep);
            return dep;
        }
        return null;
    };
    Deps.prototype.unregister = function (name) {
        var w = this.watchList;
        w = w.splice(w.indexOf((function(){ w.filter(function(dep){ dep.name === name })})()), 1);
    };
    Deps = new Deps();
    var Session = function () {
        var self = this;
        this.data = {};
        this.flashTimeout = 5000;
    };
    Session.prototype._flash = [];
    Session.prototype.setFlash = function (data) {
        var self = this;
        self._flash.push(data);
        setTimeout(function () {
            self.unsetFlash(data);
        }, self.flashTimeout);
    };
    Session.prototype.unsetFlash = function (data) {
        this._flash = _.without(this._flash, data);
    };
    Session.prototype.getFlash = function () {
        return this._flash || [];
    };
    Session.prototype.set = function (variable, value) {
        this.data[variable] = value;
    };
    Session.prototype.remove = function (variable) {
        if (variable) {
            delete this.data[variable];
        }
    };
    Session.prototype.equals = function (key, value) {
        if (key) {
            var saved = this.get(key);
            if (saved === value) {
                return true;
            }
        }
        return false;
    };
    Session.prototype.get = function (variable, value) {
        return this.data[variable] || value;
    };
    Session.prototype.toggle = function (variable) {
        if (typeof this.data[variable] === 'undefined') {
            this.data[variable] = false;
        }
        this.data[variable] = !this.data[variable] || false;
        return this.data[variable];
    };
    Session.prototype.has = function (variable, value) {
        var self = this;
        if (this.data[variable] === undefined) {
            this.data[variable] = [];
        }
        return this.data[variable].indexOf(value) > -1 ? true : false;
    };
    Session.prototype.push = function (variable, values) {
        var self = this;
        if (this.data[variable] === undefined) {
            this.data[variable] = [];
        }
        if (this.data[variable].map) {
            if (values.map) {
                values.forEach(function (value) {
                    self.data[variable].push(value);
                });
            } else {
                self.data[variable].push(values);
            }
        }
    };
    Session.prototype.pull = function (variable, value) {
        if (this.data[variable].map) {
            this.data[variable] = _.without(this.data[variable], value);
        }
    };
    setTimeout(function () {
        Utils.publish('LOAD:SESSION');
    }, 1);
    Session = new Session();
    Cache.tmplVars = {};
    var _rendered = [];
    var Template = function (properties) {
        var self = this;
        this._name = properties.name;
        this._html = properties.html;
        this._url = properties.url;
        this._outlets = [];
        this._attributes = {};
        this._persistant = false;
        this._partials = [];
        Deps.register('_eventsList:' + this._name, function () {
            return this._eventsList;
        }, function () {
            self.renderAll(true);
        });
        Utils.subscribe('SETLAYOUT:' + this._name, function (outlet) {
            if (typeof outlet !== 'undefined') {
                self.setOutlet(outlet);
            } else {
                self.renderAll;
            }
        });
    };
    Template.prototype.setOutlet = function (selector, persistant) {
        if (persistant) {
            this._persistant = true;
        }
        if (this._outlets.indexOf(selector) === -1) {
            this._outlets.push(selector);
        }
        this.renderAll();
    };
    Template.prototype.removeOutlet = function (selector) {
        var el = document.querySelector(selector);
        if(el) {
            el.innerHTML = '';
        }
        this._outlets = _.without(this._outlets, selector);
    };
    Template.prototype.removeOutlets = function () {
        var self = this;
        if(!this._persistant)
            Deps.unregister(this._name);
        this._outlets.forEach(function (outlet) {
            if(!self._persistant)
                self.removeOutlet(outlet);
        });
        self._attributes = {};
        self._events = {};
    };
    Template.prototype.renderAll = function () {
        var self = this;
        clearTimeout(self.bubbleTimer);
        self.bubbleTimer = setTimeout(function () {
            if (typeof self.beforeRender === 'function') {
                self.beforeRender.call(self);
            }
            self._outlets.forEach(function (outlet) {
                Utils.onElementReady(outlet, function (el) {
                    el.className = self._name;
                    el.innerHTML = '';
                    self.renderToElement(el);
                    self.bindEvents(el);
                    self._partials.forEach(function (partial) {
                        Utils.publish('SETLAYOUT:' + partial.Template._name, partial.outlet);
                    });
                });
            });
            if (typeof self.afterRender === 'function') {
                self.afterRender.call(self);
            }
        }, 100);
    };
    Template.prototype.partials = Template.prototype.setPartials = function (hashes) {
        var self = this;
        hashes.forEach(function (hash) {
            if (self._partials.indexOf(hash) === -1) {
                self._partials.push(hash);
            }
        });
    };
    Template.prototype.attributes = Template.prototype.setAttributes = function (hash) {
        var self = this;
        Deps.unregister('attributes:' + self._name);
        _.each(hash, function (fn, attr) {
            if (Utils.isFunction(fn)) {
                Deps.register('attributes:' + self._name, fn, function (value) {
                    self._attributes[attr] = fn();
                    self.renderAll(true);
                });
            } else {
                self._attributes[attr] = fn;
            }
        });
        self.renderAll(true);
        return self;
    };

    // Template.prototype.bindEvents = function (target) {
    //     var self = this;

    //     self._outlets.forEach(function(outlet){
    //         _.each(self._eventsList, function (fn, hashStr) {
    //             var action = hashStr.substr(0, hashStr.indexOf(' ')).trim();
    //             var targets = hashStr.substr(action.length).trim();
    //             // console.log(action, targets);
    //             targets.split(',').forEach(function(target){
    //                 var wrapper = document.querySelector(outlet + ' .' + self._name);
    //                 console.log(outlet + '.' + self._name, wrapper);
    //             })
    //             // hashStr.split(',').forEach(function (hashStr) {
    //             //     var hstrArray = hashStr.trim().split(/\s+/);
    //             //     var tempString = hstrArray.shift();
    //             //     hstrArray[1] = hstrArray.join(' ');
    //             //     hstrArray[0] = tempString;
    //             //     var elems = target.querySelectorAll(hstrArray[1]);
    //             //     if (elems.length > 0) {
    //             //         for (var i = 0; i < elems.length; ++i) {
    //             //             var elem = elems[i];
    //             //             elem.addEventListener(hstrArray[0], function (e) {
    //             //                 var bindingId = this.getAttribute('data-binding');
    //             //                 var data = {};
    //             //                 if (bindingId) {
    //             //                     data = Cache.bindElement[bindingId];
    //             //                 }
    //             //                 if (hstrArray[0] === 'submit' && this.tagName === 'FORM') {
    //             //                     data = Utils.serializeForm(this);
    //             //                 }
    //             //                 fn.apply(data, [
    //             //                     e,
    //             //                     this
    //             //                 ]);
    //             //             });
    //             //         }
    //             //     }
    //             // });
    //         });
    //     });
    // };

    /* Old Event Binder. Relies on element to be ready - not always the case */

    Template.prototype.bindEvents = function (target) {
        var self = this;
        _.each(this._eventsList, function (fn, hashStr) {
            hashStr.split(',').forEach(function (hashStr) {
                var hstrArray = hashStr.trim().split(/\s+/);
                var tempString = hstrArray.shift();
                hstrArray[1] = hstrArray.join(' ');
                hstrArray[0] = tempString;
                var elems = target.querySelectorAll(hstrArray[1]);
                if (elems.length > 0) {
                    for (var i = 0; i < elems.length; ++i) {
                        elems[i].addEventListener(hstrArray[0], function (e) {
                            var bindingId = this.getAttribute('data-binding');
                            var data = {};
                            if (bindingId) {
                                data = Cache.bindElement[bindingId];
                            }
                            if (hstrArray[0] === 'submit' && this.tagName === 'FORM') {
                                data = Utils.serializeForm(this);
                            }
                            fn.apply(data, [
                                e,
                                this
                            ]);
                        });
                    }
                }
            });
        });
    };
    Template.prototype._eventsList = {};
    Template.prototype.events = function (hash) {
        var self = this;
        _.each(hash, function (fn, attr) {
            if (Utils.isFunction(fn)) {
                self._eventsList[attr] = fn;
            }
        });
    };
    Template.prototype.render = function (data) {
        var self = this;
        var context = {};
        if (data) {
            context = data;
        } else {
            context = this._attributes;
        }
        context = _.extend({}, context, {
            bind: function (ctx) {
                var id = Utils.genId();
                Cache.bindElement[id] = ctx;
                return ' rel=boundedData data-binding = ' + id;
            }
        });
        var ret = '';
        try {
            ret = _.template(this._html, context);
        } catch (e) {
            ret = '';
        }
        return ret;
    };
    Template.prototype.renderToElement = function (elem) {
        elem.innerHTML = this.render();
    };
    Cache.db = Cache.db || {};
    var Collection = function (name, options) {
        this.name = name;
        this.persistance = {};
        this.data = Cache.db[name] = [];
        this.init(options);
        this.revertHistory = [];
    };
    Collection.prototype.checksum = null;
    Collection.prototype._softDelete = false;
    Collection.prototype.get = function (id) {
        return Cache.db[this.name].filter(function (data) {
            return data._id === id && (data.deletedAt === '0' || data.deletedAt === null);
        })[0] || null;
    };
    Collection.prototype.getAll = function () {
        if (Utils.isFunction(this.getFilter)) {
            return Cache.db[this.name].filter(this.getFilter);
        } else {
            return Cache.db[this.name].filter(function (data) {
                return data.deletedAt === null || data.deletedAt === '0';
            });
        }
    };
    Collection.prototype.filter = function (fn) {
        var data = this.getAll();
        if (Utils.isFunction(fn)) {
            return data.filter(fn);
        } else {
            return data;
        }
    };
    Collection.prototype.where = function (where) {
        var where = where || {};
        if (this._softDelete) {
            where.deletedAt = null;
        }
        return _.where(Cache.db[this.name], where);
    };
    Collection.prototype.findWhere = function (where) {
        var data = this.getAll();
        return _.findWhere(data, where);
    };
    Collection.prototype.insert = function (data, quiet) {
        var self = this;
        var quiet = quiet || false;
        var doInsert = function (data) {
            if (data._id === undefined) {
                data._id = Utils.genId();
            }
            if (data.createdAt === undefined) {
                data.createdAt = new Date();
            }
            if (data.updatedAt === undefined) {
                data.updatedAt = new Date();
            }
            if (data.deletedAt === undefined) {
                data.deletedAt = null;
            }
            Cache.db[self.name].push(data);
            if (!quiet) {
                var revertData = _.extend({}, data);
                revertData.r = {
                    CollectionName: self.name,
                    _id: data._id,
                    operation: 'INSERT'
                };
                Utils.publish('COLLECTION:INSERT:' + self.name, revertData);
                Session.setFlash({
                    type: 'notification',
                    message: 'Data inserted successfully.',
                    level: 'success'
                });
            }
            return data;
        };
        if (data) {
            if (data.length !== undefined) {
                data.forEach(function (d) {
                    doInsert(d);
                });
            } else {
                return doInsert(data);
            }
        }
    };
    Collection.prototype.save = function (data, quiet) {
        var self = this;
        if (!Utils.isArray(data))
            data = [data];
        var returnData = data.map(function (data) {
            if (typeof data._id !== 'undefined') {
                if (data._id !== null && data._id !== '') {
                    return self.update({
                        _id: data._id
                    }, data);
                }
                delete data._id;
            }
            return self.insert(data, quiet);
        });
        if(returnData.length === 1) {
            return returnData[0];
        }
        return returnData;
    };
    Collection.prototype.merge = function (data, quiet) {
        var self = this;
        var quiet = quiet || false;
        var doMerge = function (data) {
            var odata = self.get(data._id);
            if (odata)
                Cache.db[self.name].splice(Cache.db[self.name].indexOf(odata), 1, data);
            else
                Cache.db[self.name].push(data);
            if (!quiet) {
                var revertData = _.extend({}, data);
                revertData.r = {
                    CollectionName: self.name,
                    _id: data._id,
                    operation: 'INSERT'
                };
                Utils.publish('COLLECTION:INSERT:' + self.name, revertData);
                Session.setFlash({
                    type: 'notification',
                    message: 'Data inserted successfully.',
                    level: 'success'
                });
            }
            return data;
        };
        if (data) {
            if (data.length !== undefined) {
                data.forEach(function (d) {
                    doMerge(d);
                });
            } else {
                return doMerge(data);
            }
        }
    };
    Collection.prototype.update = function (find, updates, quiet) {
        var self = this;
        var quiet = quiet || false;
        var data = this.findWhere(find);
        var original = _.extend({}, data);
        if (data) {
            var index = Cache.db[this.name].indexOf(data);
            var updated = _.extend({}, data, updates);
            updated.updatedAt = new Date();
            Cache.db[this.name].splice(index, 1, updated);
            if (!quiet) {
                var revertData = _.extend({}, updated);
                revertData.r = {
                    CollectionName: this.name,
                    _id: data._id,
                    operation: 'UPDATE'
                };
                self.revertHistory.push(original);
                Utils.publish('COLLECTION:UPDATE:' + self.name, revertData);
                Session.setFlash({
                    type: 'notification',
                    message: 'Data updated successfully.',
                    level: 'success'
                });
            }
        } else {
            self.insert(updates, quiet);
        }
        return data;
    };
    Collection.prototype.first = function () {
        if (this.getAll().length === 0)
            return;
        return this.getAll()[0];
    };
    Collection.prototype.last = function () {
        if (this.getAll().length === 0)
            return;
        return this.getAll()[this.getAll().length - 1];
    };
    Collection.prototype.deepPluck = function (data, key) {
        var self = this;
        if (typeof key === 'undefined') {
            key = data;
            data = this.getAll();
        }
        var res = Utils.deepPluck(data, key);
        return res;
    };
    Collection.prototype.deepFilter = function (data, key, value) {
        var self = this;
        var result = [];
        if (data instanceof Array) {
            for (var i = 0; i < data.length; i += 1) {
                var res = self.deepFilter(data[i], key, value);
                if (res !== null) {
                    result.push(res);
                }
            }
        } else {
            for (var prop in data) {
                if (prop === key) {
                    if (Utils.isFunction(value)) {
                        if (value(data[prop])) {
                            return data;
                        }
                    } else if (data[prop] === value) {
                        return data;
                    }
                }
                if (data[prop] instanceof Object || data[prop] instanceof Array) {
                    var res = self.deepFilter(data[prop], key, value);
                    if (res !== null) {
                        result.push(res);
                    }
                }
            }
        }
        return _.flatten(result);
    };
    Collection.prototype.inCollection = function (data, key, value, parents) {
        var self = this;
        if (typeof data === 'undefined' || data === null || data === []) {
            return false;
        }
        if (Utils.isArray(data) || Utils.isObject(data)) {
            if (data[key] === value) {
                parents.unshift(data);
                return true;
            }
            var filtered = _.filter(data, function (d) {
                return self.inCollection(d, key, value, parents);
            });
            if (filtered.length > 0) {
                if (Utils.isObject(data)) {
                    parents.push(data);
                }
                return true;
            }
            return false;
        }
        return false;
    };
    Collection.prototype.getProperties = function (_id, key, value) {
        var self = this;
        var ret = {};
        var parents = [];
        var Collection = [];
        if (typeof value === 'undefined') {
            value = key;
            key = _id;
            Collection = self.getAll().filter(function (data) {
                return self.inCollection(data, key, value, parents);
            });
        } else {
            var data = self.get(_id);
            if (data) {
                if (self.inCollection(data, key, value, parents)) {
                    Collection.push(data);
                }
            }
        }
        if (Collection.length > 0) {
            ret.Collection = Collection[0];
            ret.data = parents[0];
            ret.parent = parents[1];
            ret.paths = parents;
            return ret;
        }
        return;
    };
    Collection.prototype.remove = function (where, quiet) {
        var self = this;
        var quiet = quiet || false;
        var data = self.findWhere(where);
        if (data) {
            var original = _.extend({}, data);
            if (self._softDelete) {
                data.deletedAt = new Date();
                self.update({
                    _id: data.id
                }, data, true);
            } else {
                Cache.db[self.name].splice(Cache.db[self.name].indexOf(data), 1);
            }
            if (!quiet) {
                var revertData = _.extend({}, original);
                revertData.r = {
                    CollectionName: self.name,
                    _id: data._id,
                    operation: 'REMOVE'
                };
                self.revertHistory.push(original);
                Utils.publish('COLLECTION:REMOVE:' + self.name, revertData);
                Session.setFlash({
                    type: 'notification',
                    message: 'Data removed successfully.',
                    level: 'success'
                });
            }
        }
    };
    Collection.prototype.revert = function (r) {
        var self = this;
        switch (r.operation) {
        case 'INSERT':
            self.remove({
                _id: r._id
            }, true);
        case 'UPDATE':
            self.update({
                _id: r._id
            }, _.where(self.revertHistory, {
                _id: r._id
            }).pop(), true);
        case 'REMOVE':
            self.insert(_.where(self.revertHistory, {
                _id: r._id
            }).pop(), true);
        }
    };
    Collection.prototype.export = function () {
        return _.where(Cache.db[this.name], {
            isFixture: undefined
        });
    };
    Collection.prototype.purge = function () {
        var self = this;
        var data = this.getAll();
        data.forEach(function (d) {
            self.remove({
                name: d.name
            });
        });
    };
    Collection.prototype.import = function (data, replace) {
        var replace = replace || true;
        if (replace) {
            Cache.db[this.name] = data;
        }
        return Cache.db[this.name];
    };
    Collection.prototype.init = function (options) {
        var self = this;
        if (options.fixtures) {
            options.fixtures.forEach(function (fixture) {
                fixture.isFixture = true;
                self.insert(fixture, true);
            });
        }
        if (options.plugins) {
            _.each(options.plugins, function (config, name) {
                if (typeof Runtime.Persistance[name] === 'function') {
                    self.persistance[name] = new Runtime.Persistance[name](self.name, config, self);
                } else {
                    var error = 'Plugin for database backend "' + name + '" is unavailable. Did you load it?';
                    throw new Error(error);
                }
            });
        }
        if (options.softDelete) {
            this._softDelete = options.softDelete;
        }
        setTimeout(function () {
            Utils.publish('LOAD:COLLECTION:' + self.name);
        }, 1);
    };
    (function (w) {
        var routes = [];
        var map = {};
        var reference = 'routie';
        var oldReference = w[reference];
        var Route = function (path, name) {
            this.name = name;
            this.path = path;
            this.keys = [];
            this.fns = [];
            this.params = {};
            this.regex = pathToRegexp(this.path, this.keys, false, false);
        };
        Route.prototype.addHandler = function (fn) {
            this.fns.push(fn);
        };
        Route.prototype.removeHandler = function (fn) {
            for (var i = 0, c = this.fns.length; i < c; i += 1) {
                var f = this.fns[i];
                if (fn === f) {
                    this.fns.splice(i, 1);
                    return;
                }
            }
        };
        Route.prototype.run = function (params) {
            for (var i = 0, c = this.fns.length; i < c; i += 1) {
                this.fns[i].apply(this, params);
            }
        };
        Route.prototype.match = function (path, params) {
            var m = this.regex.exec(path);
            if (!m)
                return false;
            for (var i = 1, len = m.length; i < len; ++i) {
                var key = this.keys[i - 1];
                var val = 'string' === typeof m[i] ? decodeURIComponent(m[i]) : m[i];
                if (key) {
                    this.params[key.name] = val;
                }
                params.push(val);
            }
            return true;
        };
        Route.prototype.toURL = function (params) {
            var path = this.path;
            for (var param in params) {
                path = path.replace('/:' + param, '/' + params[param]);
            }
            path = path.replace(/\/:.*\?/g, '/').replace(/\?/g, '');
            if (path.indexOf(':') !== -1) {
                throw new Error('missing parameters for url: ' + path);
            }
            return path;
        };
        var pathToRegexp = function (path, keys, sensitive, strict) {
            if (path instanceof RegExp)
                return path;
            if (path instanceof Array)
                path = '(' + path.join('|') + ')';
            path = path.concat(strict ? '' : '/?').replace(/\/\(/g, '(?:/').replace(/\+/g, '__plus__').replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function (_, slash, format, key, capture, optional) {
                keys.push({
                    name: key,
                    optional: !! optional
                });
                slash = slash || '';
                return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' + (optional || '');
            }).replace(/([\/.])/g, '\\$1').replace(/__plus__/g, '(.+)').replace(/\*/g, '(.*)');
            return new RegExp('^' + path + '$', sensitive ? '' : 'i');
        };
        var addHandler = function (path, fn, module) {
            var module = module || null;
            var s = path.split(' ');
            var name = s.length === 2 ? s[0] : null;
            path = s.length === 2 ? s[1] : s[0];
            if (!map[path]) {
                map[path] = new Route(path, name);
                map[path].module = module;
                routes.push(map[path]);
            }
            map[path].addHandler(fn);
        };
        var routie = function (path, fn, module) {
            if (typeof fn === 'function') {
                addHandler(path, fn, module);
                /* this line below is giving me a headache */
                routie.reload();
            } else if (typeof path === 'object') {
                for (var p in path) {
                    addHandler(p, path[p], fn);
                }
                routie.reload();
            } else if (typeof fn === 'undefined') {
                routie.navigate(path);
            }
        };
        routie.getRoutes = function() {
            return routes;
        };
        routie.lookup = function (name, obj) {
            for (var i = 0, c = routes.length; i < c; i += 1) {
                var route = routes[i];
                if (route.name === name) {
                    return route.toURL(obj);
                }
            }
        };
        routie.remove = function (path, fn) {
            var route = map[path];
            if (!route)
                return;
            route.removeHandler(fn);
        };
        routie.removeAll = function () {
            map = {};
            routes = [];
        };
        routie.navigate = function (path, options) {
            options = options || {};
            var silent = options.silent || false;
            if (silent) {
                removeListener();
            }
            Utils.publish('ROUTE', path);
            setTimeout(function () {
                window.location.hash = path;
                if (silent) {
                    setTimeout(function () {
                        addListener();
                    }, 1);
                }
            }, 1);
        };
        routie.setCurrentModule = function(route) {
            if(this.currentModule === undefined) {
                var module = this.currentModule = (route.module || null);
                if(Utils.isFunction(module.onEnter)) {
                    module.onEnter.call(module, null, route, app);
                    app.Runtime.currentModule = module;
                }
            }

            if(this.currentModule !== route.module) {
                var oldModule = this.currentModule;
                var newModule = this.currentModule = route.module;
                if(Utils.isFunction(oldModule.onLeave)) {
                    oldModule.onLeave.call(module, route, app);
                }
                // _.each(oldModule.Templates, function(template){
                //     console.log(template, 'huhu2');
                //     if(!template._persistant) {
                //         template.removeOutlets();
                //     }
                // });
                if(Utils.isFunction(newModule.onEnter)) {
                    newModule.onEnter.call(newModule, route, app);
                    app.Runtime.currentModule = newModule;
                }
            }

        };

        var getHash = function () {
            return window.location.hash.substring(1);
        };
        var checkRoute = function (hash, route) {
            var params = [];
            if (route.match(hash, params)) {
                route.run(params);
                return route;
            }
            return false;
        };
        var hashChanged = routie.reload = function () {
            var hash = getHash();
            var isChanging = false;
            var self = this;
            if(!isChanging) {
                isChanging = true;
                for (var i = 0, c = routes.length; i < c; i += 1) {
                    var route = routes[i];
                    var gotRoute = checkRoute(hash, route);
                    if (gotRoute) {
                        // console.log(self._persistance)
                        // if(!self._persistance) {
                        //     self._attributes = {};
                        //     self._outlets = [];
                        //     self._partials = [];
                        //     self._events = [];
                        // }
                        routie.setCurrentModule(route);
                        Utils.publish('ROUTE', hash);
                        isChanging = false;
                        return;
                    }
                }
                isChanging = false;
                return;
            }
        };
        var addListener = function () {
            if (w.addEventListener) {
                w.addEventListener('hashchange', hashChanged, false);
            }
        };
        var removeListener = function () {
            if (w.removeEventListener) {
                w.removeEventListener('hashchange', hashChanged, false);
            }
        };
        addListener();
        w[reference] = routie;
    }(window));
    var Router = window.routie;
    delete window.routie;


    var Methods = window.Methods = {};

    var Plugins = {};
    var Configure = function (opts) {
        var config = Runtime.Config = opts || {};
        var plugins = (opts.plugins || []).map(function (plugin) {
            return Utils.cleanUrl((opts.base || '') + '/SarahJS/plugins/' + plugin + '.js');
        });
        requirejs(plugins, function () {
            var args = arguments;
            opts.plugins.forEach(function (name, idx) {
                Plugins[name] = args[idx];
            });
            setTimeout(function () {
                requirejs([opts.app]);
            }, 1);
        });
        opts.depsInterval = opts.depsInterval || 100;
        app.Deps.setInterval(opts.depsInterval);
        opts.debug = app.Runtime.debug = opts.debug || false;
        if (opts.debug) {
            window.Sarah = app;
            _.each(app, function (m, name) {
                window[name] = m;
            });
        }
        return config;
    };
    var app = {
        Runtime: Runtime,
        Utils: Utils,
        Cache: Cache,
        Deps: Deps,
        Session: Session,
        Collection: Collection,
        Collections: Runtime.Collections,
        Templates: Runtime.Templates,
        Template: Template,
        Router: Router,
        Configure: Configure,
        Plugins: Plugins,
        Methods: Methods,
        Modules: {}
    };
    setInterval(function () {
        var els = document.querySelectorAll('[data-binding]');
        var boundedKeys = Object.keys(Cache.bindElement);
        _.map(els, function (el) {
            var elKey = el.getAttribute('data-binding');
            if (boundedKeys.indexOf(elKey) === -1) {
                delete Cache.bindElement[elKey];
            }
        });
    }, 500);
    window.onbeforeunload = function () {
        app.Runtime.onClose.forEach(function (fn) {
            if (typeof fn === 'function') {
                fn();
            }
        });
    };
    return app;
});