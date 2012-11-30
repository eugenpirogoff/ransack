/**
* This library includes several functions, which provide parsing
* of the Twitter JSON format such as media, urls
**/
var request = require("request");

/**
* Patterns
**/

/**
* Constructor for the Parser
*/
var Parser = function(tweeties) {
	// Counting the website calls for synchronising issues
	this.counter = 0;
	this.tweets = JSON.parse(tweeties).results;
	this.formattedTweets = [];
	// Goal, which the counter is supposed to reach
	this.goal = this.tweets.length;
	console.log("Counter:" + this.counter +", Goal:"+ this.goal);
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
        	console.log("Counter: " + self.counter + ", Goal: "+self.goal);
        	/** Calling onLoaded callback if all tweets have been processed **/
        	if ( self.counter == self.goal && self.onLoaded != undefined ) {
        		self.onLoaded(self.formattedTweets);
        	}
        });
    }
    console.log("Request ready!");
}
Parser.prototype.parseTweet = function(result,countercallback) {
	var self = this;
    this.parseUrls(result.entities.urls,function(urls) {
    	self.formattedTweets.push( {
       		from_user:result.from_user,
       		text:result.text,
       		profile_image:result.profile_image_url,
       		media: parseMedia(result),
       		urls: urls
       	});
       	
       	countercallback();
    });
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
	
	// Filling up the resolved array with the URLs
	for (var i in urls) {
		resolved.push(urls[i].expanded_url);
		console.log(urls[i].expanded_url);
	}
	
	/* Now applying several RegEx tests for further parsing
	 * Each picture service parser needs an instance
	 * instagram: parseInstagram
	 */
	if (resolved.length > 0) {
		for (var i in resolved) {
			if (instagramPattern.test(resolved[i]) || instagramPattern2.test(resolved[i])) {
				parseInstagram(resolved[i]);
			} else {
				callback(imageurls);
			}
		}
	} else {
		callback(imageurls);
	}
	/**
	* Embedded function for parsing instagram URLs
	* @param url: URL to the instagram page
	* @param instance: instance of the Parser object
	*/
	function parseInstagram(url) {
		/* Defining regexes for instagram */
		var regex = /<img class="photo" [^>]*>/m;
		var httpregex = /http[^"]*/;
	
		/*
		* Requesting Web URL, parsing the HTML code, looking for the required image url
		*/
		request(url,
        	function(error, response, body){
        		if (!error && response.statusCode == 200) {
        			imageurls.push(body.match(regex)[0].match(httpregex)[0]);
        			callback(imageurls);
        		} else {
        			callback(imageurls);
        		}
      		}
    	);
    }
}

/**
* Function STUB for callback function. To be set by the invoker
*/
Parser.prototype.onLoaded;


exports.Parser = Parser;