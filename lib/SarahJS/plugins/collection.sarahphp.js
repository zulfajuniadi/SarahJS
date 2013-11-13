define(['sarah', 'jquery'], function(app, jQuery){
    if(typeof(app.Runtime.Poller) === 'undefined') {
        throw 'base.poller.js is not loaded. Please update your index.js file.';
    }
    var sarahPoller = function(name, options) {
        this.name = name;
        this.options = options;
        this.mtime = 0 //app.Utils.Store.get('MTIME:' + this.name);
        app.Runtime.Poller.setCollection(name);
        this.init();
        this.lastRequest = [];
        this.firstRun = true;
    }

    sarahPoller.prototype.updateData = function(mtime) {
        var self = app.Collections[this.name];
        var that = this;

        jQuery.ajax({
            url: '/sarahphp/poller/' + self.name + '/' + that.mtime,
            method: 'GET',
            contentType: 'application/json',
            success: function(res) {
                if (that.lastRequest.indexOf(res.data.rid) === -1) {
                    self.merge(res.data.collection, true);
                    console.log(that.name + ' Updated');
                }
                if (that.firstRun) {
                    that.firstRun = false;
                    if (that.options.onLoad) {
                        that.options.onLoad();
                    }
                }
                // app.Utils.Store.set('MDATA:' + that.name, self.data);
            },
            error: function() {
                console.log('Poller! Reverting Changes');
            }
        });

        // mtime is set here so that multiple calls are avoided
        that.mtime = app.Runtime.Poller.collectionData[that.name] = mtime;
        app.Utils.Store.set('MTIME:' + that.name, mtime);
    }

    sarahPoller.prototype.init = function() {
        var self = app.Collections[this.name];
        var that = this;


        Utils.subscribe('COLLECTION:INSERT:' + that.name, function(data) {
            var revertData = data.r;
            delete data.r;
            var rid = Utils.genId();
            that.lastRequest.push(rid);
            jQuery.ajax({
                url: '/sarahphp/poller/' + that.name,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    rid: rid,
                    data: data
                }),
                processData: false,
                error: function() {
                    if(that.revert)
                        that.revert(revertData);
                }
            });
        });

        Utils.subscribe('COLLECTION:UPDATE:' + that.name, function(data) {
            var revertData = data.r;
            delete data.r;
            var rid = Utils.genId();
            that.lastRequest.push(rid);
            jQuery.ajax({
                url: '/sarahphp/poller/' + that.name + '/' + data._id,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({
                    rid: rid,
                    data: data
                }),
                processData: false,
                error: function() {
                    if(that.revert)
                        that.revert(revertData);
                }
            });
        });

        Utils.subscribe('COLLECTION:REMOVE:' + that.name, function(data) {
            var revertData = data.r;
            delete data.r;
            var rid = Utils.genId();
            that.lastRequest.push(rid);
            jQuery.ajax({
                url: '/sarahphp/poller/' + that.name + '/' + data._id,
                type: 'DELETE',
                contentType: 'application/json',
                data: JSON.stringify({
                    rid: rid
                }),
                processData: false,
                error: function() {
                    if(that.revert)
                        that.revert(revertData);
                }
            });
        });
    }
    app.Runtime.Persistance.sarahphp = sarahPoller;
})
