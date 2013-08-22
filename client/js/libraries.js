var Sarah = Sarah || {};

;
(function(Handlebars, Sarah) {

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
})(Handlebars, Sarah);

window.onbeforeunload = function(event) {
    Utils.Store.set('___session___', Session.data);
}