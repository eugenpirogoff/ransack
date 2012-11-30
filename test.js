/**
* This library includes several functions, which provide parsing
* of the Twitter JSON format such as media, urls
**/
var request = require("request");

/**
* Patterns
**/
var instagramPattern = /instagram.com\//;
var instagramPattern2 = /instagr\.am\//;

function parseInstagram(url) {
	var regex = /<img class="photo" [^>]*>/m;
	var httpregex = /http[^"]*/;
	var imageurl;
	request(url,
        function(error, response, body){
        	if (!error && response.statusCode == 200) {
        		var temp = body.match(regex)[0];
        		console.log(temp.match(httpregex));
        	}
      	}
    );
	console.log("seeehr interessant!");
}

parseInstagram("http://instagram.com/p/Q2s_F5GttL/");