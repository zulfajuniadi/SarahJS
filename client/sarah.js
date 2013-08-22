var Sarah = Sarah || {};

;
(function(Sarah, Handlebars, _, $) {

    var Sarah = Sarah || {};
    var Utils = Sarah.Utils = {};
    var Cache = Sarah.Cache = {};

    Function.prototype.isFunction = true;

    Utils.genId = function() {
        function S4() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        }
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    }

    // https://github.com/melanke/Watch.JS

    var WatchJS = {
        noMore: false
    },
        lengthsubjects = [];

    var isFunction = function(functionToCheck) {
        var getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) == '[object Function]';
    };

    var isInt = function(x) {
        return x % 1 === 0;
    };

    var isArray = function(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };

    var getObjDiff = function(a, b) {
        var aplus = [],
            bplus = [];

        if (!(typeof a == "string") && !(typeof b == "string") && !isArray(a) && !isArray(b)) {

            for (var i in a) {
                if (!b[i]) {
                    aplus.push(i);
                }
            }

            for (var j in b) {
                if (!a[j]) {
                    bplus.push(j);
                }
            }
        }
        return {
            added: aplus,
            removed: bplus
        }
    };

    var clone = function(obj) {
        if (null == obj || "object" != typeof obj) {
            return obj;
        }

        var copy = obj.constructor();

        for (var attr in obj) {
            copy[attr] = obj[attr];
        }

        return copy;
    }

    var defineGetAndSet = function(obj, propName, getter, setter) {
        try {
            Object.defineProperty(obj, propName, {
                get: getter,
                set: setter,
                enumerable: true,
                configurable: true
            });
        } catch (error) {
            try {
                Object.prototype.__defineGetter__.call(obj, propName, getter);
                Object.prototype.__defineSetter__.call(obj, propName, setter);
            } catch (error2) {
                throw new Error("watchJS error: browser not supported :/")
            }
        }
    };

    var defineProp = function(obj, propName, value) {
        try {
            Object.defineProperty(obj, propName, {
                enumerable: false,
                configurable: true,
                writable: false,
                value: value
            });
        } catch (error) {
            obj[propName] = value;
        }
    };

    var watch = function() {

        if (isFunction(arguments[1])) {
            watchAll.apply(this, arguments);
        } else if (isArray(arguments[1])) {
            watchMany.apply(this, arguments);
        } else {
            watchOne.apply(this, arguments);
        }
    };

    var watchAll = function(obj, watcher, level, addNRemove) {
        if ((typeof obj == "string") || (!(obj instanceof Object) && !isArray(obj))) { //accepts only objects and array (not string)
            return;
        }
        var props = [];
        if (isArray(obj)) {
            for (var prop = 0; prop < obj.length; prop++) { //for each item if obj is an array
                props.push(prop); //put in the props
            }
        } else {
            for (var prop2 in obj) { //for each attribute if obj is an object
                props.push(prop2); //put in the props
            }
        }
        watchMany(obj, props, watcher, level, addNRemove); //watch all itens of the props
    };
    var watchMany = function(obj, props, watcher, level, addNRemove) {

        if ((typeof obj == "string") || (!(obj instanceof Object) && !isArray(obj))) { //accepts only objects and array (not string)
            return;
        }

        for (var prop in props) { //watch each attribute of "props" if is an object
            watchOne(obj, props[prop], watcher, level, addNRemove);
        }
    };

    var watchOne = function(obj, prop, watcher, level, addNRemove) {

        if ((typeof obj == "string") || (!(obj instanceof Object) && !isArray(obj))) { //accepts only objects and array (not string)
            return;
        }

        if (isFunction(obj[prop])) { //dont watch if it is a function
            return;
        }

        if (obj[prop] != null && (level === undefined || level > 0)) {
            if (level !== undefined) {
                level--;
            }
            watchAll(obj[prop], watcher, level); //recursively watch all attributes of this
        }

        defineWatcher(obj, prop, watcher);

        if (addNRemove) {
            pushToLengthSubjects(obj, prop, watcher, level);
        }

    };

    var unwatch = function() {

        if (isFunction(arguments[1])) {
            unwatchAll.apply(this, arguments);
        } else if (isArray(arguments[1])) {
            unwatchMany.apply(this, arguments);
        } else {
            unwatchOne.apply(this, arguments);
        }

    };

    var unwatchAll = function(obj, watcher) {

        if (obj instanceof String || (!(obj instanceof Object) && !isArray(obj))) { //accepts only objects and array (not string)
            return;
        }

        var props = [];


        if (isArray(obj)) {
            for (var prop = 0; prop < obj.length; prop++) { //for each item if obj is an array
                props.push(prop); //put in the props
            }
        } else {
            for (var prop2 in obj) { //for each attribute if obj is an object
                props.push(prop2); //put in the props
            }
        }

        unwatchMany(obj, props, watcher); //watch all itens of the props
    };


    var unwatchMany = function(obj, props, watcher) {

        for (var prop2 in props) { //watch each attribute of "props" if is an object
            unwatchOne(obj, props[prop2], watcher);
        }
    };

    var defineWatcher = function(obj, prop, watcher) {

        var val = obj[prop];

        watchFunctions(obj, prop);

        if (!obj.watchers) {
            defineProp(obj, "watchers", {});
        }

        if (!obj.watchers[prop]) {
            obj.watchers[prop] = [];
        }

        for (var i in obj.watchers[prop]) {
            if (obj.watchers[prop][i] === watcher) {
                return;
            }
        }


        obj.watchers[prop].push(watcher); //add the new watcher in the watchers array


        var getter = function() {
            return val;
        };


        var setter = function(newval) {
            var oldval = val;
            val = newval;

            if (obj[prop]) {
                watchAll(obj[prop], watcher);
            }

            watchFunctions(obj, prop);

            if (!WatchJS.noMore) {
                if (JSON.stringify(oldval) !== JSON.stringify(newval)) {
                    callWatchers(obj, prop, "set", newval, oldval);
                    WatchJS.noMore = false;
                }
            }
        };

        defineGetAndSet(obj, prop, getter, setter);

    };

    var callWatchers = function(obj, prop, action, newval, oldval) {
        if (prop) {
            for (var wr in obj.watchers[prop]) {
                if (isInt(wr)) {
                    obj.watchers[prop][wr].call(obj, prop, action, newval || obj[prop], oldval);
                }
            }
        } else {
            for (var prop in obj) { //call all
                callWatchers(obj, prop, action, newval, oldval);
            }
        }
    };

    // @todo code related to "watchFunctions" is certainly buggy
    var methodNames = ['pop', 'push', 'reverse', 'shift', 'sort', 'slice', 'unshift'];
    var defineArrayMethodWatcher = function(obj, prop, original, methodName) {
        defineProp(obj[prop], methodName, function() {
            var response = original.apply(obj[prop], arguments);
            watchOne(obj, obj[prop]);
            if (methodName !== 'slice') {
                callWatchers(obj, prop, methodName, arguments);
            }
            return response;
        });
    };

    var watchFunctions = function(obj, prop) {

        if ((!obj[prop]) || (obj[prop] instanceof String) || (!isArray(obj[prop]))) {
            return;
        }

        for (var i = methodNames.length, methodName; i--;) {
            methodName = methodNames[i];
            defineArrayMethodWatcher(obj, prop, obj[prop][methodName], methodName);
        }

    };

    var unwatchOne = function(obj, prop, watcher) {
        for (var i in obj.watchers[prop]) {
            var w = obj.watchers[prop][i];

            if (w == watcher) {
                obj.watchers[prop].splice(i, 1);
            }
        }

        removeFromLengthSubjects(obj, prop, watcher);
    };

    var loop = function() {

        for (var i in lengthsubjects) {

            var subj = lengthsubjects[i];
            var difference = getObjDiff(subj.obj[subj.prop], subj.actual);

            if (difference.added.length || difference.removed.length) {
                if (difference.added.length) {
                    for (var j in subj.obj.watchers[subj.prop]) {
                        watchMany(subj.obj[subj.prop], difference.added, subj.obj.watchers[subj.prop][j], subj.level - 1, true);
                    }
                }

                callWatchers(subj.obj, subj.prop, "differentattr", difference, subj.actual);
            }
            subj.actual = clone(subj.obj[subj.prop]);

        }

    };

    var pushToLengthSubjects = function(obj, prop, watcher, level) {


        lengthsubjects.push({
            obj: obj,
            prop: prop,
            actual: clone(obj[prop]),
            watcher: watcher,
            level: level
        });
    };

    var removeFromLengthSubjects = function(obj, prop, watcher) {

        for (var i in lengthsubjects) {
            var subj = lengthsubjects[i];

            if (subj.obj == obj && subj.prop == prop && subj.watcher == watcher) {
                lengthsubjects.splice(i, 1);
            }
        }

    };

    setInterval(loop, 16);

    WatchJS.watch = watch;
    WatchJS.unwatch = unwatch;
    WatchJS.callWatchers = callWatchers;

    Utils.watch = WatchJS.watch;

    var cache = Cache.pubsub || {}; //check for "c_" cache for unit testing

    Utils.publish = function( /* String */ topic, /* Array? */ args) {
        var subs = cache[topic],
            len = subs ? subs.length : 0;
        while (len--) {
            subs[len].apply(Utils, [args] || []);
        }
    };

    Utils.subscribe = function( /* String */ topic, /* Function */ callback) {
        if (!cache[topic]) {
            cache[topic] = [];
        }
        cache[topic].push(callback);
        return [topic, callback]; // Array
    };

    Utils.unsubscribe = function( /* Array */ handle, /* Function? */ callback) {
        var subs = cache[callback ? handle : handle[0]],
            callback = callback || handle[1],
            len = subs ? subs.length : 0;

        while (len--) {
            if (subs[len] === callback) {
                subs.splice(len, 1);
            }
        }
    };

    // https://github.com/marcuswestin/store.js/blob/master/store.js

    Utils.Store = {};

    var store = {},
        doc = document,
        localStorageName = 'localStorage',
        namespace = '__storejs__',
        storage

        store.disabled = false
        store.set = function(key, value) {}
    store.get = function(key) {}
    store.remove = function(key) {}
    store.clear = function() {}
    store.transact = function(key, defaultVal, transactionFn) {
        var val = store.get(key)
        if (transactionFn == null) {
            transactionFn = defaultVal
            defaultVal = null
        }
        if (typeof val == 'undefined') {
            val = defaultVal || {}
        }
        transactionFn(val)
        store.set(key, val)
    }
    store.getAll = function() {}

    store.serialize = function(value) {
        return JSON.stringify(value)
    }
    store.deserialize = function(value) {
        if (typeof value != 'string') {
            return undefined
        }
        try {
            return JSON.parse(value)
        } catch (e) {
            return value || undefined
        }
    }

    function isLocalStorageNameSupported() {
        try {
            return (localStorageName in win && win[localStorageName])
        } catch (err) {
            return false
        }
    }

    if (isLocalStorageNameSupported()) {
        storage = win[localStorageName]
        store.set = function(key, val) {
            if (val === undefined) {
                return store.remove(key)
            }
            storage.setItem(key, store.serialize(val))
            return val
        }
        store.get = function(key) {
            return store.deserialize(storage.getItem(key))
        }
        store.remove = function(key) {
            storage.removeItem(key)
        }
        store.clear = function() {
            storage.clear()
        }
        store.getAll = function() {
            var ret = {}
            for (var i = 0; i < storage.length; ++i) {
                var key = storage.key(i)
                ret[key] = store.get(key)
            }
            return ret
        }
    } else if (doc.documentElement.addBehavior) {
        var storageOwner,
            storageContainer
        try {
            storageContainer = new ActiveXObject('htmlfile')
            storageContainer.open()
            storageContainer.write('<s' + 'cript>document.w=window</s' + 'cript><iframe src="/favicon.ico"></iframe>')
            storageContainer.close()
            storageOwner = storageContainer.w.frames[0].document
            storage = storageOwner.createElement('div')
        } catch (e) {
            storage = doc.createElement('div')
            storageOwner = doc.body
        }

        function withIEStorage(storeFunction) {
            return function() {
                var args = Array.prototype.slice.call(arguments, 0)
                args.unshift(storage)
                storageOwner.appendChild(storage)
                storage.addBehavior('#default#userData')
                storage.load(localStorageName)
                var result = storeFunction.apply(store, args)
                storageOwner.removeChild(storage)
                return result
            }
        }

        var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g")

            function ieKeyFix(key) {
                return key.replace(forbiddenCharsRegex, '___')
            }
        store.set = withIEStorage(function(storage, key, val) {
            key = ieKeyFix(key)
            if (val === undefined) {
                return store.remove(key)
            }
            storage.setAttribute(key, store.serialize(val))
            storage.save(localStorageName)
            return val
        })
        store.get = withIEStorage(function(storage, key) {
            key = ieKeyFix(key)
            return store.deserialize(storage.getAttribute(key))
        })
        store.remove = withIEStorage(function(storage, key) {
            key = ieKeyFix(key)
            storage.removeAttribute(key)
            storage.save(localStorageName)
        })
        store.clear = withIEStorage(function(storage) {
            var attributes = storage.XMLDocument.documentElement.attributes
            storage.load(localStorageName)
            for (var i = 0, attr; attr = attributes[i]; i++) {
                storage.removeAttribute(attr.name)
            }
            storage.save(localStorageName)
        })
        store.getAll = withIEStorage(function(storage) {
            var attributes = storage.XMLDocument.documentElement.attributes
            var ret = {}
            for (var i = 0, attr; attr = attributes[i]; ++i) {
                var key = ieKeyFix(attr.name)
                ret[attr.name] = store.deserialize(storage.getAttribute(key))
            }
            return ret
        })
    }

    try {
        store.set(namespace, namespace)
        if (store.get(namespace) != namespace) {
            store.disabled = true
        }
        store.remove(namespace)
    } catch (e) {
        store.disabled = true
    }
    store.enabled = !store.disabled
    if (typeof module != 'undefined' && module.exports) {
        module.exports = store
    } else if (typeof define === 'function' && define.amd) {
        define(store)
    } else {
        Utils.Store = store
    }


    // http://timeago.yarp.com/

    Utils.timeAgo = function(timestamp) {
        if (timestamp instanceof Date) {
            return inWords(timestamp);
        } else if (typeof timestamp === "string") {
            return inWords(Utils.timeAgo.parse(timestamp));
        } else if (typeof timestamp === "number") {
            return inWords(new Date(timestamp));
        } else {
            return inWords(Utils.timeAgo.datetime(timestamp));
        }
    };

    Utils.timeAgo = _.extend(Utils.timeAgo, {
        settings: {
            refreshMillis: 60000,
            allowFuture: false,
            localeTitle: false,
            cutoff: 0,
            strings: {
                prefixAgo: null,
                prefixFromNow: null,
                suffixAgo: "ago",
                suffixFromNow: "from now",
                seconds: "less than a minute",
                minute: "about a minute",
                minutes: "%d minutes",
                hour: "about an hour",
                hours: "about %d hours",
                day: "a day",
                days: "%d days",
                month: "about a month",
                months: "%d months",
                year: "about a year",
                years: "%d years",
                wordSeparator: " ",
                numbers: []
            }
        },
        inWords: function(distanceMillis) {
            var strings = this.settings.strings;
            var prefix = strings.prefixAgo;
            var suffix = strings.suffixAgo;
            if (this.settings.allowFuture) {
                if (distanceMillis < 0) {
                    prefix = strings.prefixFromNow;
                    suffix = strings.suffixFromNow;
                }
            }

            var seconds = Math.abs(distanceMillis) / 1000;
            var minutes = seconds / 60;
            var hours = minutes / 60;
            var days = hours / 24;
            var years = days / 365;

            function substitute(stringOrFunction, number) {
                var string = (stringOrFunction.isFunction) ? stringOrFunction(number, distanceMillis) : stringOrFunction;
                var value = (strings.numbers && strings.numbers[number]) || number;
                return string.replace(/%d/i, value);
            }

            var words = seconds < 45 && substitute(strings.seconds, Math.round(seconds)) ||
                seconds < 90 && substitute(strings.minute, 1) ||
                minutes < 45 && substitute(strings.minutes, Math.round(minutes)) ||
                minutes < 90 && substitute(strings.hour, 1) ||
                hours < 24 && substitute(strings.hours, Math.round(hours)) ||
                hours < 42 && substitute(strings.day, 1) ||
                days < 30 && substitute(strings.days, Math.round(days)) ||
                days < 45 && substitute(strings.month, 1) ||
                days < 365 && substitute(strings.months, Math.round(days / 30)) ||
                years < 1.5 && substitute(strings.year, 1) ||
                substitute(strings.years, Math.round(years));

            var separator = strings.wordSeparator || "";
            if (strings.wordSeparator === undefined) {
                separator = " ";
            }
            return [prefix, words, suffix].join(separator).trim();
        },
        parse: function(iso8601) {
            var s = iso8601.trim();
            s = s.replace(/\.\d+/, ""); // remove milliseconds
            s = s.replace(/-/, "/").replace(/-/, "/");
            s = s.replace(/T/, " ").replace(/Z/, " UTC");
            s = s.replace(/([\+\-]\d\d)\:?(\d\d)/, " $1$2"); // -04:00 -> -0400
            return new Date(s);
        }
    });

    function inWords(date) {
        return Utils.timeAgo.inWords(distance(date));
    }

    function distance(date) {
        return (new Date().getTime() - date.getTime());
    }

    // fix for IE6 suckage
    document.createElement("abbr");
    document.createElement("time");

    Cache.bindElement = {};
    _.each({
        timeAgo: function(date) {
            return Utils.timeAgo(date);
        },
        debug: function(optionalValue) {
            console.log("Current Context");
            console.log("====================");
            console.log(this);

            if (optionalValue) {
                console.log("Value");
                console.log("====================");
                console.log(optionalValue);
            }
        },
        bindElement: function(element, attrs, options) {
            if (attrs.fn) {
                options = attrs;
                attrs = '';
            }
            var id = Utils.genId();
            Cache.bindElement[id] = this;
            return '<' + element + ' data-binding="' + id + '" ' + attrs + '>' + options.fn(this) + '</' + element + '>';
        },
        and: _and = function(testA, testB, options) {
            if (testA && testB) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        },
        gt: gt = function(value, test, options) {
            if (value > test) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        },
        gte: gte = function(value, test, options) {
            if (value >= test) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        },
        is: _is = function(value, test, options) {
            if (value === test) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        },
        isnt: _isnt = function(value, test, options) {
            if (value !== test) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        },
        lt: lt = function(value, test, options) {
            if (value < test) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        },
        lte: lte = function(value, test, options) {
            if (value <= test) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        },
        or: _or = function(testA, testB, options) {
            if (testA || testB) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        },
        if_eq: if_eq = function(context, options) {
            if (context === options.hash.compare) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        unless_eq: unless_eq = function(context, options) {
            if (context === options.hash.compare) {
                return options.inverse(this);
            }
            return options.fn(this);
        },
        if_gt: if_gt = function(context, options) {
            if (context > options.hash.compare) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        unless_gt: unless_gt = function(context, options) {
            if (context > options.hash.compare) {
                return options.inverse(this);
            }
            return options.fn(this);
        },
        if_lt: if_lt = function(context, options) {
            if (context < options.hash.compare) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        unless_lt: unless_lt = function(context, options) {
            if (context < options.hash.compare) {
                return options.inverse(this);
            }
            return options.fn(this);
        },
        if_gteq: if_gteq = function(context, options) {
            if (context >= options.hash.compare) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        unless_gteq: unless_gteq = function(context, options) {
            if (context >= options.hash.compare) {
                return options.inverse(this);
            }
            return options.fn(this);
        },
        if_lteq: if_lteq = function(context, options) {
            if (context <= options.hash.compare) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        unless_lteq: unless_lteq = function(context, options) {
            if (context <= options.hash.compare) {
                return options.inverse(this);
            }
            return options.fn(this);
        },
        ifAny: ifAny = function() {
            var argLength, content, i, success;
            argLength = arguments.length - 2;
            content = arguments[argLength + 1];
            success = true;
            i = 0;
            while (i < argLength) {
                if (!arguments[i]) {
                    success = false;
                    break;
                }
                i += 1;
            }
            if (success) {
                return content(this);
            } else {
                return content.inverse(this);
            }
        },
        thSorter: function(current, tag, prop, title) {
            var current = current || {};
            var chevron = (current.sortBy === prop) ? '&nbsp;&nbsp;&nbsp;<i class="icon-chevron-' + current.sortDir + '"></i>' : '';
            return '<' + tag + ' class="sortable" data-prop="' + prop + '"">' + title + chevron + '</' + tag + '>';
        }
    }, function(fn, name) {
        Handlebars.registerHelper(name, fn);
    });

    Utils.getTemplateVars = function(html) {
        return _.uniq(_.compact(_.flatten((html.match(/\{\{#?[\w].+?\}\}|\{\{#if?[\w].+?\}\}/g) || []).map(function(hash) {
            return hash.replace(/#[\w.]+\s/, '').split(' ');
        })).map(function(word) {
            return word.replace(/\{\{|\}\}/g, '').replace('../', '');
        }).map(function(word) {
            return word.indexOf('"') > -1 || word.indexOf("'") > -1 || _.keys(Handlebars.helpers).indexOf(word) > -1 || word === 'else' ? undefined : word
        })));
    }

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

window.onbeforeunload = function(event) {
    Utils.Store.set('___session___', Session.data);
}