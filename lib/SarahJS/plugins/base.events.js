;define(['sarah'], function(app){
    
    var Utils = app.Utils;
    var evts = app.Events = {};
    
    function eventHandler(e){
        
    }
    
    var evt = function(){
        this.events = {};
    };
    
    evt.prototype.registerEvent = function() {
        
    };
    
    evt.prototype.registerEvents = function(eventHash, context, data){
        
    
        _.each(eventHash, function (fn, hashStr) {
            var action = hashStr.substr(0, hashStr.indexOf(' ')).trim();
            var targets = hashStr.substr(action.length).trim();
            // console.log(action, targets);
            targets.split(',').forEach(function(target){
                var wrapper = document.querySelector(outlet + ' .' + self._name);
                console.log(outlet + '.' + self._name, wrapper);
            });
            // hashStr.split(',').forEach(function (hashStr) {
            //     var hstrArray = hashStr.trim().split(/\s+/);
            //     var tempString = hstrArray.shift();
            //     hstrArray[1] = hstrArray.join(' ');
            //     hstrArray[0] = tempString;
            //     var elems = target.querySelectorAll(hstrArray[1]);
            //     if (elems.length > 0) {
            //         for (var i = 0; i < elems.length; ++i) {
            //             var elem = elems[i];
            //             elem.addEventListener(hstrArray[0], function (e) {
            //                 var bindingId = this.getAttribute('data-binding');
            //                 var data = {};
            //                 if (bindingId) {
            //                     data = Cache.bindElement[bindingId];
            //                 }
            //                 if (hstrArray[0] === 'submit' && this.tagName === 'FORM') {
            //                     data = Utils.serializeForm(this);
            //                 }
            //                 fn.apply(data, [
            //                     e,
            //                     this
            //                 ]);
            //             });
            //         }
            //     }
            // });
        });
    };
    
    evt.prototype.unregisterEvent = function(eventHash) {
        
    };
    
    
    return app.Event = new evt();
    
    

});

