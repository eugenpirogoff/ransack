/**
* This library includes several functions, which provide parsing
* of the Twitter JSON format such as media, urls
**/
var request = require("request");

var TWITTERURL = "http://search.twitter.com/search.json";
/**
* Patterns
**/

/**
* Constructor for the Parser
*/
var Parser = function(tweets) {
	// Counting the website calls for synchronising issues
	this.counter = 0;
	this.tweets = tweets.results;
	
	this.formattedTweets = [];
	// Goal, which the counter is supposed to reach
	this.goal = this.tweets.length;
}

/* Getting the media url out of twitter JSON */
function parseMedia(result) {
	var media = [];
	for (var photo in result.entities.media) {
    	media.push(result.entities.media[photo].media_url);
    }
    return media;
}

/**
* Function to parse the Tweets
* This is the place, where the Callback function onLoaded is being called
* after all tasks have been finished
*/
Parser.prototype.parseTweets = function() {
	var self = this;
	for (var i = 0 in this.tweets) {
        // Filling the tweets with basic information
        this.parseTweet(this.tweets[i],function() {
        	self.counter++;
        	/** Calling onLoaded callback if all tweets have been processed **/
        	if ( self.counter == self.goal && self.onLoaded != undefined ) {
        		self.onLoaded(self.formattedTweets);
        	}
        });
    }
    console.log("Request ready!");
}
/*
* Parsing a single tweet
*/
Parser.prototype.parseTweet = function(result,countercallback) {
	var self = this;
	/*
	 * Calling parse URL´s from here. Once finished, callback will
	 * assemble the final JSON
	 * Additionally: Performing validation if geo coord is set
	 */
	if (result.geo) {
    	this.parseUrls(result.entities.urls,function(urls) {
    		/* Checking if there is media anyways */
    		if ( parseMedia(result).length > 0 || urls.length > 0 ) {
    			var formattedTweet =  {
	       			from_user:result.from_user,
    	   			text:result.text,
	       			profile_image:result.profile_image_url,
    	   			media: parseMedia(result).concat(urls),
       				geo: result.geo,
       				url: "http://twitter.com/"+result.from_user+"/status/"+result.id
       			};
    			self.formattedTweets.push(formattedTweet);
       		}
	       	// Calling the Countercallback
       		countercallback();
       	});
	}
	else
		countercallback();
}
    
/**
* Parsing the URLs from the entities.urls data set
* Checking if the URL is a picture or an equivalent picture service (like instagram)
* Returning the absolute URL´s
*/
Parser.prototype.parseUrls = function(urls,callback) {
	var self = this;
	/** First, let´s define some kraken search patterns for urls */
	// INSTAGRAM
	var instagramPattern = /instagram.com\//;
	var instagramPattern2 = /instagr\.am\//;
	/*********************************************************/
	// Array for resolved urls
	var resolved = [];
	// Return array
	var imageurls = [];
	// Counters
	var counter = 0;
	var goal = 0;
	
	// Filling up the resolved array with the URLs
	for (var i in urls) {
		resolved.push(urls[i].expanded_url);
	}
	// Setting the goal
	goal = resolved.length;
		
	/* Now applying several RegEx tests for further parsing
	 * Each picture service parser needs an instance
	 * instagram: parseInstagram
	 */
	if (resolved.length > 0) {
		for (var i in resolved) {
			if (instagramPattern.test(resolved[i]) || instagramPattern2.test(resolved[i])) {
				// Testing if end of the loop reached
				i == resolved.length?
					parseInstagram(resolved[i],true):
					parseInstagram(resolved[i],false);
			} else {
				counter++;
			}
			if (counter == goal) {
				callback(imageurls);
			} 
		}
	} 
	else {
		callback(imageurls);
		return;
	}
	/**
	* Embedded function for parsing instagram URLs
	* @param url: URL to the instagram page
	* @param instance: instance of the Parser object
	*/
	function parseInstagram(url,isLast) {
		/* Defining regexes for instagram */
		var regex = /<img class="photo" [^>]*>/m;
		var httpregex = /http[^"]*/;
		/*
		* Requesting Web URL, parsing the HTML code, looking for the required image url
		*/
		request(url,
        	function(error, response, body){
        		if (!error && response.statusCode == 200) {	
        			if ( regex.test(body) ) {        		
        				imageurls.push(body.match(regex)[0].match(httpregex)[0]);
        			}
        		}
        		counter++;
        		isLast || counter==goal?callback(imageurls):counter--;
        		
      		}
    	);
    }
}

/**
* Function STUB for callback function. To be set by the invoker
*/
Parser.prototype.onLoaded;

/**
* Further functions for twitter handling
*/
function buildTwitterUrl(properties) {
	var result = TWITTERURL;
	result = result.concat('?');
	for (prop in properties) {
		result = result.concat('&' + prop + '=' + properties[prop]);
	}
	return result;
}

exports.Parser = Parser;
exports.buildTwitterUrl = buildTwitterUrl;
exports.TWITTERURL = TWITTERURL;