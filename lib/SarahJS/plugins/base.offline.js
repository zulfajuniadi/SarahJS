;define(['sarah', 'jquery'], function(app, jQuery){
    if(typeof(jQuery) === 'undefined') {
        throw 'jQuery (or Zepto) is not loaded. Please update your index.js file.';
    }
    
    var fn = function(options) {

        var options = options || {};

        /* url to check */
        this.checkUrl = options.checkUrl || '/';

        /* Interval to check */
        this.interval = options.interval || 10000;

        /* Tooltip */
        this.tooltips = options.tooltips || true;

        /* Messages */
        var mess = this.messages = {};
        mess.onOnlineText = 'And we\'re back!';
        mess.onOfflineText = 'It seems that you\'re offline';
        mess.onOfflineRecheckText = 'Retest Connection';

        /* Fail threshold */
        this.failThreshold = 3;

        /* Max timeout */
        this.maxTimeout = options.maxTimeout || 60000;

        /* Auto start */
        this.autoStart = options.autoStart || true;

        /* Ticker dom ID */
        this.tickerDomId = options.tickerDomId || 'offlineTicker';

        /* debug */
        this.debug = options.debug || false;

        /* private vars */
        this._interval;
        this._failed = 0;
        this._originalInterval = this.interval;
        this._onceOnline = [];
        this._onceOffline = [];
        this._tickerElement;

        /* create dom element */

        if(this.tooltips) {
            this.createDom();
        }

        if(this.autoStart) {
            this.setInterval(this.interval, true);
        }
    }

    fn.prototype.createDom = function() {
        var self = this;
        var ticker = this._tickerElement = document.createElement('div');
        ticker.id = this.tickerDomId;
        ticker.style.display = 'none';
        ticker.textContent = this.messages.onOnlineText;

        this._onceOffline.push(function(){
            ticker.textContent = self.messages.onOfflineText;
            ticker.style.display = 'block';
        });

        this._onceOnline.push(function(){
            ticker.textContent = self.messages.onOnlineText;
            ticker.style.display = 'none';
        });

        document.body.appendChild(ticker);
    }

    fn.prototype.start = function() {
        var self = this;
        this._interval = setInterval(function(){
            jQuery.ajax({
                type : 'HEAD',
                async : true,
                cached : false,
                url : self.checkUrl,
                success : function() {
                    if(self._failed > 0) {
                        self._failed = 0;
                        self.setInterval(self._originalInterval);
                        self._onceOnline.forEach(function(fn){
                            fn.call(window, fn);
                        });
                    }
                    self.status = 'online';
                },
                error : function() {
                    self._failed += 1;
                    self.status = 'intermittent';

                    if(self.debug) {
                        console.error('Has been offline ' + self._failed + ' times');
                    }

                    var interval = self.interval + 1000;
                    if(interval > self.maxTimeout) {
                        interval = self.maxTimeout;
                    }
                    if(self._failed === self.failThreshold) {
                        self._onceOffline.forEach(function(fn){
                            fn.call(window);
                        });
                    }
                    if(self._failed >= self.failThreshold) {
                        self.status = 'offline';
                    }
                    self.setInterval(interval, false);
                }
            })
        }, self.interval);
    }

    fn.prototype.stop = function() {
        clearTimeout(this._interval);
        return true;
    }

    fn.prototype.setInterval = function(num, overwriteOriginalInterval) {
        if(this.debug) {
            console.error('base.offline.js started ' + num);
        }
        if(app.Utils.isNumber(num) && num >= 1000) {
            this.stop();
            this.interval = num;
            if(!overwriteOriginalInterval === false) {
                this._originalInterval = num;
            }
            this.start();
            return num;
        }
        return null;
    }

    return app.Utils.offline = new fn();
});