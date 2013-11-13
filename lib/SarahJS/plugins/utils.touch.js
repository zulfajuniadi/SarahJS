define(['sarah', 'lodash'], function(app, _){
    if(typeof(_) === 'undefined') {
        throw 'underscore or lodash is not loaded. Please update your index.js file.';
    }
    var touch;
    var target;
    var timeStamp;
    var Utils = app.Utils;
    var timeout;
    var triggered = true;

    function doTouchStart(e) {

        if( navigator.userAgent.match(/Android/i)) {
            e.preventDefault();
        }

        var seen = [];
        triggered = false;
        touch = _.extend({}, e.changedTouches[0]); //clone for safari
        target = e.target;

        timeout = setTimeout(function(){
            if(!triggered) {
                Utils.triggerEvent(target, 'tap');
                triggered = true;
            }
        }, 200);
    }

    function doTouchEnd(e, elem) {
        if( navigator.userAgent.match(/Android/i)) {
            e.preventDefault();
        }
        if(!triggered) {
            clearTimeout(timeout);
            var newtouch = _.extend({}, e.changedTouches[0]);
            var dt = e.timeStamp - timeStamp, evt;
            var ly = newtouch.pageY - touch.pageY;
            var lx = newtouch.pageX - touch.pageX;

            if(Math.sqrt(Math.pow((newtouch.pageX - touch.pageX), 2) + Math.pow((newtouch.pageY - touch.pageY), 2)) > 5) {
                if(Math.abs(ly) > Math.abs(lx)) {
                    if(ly > 0)
                        evt = 'swipedown';
                    else
                        evt = 'swipeup';

                } else {
                    if(lx > 0)
                        evt = 'swiperight';
                    else
                        evt = 'swipeleft';
                }
            }
            
            if(typeof evt !== "undefined") {
                Utils.triggerEvent(target, evt);
                triggered = true;
            }
        }
    }

    var fn = {};
    
    document.body.addEventListener('touchstart', doTouchStart, false);
    document.body.addEventListener('touchmove', doTouchEnd, false);

    return fn;
})


