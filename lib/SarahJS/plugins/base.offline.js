;define(['sarah', 'jquery'], function(app, $){
    var fn = function(options) {

        /* url to check */
        this.checkUrl = options.checkUrl || '/';

        /* Interval to check */
        this.interval = options.interval || 20000;

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
        this.maxTimeout = options.maxTimeout || 300000;

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
            this.start();
        }
    }

    fn.prototype.createDom = function() {
        var self = this;
        var ticker = this._tickerElement = document.createElement('div');
        ticker.id = this.tickerDomId;
        ticker.style.display : 'none';
        ticker.textContent = this.messages.onOnlineText;

        this._onceOffline.push(function(){
            ticker.textContent = self.messages.onOfflineText;
            ticker.style.display : 'block';
        });

        this._onceOnline.push(function(){
            ticker.textContent = self.messages.onOnlineText;
            ticker.style.display : 'none';
        });

        document.body.appendChild(ticker);
    }

    fn.prototype.start = function(num) {
        var self = this;
        this._interval = setInterval(function(){
            $.ajax({
                type : 'HEAD',
                async : true,
                cached : false,
                url : self.checkUrl,
                success : function() {
                    if(self._failed > 0) {
                        self._failed = 0;
                        self.setInterval(self._originalInterval);
                        self.onceOnline.forEach(function(fn){
                            fn.call(window, fn);
                        });
                    }
                },
                error : function() {
                    self._failed += 1;

                    if(self.debug) {
                        console.error('Has been offline ' + self._failed + ' times');
                    }

                    var interval = self.interval * 2;
                    if(interval > self.maxTimeout) {
                        interval = self.maxTimeout;
                    }
                    if(self._failed === self.failThreshold) {
                        self.onceOffline.forEach(function(fn){
                            fn.call(window);
                        });
                    }
                    self.setInterval(interval, false);
                }
            })
        }, (function(){
            return self._interval;
        }));
    }

    fn.prototype.stop = function() {
        clearTimeout(this._interval);
        return true;
    }

    fn.prototype.setInterval = function(num, overwriteOriginalInterval) {
        if(self.debug) {
            console.error('base.offline.js started');
        }
        if(Utils.isNumeric(num) && num > 1000) {
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
});