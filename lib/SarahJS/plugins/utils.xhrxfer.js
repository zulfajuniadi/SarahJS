;define(['sarah'], function(app){
    var root = this;
    var Utils = app.Utils;
    var fn = function(){}

    fn.prototype.download = function(url, callback) {
        var callback = callback || function(resp, xhr){
            console.log(resp);
        }
        var xhr = new XMLHttpRequest(); 
        xhr.open('GET', url, true); 
        xhr.responseType = "blob";
        xhr.onreadystatechange = function () { 
            if (xhr.readyState == 4) {
                if (callback) callback.apply(root, [xhr.response, xhr]);
            } 
        };
        xhr.send(null);
    }

    fn.prototype.upload = function() {
        /* to be implemented */
    }

    return Utils.xhrxfer = new fn();
});