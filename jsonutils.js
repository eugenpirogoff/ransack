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

Parser.prototype.parseTweets = function() {
	for (var i = 0 in this.tweets) {
        // Filling the tweets with basic information
        this.parseTweet(this.tweets[i]);
    }
    console.log("Request ready!");
    /*
    * Internal function parsing single tweets
    */
}
Parser.prototype.parseTweet = function(result) {
    console.log("Counter: " + this.counter + ", Goal: " + this.goal);
    parseUrls(result.entities.urls,function(urls) {
    	console.log("callback call");
    	var formattedTweets = [];
    	formattedTweets.push( {
       		from_user:result.from_user,
       		text:result.text,
       		profile_image:result.profile_image_url,
       		media: parseMedia(result),
       		urls: urls
       	});
       	
       	this.counter++;
       	// If all tweets have been processed, return filled array
       	if (this.counter == this.goal) {
       		this.onLoaded(formattedTweets);
       	}
    });
}
Parser.prototype.	
    
/**
* Parsing the URLs from the entities.urls data set
* Checking if the URL is a picture or an equivalent picture service (like instagram)
* Returning the absolute URL´s
*/
function parseUrls(urls,callback) {
	/** First, let´s define some kraken search patterns for urls */
	var instagramPattern = /instagram.com\//;
	var instagramPattern2 = /instagr\.am\//;
	/*********************************************************/
	// Counters for the results
	var counter = 0;
	var goal = 0;
	// Array for resolved urls
	var resolved = [];
	// Return array
	var imageurls = [];
	
	// Filling up the resolved array with the URLs
	for (var i in urls) {
		resolved.push(urls[i].expanded_url);
		console.log(urls[i].expanded_url);
	}
	
	// Now applying several RegEx tests for further parsing
	for (var i in resolved) {
		if (instagramPattern.test(resolved[i]) || instagramPattern2.test(resolved[i])) {
			parseInstagram(resolved[i]);
			// incrementing goal
			goal++;
		}
	}
	var blah = [];
	callback(blah);
	/**
	* Embedded function for parsing instagram URLs
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
        			counter++;
        		} else counter++;
        		/* Checking if counter goal has been reached: Callback if so*/
        		console.log("Parse InstraCounters: " + counter + "goal: " + goal);
        		if (counter == goal)
        			callback(imageurls);
      		}
    	);
    }
}

/**
* Function STUB for callback function. To be set by the invoker
*/
Parser.prototype.onLoaded;


exports.Parser = Parser;