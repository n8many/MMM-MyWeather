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
var RSSParser = require('rss-parser') ;




module.exports = NodeHelper.create({
  start: function () {
    console.log('MMM-MyWeather helper started ...');
	this.fetcherRunning = false;
	this.country = null;
	this.wunderPayload = {
		current: null,
		daily: null,
		hourly: null,
		alarm: null
	};
	this.parser = new RSSParser() ;
  },


  fetchWeatherbits: function() {   
	  if(this.config.debug === 1){
		  console.log("Fetch weatherbits");
	  }   
		var self = this ;

        var wulang = this.config.lang.toLowerCase();

        var params = "?lat=" + this.config.lat;
        params += "&lon=" + this.config.lon ;
		params += "&key=" + this.config.apikey;
		params += "&lang=" + wulang;
        
		var reqError = false;

		// Current weather 
		request({
			url: this.config.apiBase + "/current" + params,
			method: 'GET'
				}, function(error, response, body){
					if(!error && response.statusCode == 200 ){
						self.wunderPayload.current = JSON.parse(body);
					}
					else{
						console.log(moment().format() + " <6a> " + self.name + ": " + error);
						reqError = true;
					}
				}
		);		
		
		// Daily forcast. Always required for moon and sunrise
		if(!reqError){
			request({
				url: this.config.apiBase + "/forecast/daily" + params,
				method: 'GET'
					}, function(error, response, body){
						if(!error && response.statusCode == 200 ){
							self.wunderPayload.daily = JSON.parse(body);
						}
						else{
							console.log(moment().format() + " <6b> " + self.name + ": " + err);
							reqError = true;
						}
					}
			);
		}

		// Hourly forcaset. Check config to see if needed.
		if(!reqError && config.hourly === 1){
			request({
				url: this.config.apiBase + "/forecast/hourly" + params,
				method: 'GET'
					}, function(error, response, body){
						if(!error && response.statusCode == 200 ){
							self.wunderPayload.hourly = JSON.parse(body);
						}
						else{
							console.log(moment().format() + " <6c> " + self.name + ": " + e);
							reqError = true;
						}
					}
			);
		}

		// Alarm 
		if (!reqError && self.config.alarmUrl != null) {
			self.parser.parseURL(self.config.alarmUrl, 
				function(error, feed) {
					if (!error) {
						self.wunderPayload.alarm = self.extractAlarminfo(feed) ;
					} else {
						console.log(moment().format() + " <6d> " + self.name + ": " + error);
						reqError = true;
					}
				}
			);
		}
		if(!reqError){
			if(this.config.debug === 1){
				console.log(moment().format() + ' WEATHER PAYLOAD ' + self.wunderPayload);
			}
			self.sendSocketNotification('WEATHERBIT',self.wunderPayload);
		}		
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
		else{
			this.fetchWeatherbits() ; // One off fetch for a new connection
		} 
        
    }
  },
  
  extractAlarminfo: function (parsedxml) {
	  var alarm = [] ;
	  var wimages = RegExp('awt:([\\d]*)[\\s]*level:([\\d]*)','g');
	  var content = parsedxml.items[0].content.replace(/Tomorrow[\s\S]*$/i, "") ;
	  var result;
	  while ((result = wimages.exec(content)) !== null) {
		alarm.push( {type: result[1], level: result[2], title: parsedxml.items[0].title } )
	  }
	  
	  if (this.config.debug === 1) {
	  console.log("Content") ;
	  console.log(parsedxml.items[0].content) ;
	  console.log ("Alarm: ") ;
	  console.log(alarm) ;
	  }
	  
	  return alarm ;
  }

});
