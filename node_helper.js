/* Magic Mirror
 * Module: MMM-MyWeather-wb
 *
 * By Martin Kooij (https://github.com/martinkooij)
 * Based on MMM-MyWeather
 * MIT Licensed.
 */
 

var NodeHelper = require('node_helper');
var request = require('request');
var moment = require('moment');




module.exports = NodeHelper.create({
  start: function () {
    console.log('MMM-WunderGround helper started ...');
	this.fetcherRunning = false;
	this.wunderPayload = {
		current: null,
		daily: null,
		hourly3: null
	};
  },


  fetchWeatherbits: function() {      
		var self = this ;

        var wulang = this.config.lang.toLowerCase();

        var params = "?lat=" + this.config.lat;
        params += "&lon=" + this.config.lon ;
		params += "&key=" + this.config.apikey;
		params += "&lang=" + wulang;
        
        var Wurl = this.config.apiBase + "/current" + params;
		var Wurlf = this.config.apiBase + "/forecast/daily" + params
		var Wurlf3 = this.config.apiBase + "/forecast/3hourly" + params ;
		if ( this.config.debug === 1 ) {
			console.log(moment().format() + " 4 " + this.name  + ": " + Wurl);
		}
        request({
            url: Wurl,
            method: 'GET'
                }, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        self.wunderPayload.current = JSON.parse(body);
                        // console.log(moment().format() + " <5> " + self.name + ": " + body);
						// console.log(Wurlf) ;
						request({
						url: Wurlf,
						method: 'GET'
						}, function(err, res, bd) {
							if (!err && res.statusCode == 200) {
								self.wunderPayload.daily = JSON.parse(bd);
								// console.log(moment().format() + " <5b> " + self.name + ": " + bd);
								request({
									url: Wurlf3,
									method: 'GET'
										}, function(e, r, b) {
												if (!e && r.statusCode == 200) {
												self.wunderPayload.hourly3 = JSON.parse(b) ;
												if (self.config.debug === 1) {
													console.log(moment().format() + " <5c> " + self.name + ": " + self.wunderPayload);
												}
												self.sendSocketNotification('WEATHERBIT',self.wunderPayload);
												} else {
												console.log(moment().format() + " <6c> " + self.name + ": " + error);
												}
											});
								} else {
								console.log(moment().format() + " <6b> " + self.name + ": " + error);
								}
						});
                    } else {
                        console.log(moment().format() + " <6> " + self.name + ": " + error);
                    }
				})			
	},
					
    startFetcher: function () {
		var self = this;
        this.fetcherRunning = true; 
		this.fetchWeatherbits() ;
		setTimeout(function() {
                       self.startFetcher();
                    }, self.config.updateInterval);

    },
  
  //Subclass socketNotificationReceived received.
  socketNotificationReceived: function(notification, payload) {
    // console.log(notification);
    
    var self = this;
    
    if(notification === "GET_WEATHERBIT"){
            
        this.config = payload;

        // console.log(JSON.stringify(payload));

        if ( this.config.debug === 1 ) {
			console.log('Lets get WeatherBits');
		}

        if (!this.fetcherRunning) {
            this.startFetcher();
        } 
        
    }			
    
  }

});
