requirejs(['sarah', 'lodash'], function (app, _) {
    if(typeof(_) === 'undefined') {
        throw 'underscore or lodash is not loaded. Please update your index.js file.';
    }
    
    var root = this;

    var Utils = app.Utils;

    var fileSys = function () {};

    var files = Utils.Store.get('__FileStorageFiles__');

    if (files === undefined) {
        Utils.Store.set('__FileStorageFiles__', files = []);
    }

    fileSys.prototype.onError = function (e) {
        var msg = '';

        switch (e.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'QUOTA_EXCEEDED_ERR';
            break;
        case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            break;
        case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            break;
        case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            break;
        case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            break;
        default:
            msg = 'Unknown Error';
            break;
        };
        console.error('Error: ' + msg);
    }

    fileSys.prototype.requestFileSystem = function (successCallback, errorCallback) {
        var self = this;

        function doNext() {
            window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
            window.requestFileSystem(window.PERSISTENT, 1024 * 1024 * 1024, successCallback, (errorCallback || self.onError));
        };

        (navigator.webkitPersistantStorage || window.webkitStorageInfo).requestQuota(PERSISTENT, 1024 * 1024 * 1024, function (grantedBytes) {
            doNext();
        }, self.onError);
    }

    fileSys.prototype.getFileEntry = function (filename, successCallback, errorCallback) {
        var self = this;
        self.requestFileSystem(function (fs) {
            fs.root.getFile(
                filename, {
                    create: true,
                    exclusive: false
                },
                successCallback, (errorCallback || self.onError)
            );
        })
    }

    fileSys.prototype.store = function (filename, contents, callback) {
        var self = this;
        var callback = callback || function (item) {
                console.log(item);
            };
        var fileObj = {
            _id: Utils.genId(),
            name: filename
        }
        self.getFileEntry(fileObj._id, function (fileEntry) {
            fileEntry.createWriter(function (fileWriter) {
                fileWriter.onwriteend = function (e) {
                    files = _.without(files, _.findWhere(files, {
                        name: filename
                    }) || []);
                    files.push(fileObj);
                    console.log(files);
                    Utils.Store.set('__FileStorageFiles__', files);
                    callback.call(root, fileObj);
                };
                fileWriter.onerror = function (e) {
                    console.error(e);
                };

                // Create a new Blob and write it to log.txt.         
                var blob = new Blob([contents]);

                fileWriter.write(blob);
            });
        });

    }

    fileSys.prototype.retrieve = function (filename, callback) {
        var fileObj = _.findWhere(files, {
            name: filename
        });
        var self = this;
        var callback = callback || function (item) {
            console.log(item);
        };
        if (fileObj) {
            self.getFileEntry(fileObj._id, function (fileEntry) {
                fileEntry.file(function (fileObj) {
                    var reader = new FileReader();

                    reader.onloadend = function () {
                        callback.call(root, reader.result);
                    }

                    if (fileObj) {
                        return reader.readAsDataURL(fileObj);
                    }
                    return callback.call(root, null);
                });
            });
        }
    }

    return Utils.fileStorage = new fileSys();
});