define(['sarah'], function(app){
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

        $.ajax({
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


        Utils.subscribe('COLLECTION:INSERT:' + self.name, function(data) {
            var revertData = data.r;
            delete data.r;
            var rid = Utils.genId();
            that.lastRequest.push(rid);
            $.ajax({
                url: '/sarahphp/poller/' + self.name,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    rid: rid,
                    data: data
                }),
                processData: false,
                error: function() {
                    self.revert(revertData);
                }
            });
        });

        Utils.subscribe('COLLECTION:UPDATE:' + self.name, function(data) {
            var revertData = data.r;
            delete data.r;
            var rid = Utils.genId();
            that.lastRequest.push(rid);
            $.ajax({
                url: '/sarahphp/poller/' + self.name + '/' + data._id,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({
                    rid: rid,
                    data: data
                }),
                processData: false,
                error: function() {
                    self.revert(revertData);
                }
            });
        });

        Utils.subscribe('COLLECTION:REMOVE:' + self.name, function(data) {
            var revertData = data.r;
            delete data.r;
            var rid = Utils.genId();
            that.lastRequest.push(rid);
            $.ajax({
                url: '/sarahphp/poller/' + self.name + '/' + data._id,
                type: 'DELETE',
                contentType: 'application/json',
                data: JSON.stringify({
                    rid: rid
                }),
                processData: false,
                error: function() {
                    self.revert(revertData);
                }
            });
        });
    }
    app.Runtime.Persistance.sarahphp = sarahPoller;
})
