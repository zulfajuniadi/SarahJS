define(['sarah', 'lodash'], function(app, _){
    window.Sarah = app;
    var Utils = app.Utils;
    var Session = app.Session;
    var gui = require('nw.gui');
    var win = gui.Window.get();
    var shell = gui.Shell;


    function createHiddenElement(id, elementType, attrs, changeCallback) {
        var attrs = _.extend({
            type : 'hidden',
            name : Utils.genId(),
            style : {
                display : 'none',
                visibility : 'hidden'
            }
        }, (attrs || {}));
        var el = document.getElementById(id);
        var created = false;
        if(el === null) {
            el = document.createElement(elementType);
            el.id = id;
            created = true;
        }
        _.each(attrs, function(val, attr){
            el[attr] = val;
        });
        _.each(attrs.style, function(val, attr){
            el.style[attr] = val;
        });
        if(created) {
            el.onchange = changeCallback;
            document.body.appendChild(el);
        }
        return el;
    }

    function parseSize(width, height) {

        var width = parseInt(width || 0, 10);
        var height = parseInt(height || 0, 10);

        width = Utils.isNumber(width) ? width : 600;
        height = Utils.isNumber(height) ? height : 400;

        height += 24;

        return {
            width : width,
            height : height
        }
    }

    var dirsep = (process.platform == 'win32') ? '\\' : '/';
    var homedir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    var menus = {};

    return {
        gui : gui,
        process : process,
        platform : process.platform,
        homedir : homedir,
        dirsep : dirsep,
        window : {
            instance : win,
            resizeTo : function(width, height) {
                var size = parseSize(width, height);
                return win.resizeTo(size.width, size.height);
            },
            setMaximumSize : function(width, height) {
                var size = parseSize(width, height);
                return win.setMaximumSize(size.width, size.height);
            },
            setMinimumSize : function(width, height) {
                var size = parseSize(width, height);
                return win.setMinimumSize(size.width, size.height);
            },
            setResizable : function(bool) {
                var bool = bool || true;
                return win.setResizable(bool);
            },
            devTool : function(id) {
                return win.showDevTools(id);
            }
        },
        fileDialog : {
            pickFile : function(defaultPath, callback) {
                var defaultPath = defaultPath || Session.get('lastPath', null) || homedir;
                var el = createHiddenElement('NWPICKFILE', 'input', {
                    type : 'file',
                    nwworkingdir : defaultPath
                }, function(e){
                    var files = el.files;
                    if(files.length > 0) {
                        var path = files[0].path;
                        path = path.substring(0, path.lastIndexOf(dirsep)) + dirsep;
                        Session.set('lastPath', path);
                    }
                    el.files = '';
                    callback(files[0]);
                });
                el.focus();
                Utils.triggerEvent(el, 'click');

            },
            pickFiles : function(defaultPath, callback) {
                var defaultPath = defaultPath || Session.get('lastPath', null) || homedir;
                var el = createHiddenElement('NWPICKFILES', 'input', {
                    type : 'file',
                    multiple : 'multiple',
                    nwworkingdir : defaultPath
                }, function(e){
                    var files = el.files;
                    if(files.length > 0) {
                        var path = files[0].path;
                        path = path.substring(0, path.lastIndexOf(dirsep)) + dirsep;
                        Session.set('lastPath', path);
                    }
                    el.files = '';
                    callback(files);
                });
                el.focus();
                Utils.triggerEvent(el, 'click');

            },
            pickFolder : function(defaultPath, callback) {
                var defaultPath = defaultPath || Session.get('lastPath', null) || homedir;
                var el = createHiddenElement('NWPICKFOLDERS', 'input', {
                    type : 'file',
                    nwworkingdir : defaultPath,
                    nwdirectory : 'nwdirectory'
                }, function(e){
                    var value = el.value;
                    el.value = '';
                    Session.set('lastPath', value + dirsep);
                    callback(value);
                });
                el.focus();
                Utils.triggerEvent(el, 'click');

            },
            pickFilesInFolder : function(defaultPath, callback) {
                var defaultPath = defaultPath || Session.get('lastPath', null) || homedir;
                var el = createHiddenElement('NWPICKFILESINFOLDER', 'input', {
                    type : 'file',
                    nwworkingdir : defaultPath,
                    webkitdirectory : 'webkitdirectory'
                }, function(e){
                    var files = el.files;
                    if(files.length > 0) {
                        var path = files[0].path;
                        path = path.substring(0, path.lastIndexOf(dirsep)) + dirsep;
                        Session.set('lastPath', path);
                    }
                    el.files = '';
                    callback(files);
                });
                el.focus();
                Utils.triggerEvent(el, 'click');

            },
            pickSaveAs : function(defaultName, defaultPath, callback) {
                var defaultPath = defaultPath || Session.get('lastPath', null) || homedir;
                var defaultName = defaultName || true;
                var el = createHiddenElement('NWSAVEAS', 'input', {
                    type : 'file',
                    nwworkingdir : defaultPath,
                    nwsaveas : defaultName
                }, function(e){
                    var path = el.value;
                    rootPath = path.substring(0, path.lastIndexOf(dirsep)) + dirsep;
                    el.value = '';
                    Session.set('lastPath', rootPath);
                    callback(path);
                });
                el.focus();
                Utils.triggerEvent(el, 'click');

            }
        },
        menus : menus,
        menu : {

            /* menu */

            create : function(id, items) {
                var menu = new gui.Menu();
                items.forEach(function(item){
                    menu.append(new gui.MenuItem(item));
                });
                menus[id] = menu;
            },
            insert : function(id, MenuItem, pos) {
                if(typeof menus[id] !== 'undefined') {
                    var menu = menus[id];
                    var pos = pos || menu.items.length; // set at end;
                    menu.insert(MenuItem, pos);
                    return menu;
                }
                return null;
            },
            remove : function(id, label){
                var menu = menus[id];
                if(typeof menu !== 'undefined') {
                    var MenuItems = menu.items.filter(function(item){
                        return item.label === 'label';
                    });
                    if(MenuItems.length > 0) {
                        menu.remove(MenuItems[0]);
                        return MenuItems[0];
                    }
                }
                return null;
            },
            show : function(id, x, y) {

                var x = parseInt(x, 10), y = parseInt(y, 10);

                x = Utils.isNumber(x) ? x : 0;
                y = Utils.isNumber(y) ? y : 0;

                var menu = menus[id];
                if(typeof menu !== 'undefined') {
                    menu.popup(x, y);
                    return menu;
                }
                return null;


            },

            /* menuitems */

            setChecked : function(id, label, bool) {
                var bool = bool || true;
                var menu = menus[id];
                if(typeof menu !== 'undefined') {
                    var MenuItems = menu.items.filter(function(item){
                        return item.type === 'checkbox' && item.label === 'label';
                    });
                    if(MenuItems.length > 0) {
                        MenuItems[0].checked = bool;
                        return MenuItems[0];
                    }
                }
                return null;
            },
            setClick : function(id, label, callback) {
                var callback = callback || function(){};
                var menu = menus[id];
                if(typeof menu !== 'undefined') {
                    var MenuItems = menu.items.filter(function(item){
                        return item.label === 'label';
                    });
                    if(MenuItems.length > 0) {
                        MenuItems[0].click = callback;
                        return MenuItems[0];
                    }
                }
                return null;
            },
            setEnabled : function(id, label, bool) {
                var bool = bool || true;
                var menu = menus[id];
                if(typeof menu !== 'undefined') {
                    var MenuItems = menu.items.filter(function(item){
                        return item.label === 'label';
                    });
                    if(MenuItems.length > 0) {
                        MenuItems[0].enabled = bool;
                        return MenuItems[0];
                    }
                }
                return null;
            }
        },
        shell : {
            showFile : function(path) {
                return shell.showItemInFolder(path);
            },
            openFile : function(path) {
                return shell.openItem(path);
            },
            openUri : function(path) {
                return shell.openExternal(path);
            }
        }
    }
})