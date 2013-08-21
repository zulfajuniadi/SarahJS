Function.prototype.isFunction = true;

var Sarah = Sarah || {};

Sarah.Utils = {
    genId: function() {
        function S4() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        }
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    }
}

Sarah.Cache = {};

/**
 * DEVELOPED BY
 * GIL LOPES BUENO
 * gilbueno.mail@gmail.com
 *
 * WORKS WITH:
 * IE 9+, FF 4+, SF 5+, WebKit, CH 7+, OP 12+, BESEN, Rhino 1.7+
 *
 * FORK:
 * https://github.com/melanke/Watch.JS
 */

"use strict";
(function(factory) {
    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else {
        // Browser globals
        window.WatchJS = factory();
        window.watch = window.WatchJS.watch;
        window.unwatch = window.WatchJS.unwatch;
        window.callWatchers = window.WatchJS.callWatchers;
    }
}(function() {

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

    setInterval(loop, 50);

    WatchJS.watch = watch;
    WatchJS.unwatch = unwatch;
    WatchJS.callWatchers = callWatchers;

    return WatchJS;

}));

(function(u) {

    // the topic/subscription hash
    var cache = u.Cache.pubsub || {}; //check for "c_" cache for unit testing

    u.Utils.publish = function( /* String */ topic, /* Array? */ args) {
        // summary:
        //      Publish some data on a named topic.
        // topic: String
        //      The channel to publish on
        // args: Array?
        //      The data to publish. Each array item is converted into an ordered
        //      arguments on the subscribed functions.
        //
        // example:
        //      Publish stuff on '/some/topic'. Anything subscribed will be called
        //      with a function signature like: function(a,b,c){ ... }
        //
        //      publish("/some/topic", ["a","b","c"]);

        var subs = cache[topic],
            len = subs ? subs.length : 0;

        //can change loop or reverse array if the order matters
        while (len--) {
            subs[len].apply(u.Utils, [args] || []);
        }
    };

    u.Utils.subscribe = function( /* String */ topic, /* Function */ callback) {
        // summary:
        //      Register a callback on a named topic.
        // topic: String
        //      The channel to subscribe to
        // callback: Function
        //      The handler event. Anytime something is publish'ed on a
        //      subscribed channel, the callback will be called with the
        //      published array as ordered arguments.
        //
        // returns: Array
        //      A handle which can be used to unsubscribe this particular subscription.
        //
        // example:
        //      subscribe("/some/topic", function(a, b, c){ /* handle data */ });

        if (!cache[topic]) {
            cache[topic] = [];
        }
        cache[topic].push(callback);
        return [topic, callback]; // Array
    };

    u.Utils.unsubscribe = function( /* Array */ handle, /* Function? */ callback) {
        // summary:
        //      Disconnect a subscribed function for a topic.
        // handle: Array
        //      The return value from a subscribe call.
        // example:
        //      var handle = subscribe("/some/topic", function(){});
        //      unsubscribe(handle);

        var subs = cache[callback ? handle : handle[0]],
            callback = callback || handle[1],
            len = subs ? subs.length : 0;

        while (len--) {
            if (subs[len] === callback) {
                subs.splice(len, 1);
            }
        }
    };


}(Sarah));


(function(H, Cache) {

    Cache.bindElement = {};

    H.registerHelper('bindElement', function(element, attrs, options) {
        if (attrs.fn) {
            options = attrs;
            attrs = '';
        }
        var id = Sarah.Utils.genId();
        Cache.bindElement[id] = this;
        return '<' + element + ' data-binding="' + id + '" ' + attrs + '>' + options.fn(this) + '</' + element + '>';
    });

})(Handlebars, Sarah.Cache);

Sarah.Utils.Store = {};

// https://github.com/marcuswestin/store.js/blob/master/store.js

;
(function(win) {
    var store = {},
        doc = win.document,
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

    // Functions to encapsulate questionable FireFox 3.6.13 behavior
    // when about.config::dom.storage.enabled === false
    // See https://github.com/marcuswestin/store.js/issues#issue/13

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
            // Since #userData storage applies only to specific paths, we need to
            // somehow link our data to a specific path.  We choose /favicon.ico
            // as a pretty safe option, since all browsers already make a request to
            // this URL anyway and being a 404 will not hurt us here.  We wrap an
            // iframe pointing to the favicon in an ActiveXObject(htmlfile) object
            // (see: http://msdn.microsoft.com/en-us/library/aa752574(v=VS.85).aspx)
            // since the iframe access rules appear to allow direct access and
            // manipulation of the document element, even for a 404 page.  This
            // document can be used instead of the current document (which would
            // have been limited to the current path) to perform #userData storage.
        try {
            storageContainer = new ActiveXObject('htmlfile')
            storageContainer.open()
            storageContainer.write('<s' + 'cript>document.w=window</s' + 'cript><iframe src="/favicon.ico"></iframe>')
            storageContainer.close()
            storageOwner = storageContainer.w.frames[0].document
            storage = storageOwner.createElement('div')
        } catch (e) {
            // somehow ActiveXObject instantiation failed (perhaps some special
            // security settings or otherwse), fall back to per-path storage
            storage = doc.createElement('div')
            storageOwner = doc.body
        }

        function withIEStorage(storeFunction) {
            return function() {
                var args = Array.prototype.slice.call(arguments, 0)
                args.unshift(storage)
                // See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
                // and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
                storageOwner.appendChild(storage)
                storage.addBehavior('#default#userData')
                storage.load(localStorageName)
                var result = storeFunction.apply(store, args)
                storageOwner.removeChild(storage)
                return result
            }
        }

        // In IE7, keys may not contain special chars. See all of https://github.com/marcuswestin/store.js/issues/40
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
        Sarah.Utils.Store = store
    }

})(this.window || global);

// http://timeago.yarp.com/

/**
 * Timeago is a jQuery plugin that makes it easy to support automatically
 * updating fuzzy timestamps (e.g. "4 minutes ago" or "about 1 day ago").
 *
 * @name timeago
 * @version 1.3.0
 * @requires jQuery v1.2.3+
 * @author Ryan McGeary
 * @license MIT License - http://www.opensource.org/licenses/mit-license.php
 *
 * For usage and examples, visit:
 * http://timeago.yarp.com/
 *
 * Copyright (c) 2008-2013, Ryan McGeary (ryan -[at]- mcgeary [*dot*] org)
 */

(function(factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'handlebars'], factory);
    } else {
        // Browser globals
        factory(Sarah.Utils, Handlebars);
    }
}(function(u, Hbs) {
    u.timeAgo = function(timestamp) {
        if (timestamp instanceof Date) {
            return inWords(timestamp);
        } else if (typeof timestamp === "string") {
            return inWords(u.timeAgo.parse(timestamp));
        } else if (typeof timestamp === "number") {
            return inWords(new Date(timestamp));
        } else {
            return inWords(u.timeAgo.datetime(timestamp));
        }
    };

    u.timeAgo = _.extend(u.timeAgo, {
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

    Hbs.registerHelper('timeAgo', function(date) {
        return u.timeAgo(date);
    });

    function inWords(date) {
        return u.timeAgo.inWords(distance(date));
    }

    function distance(date) {
        return (new Date().getTime() - date.getTime());
    }

    // fix for IE6 suckage
    document.createElement("abbr");
    document.createElement("time");
}));

Handlebars.registerHelper("debug", function(optionalValue) {
    console.log("Current Context");
    console.log("====================");
    console.log(this);

    if (optionalValue) {
        console.log("Value");
        console.log("====================");
        console.log(optionalValue);
    }
});

(function(hbs) {

    _.each({
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
        hbs.registerHelper(name, fn);
    })
})(Handlebars);

window.onbeforeunload = function(event) {
    Sarah.Utils.Store.set('___session___', Session.data);
    return message;
}