define(['sarah', 'lodash'], function(app, _){
    var touch;
    var target;
    var timeStamp;
    var Utils = app.Utils;
    var timeout;

    function doTouchStart(e) {
        var seen = [];
        touch = _.extend({}, e.changedTouches[0]); //clone for safari
        target = e.target;
    }

    function doTouchEnd(e) {
        var newtouch = e.changedTouches[0];
        var dt = e.timeStamp - timeStamp;
        evt = 'tap';

        if(Math.sqrt(Math.pow((newtouch.pageX - touch.pageX), 2) + Math.pow((newtouch.pageY - touch.pageY), 2)) > 30) {
            var ly = newtouch.pageY - touch.pageY;
            var lx = newtouch.pageX - touch.pageX;
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
        } else if (dt > 1000) {
            evt = 'hold';
        }

        Utils.triggerEvent(target, evt);
    }

    Utils.touch = function(selector) {
        var elements = document.querySelectorAll(selector);
        if(elements.length > 0) {
            for(i = 0; i < elements.length; i++) {
                elements[i].addEventListener('touchstart', doTouchStart, false);
                elements[i].addEventListener('touchend', doTouchEnd, false);
            }
        }
    }

    Utils.untouch = function(selector) {
        var elements = document.querySelectorAll(selector);
        if(elements.length > 0) {
            for(i = 0; i < elements.length; i++) {
                elements[i].removeEventListener('touchstart', doTouchStart);
                elements[i].removeEventListener('touchend', doTouchEnd);
            }
        }
    }

    return Utils.touch('body');
})


