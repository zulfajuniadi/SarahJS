define(['sarah', 'lodash', 'Handlebars'], function(app, _, Handlebars){
    if(typeof(_) === 'undefined') {
        throw 'underscore or lodash is not loaded. Please update your index.js file.';
    }
    if(typeof(Handlebars) === 'Handlebars') {
        throw 'Handlebars is not loaded. Please update your index.js file.';
    }

    var Utils = app.Utils;
    var Cache = app.Cache;
    var Session = app.Session;
    var Template = app.Template;

    _.each({
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
        bind: function(eoptions) {
            var id = Utils.genId();
            Cache.bindElement[id] = this;
            return ' rel=boundedData data-binding = ' + id;
        },
        sessionGet : function(key) {
            return Session.get(key);
        },
        sessionHas: function(key, item, options) {
            if (Session.has(key, item)) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        sessionEq : function(key, value, options) {
            if (Session.equals(key, value)) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        and: function(testA, testB, options) {
            if (testA && testB) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        gt: function(value, test, options) {
            if(Utils.isArray(value)) {
                value = value.length;
            }
            if (value > test) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        gte: function(value, test, options) {
            if(Utils.isArray(value)) {
                value = value.length;
            }
            if (value >= test) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        is: function(value, test, options) {
            if (value === test) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        isnt: function(value, test, options) {
            if (value !== test) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        lt: function(value, test, options) {
            if(Utils.isArray(value)) {
                value = value.length;
            }
            if (value < test) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        lte: function(value, test, options) {
            if(Utils.isArray(value)) {
                value = value.length;
            }
            if (value <= test) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        or: function(testA, testB, options) {
            if (testA || testB) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        length: function(items, attr, value) {
            if(items && Utils.isString(attr)) {
                return _.filter(items, function(item){
                    if(Utils.isObject(value)) {
                        value = true;
                    }
                    return item[attr] === value;
                }).length || 0;
            }
            else if (items) {
                if (items.length !== undefined) {
                    return items.length || 0;
                } else {
                    var length = 0,
                        key;
                    for (key in items) {
                        if (items.hasOwnProperty(key)) length++;
                    }
                    return length || 0;
                }
            }
            return 0;
        },
        if_eq: function(context, options) {
            if (context === options.hash.compare) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        unless_eq: function(context, options) {
            if (context === options.hash.compare) {
                return options.inverse(this);
            }
            return options.fn(this);
        },
        if_gt: function(context, options) {
            if (context > options.hash.compare) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        unless_gt: function(context, options) {
            if (context > options.hash.compare) {
                return options.inverse(this);
            }
            return options.fn(this);
        },
        if_lt: function(context, options) {
            if (context < options.hash.compare) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        unless_lt: function(context, options) {
            if (context < options.hash.compare) {
                return options.inverse(this);
            }
            return options.fn(this);
        },
        if_gteq: function(context, options) {
            if (context >= options.hash.compare) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        unless_gteq: function(context, options) {
            if (context >= options.hash.compare) {
                return options.inverse(this);
            }
            return options.fn(this);
        },
        if_lteq: function(context, options) {
            if (context <= options.hash.compare) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        unless_lteq: function(context, options) {
            if (context <= options.hash.compare) {
                return options.inverse(this);
            }
            return options.fn(this);
        },
        ifAny: function() {
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
        numberFormat: function(amount) {
            if (amount)
                return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            else
                return '';
        },

        /* async */

        asyncMethod : function(fn, options) {
            var _id = Utils.genId();
            var fn = fn.split('.') || null;

            if(fn && app.Methods[fn]) {
                var self = this;

                app.Methods[fn].apply(window, [function(){
                    var a = $('#' + _id);
                    a.after(options.fn(this));
                    a.remove();
                }, this, app, options.data]);

                var inverse = document.createElement('span');
                inverse.innerHTML = options.inverse(this);
                inverse.id = _id;
                var tmp = document.createElement("div");
                tmp.appendChild(inverse);

                return tmp.innerHTML;

            }
            console.error('method not found');
            return 'method not found';
        }


    }, function(fn, name) {
        Handlebars.registerHelper(name, fn);
    });

    Handlebars.VM.invokePartial = function(data, template, context, options) {
        var name = template;
        if (typeof Sarah.Templates[name] === 'undefined') {
            throw new Error('Template ' + template + ' not found');
        } else {
            return Sarah.Templates[name].render(context);
        }
    }

    var cached = Cache.handlebarsTemplates = {};

    Template.prototype.render = function(data) {
        var self = this;
        var context = {};
        if (data) {
            context = data;
        }
        else {
            context = this._attributes;
        }
        var ret = '';
        if(!Utils.isFunction(cached[this._name])) {
            cached[this._name] = Handlebars.compile(this._html);
        }

        if(app.Runtime.debug) {
            return cached[this._name](context, {
                data : self
            });
        }
        try {
            ret =  cached[this._name](context, {
                data : self
            });
        } catch(e) {
            ret = '';
        }
        return ret;
    }

    return {};
});