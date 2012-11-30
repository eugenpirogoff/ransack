var application_root = __dirname,
    express = require("express"),
    path = require("path"),
    mongoose = require("mongoose"),
    request = require("request"),
    routes = require("./routes");
    twitterutils = require("./twitterutils");

/**
* REQUEST HANDLERS
* Sorted by GET and POST type
*/
var twitterURL = "http://search.twitter.com/search.json?q=*&rpp=600&include_entities=true&result_type=mixed&geocode=";

// GET HANDLERS
function getSearch(req,res) {
  res.send('GET event to /search returns a list of Searches');
}
function getSearchById(req,res) {
  res.send('GET event to /search/:id returns a speacial Search by its ID');
}
function getSearchByUser(req,res) {
  res.send('GET event to /search/user returns a list of Searches for a special User');
}

// POST handlers
function postSearch(req,res) {
    var coord1 = req.body.formcoord1.slice(0,10);
    var coord2 = req.body.formcoord2.slice(0,10);
    var radius = req.body.formradius;

	var searchstring = twitterURL+coord1+","+coord2+","+radius+"km";
	console.log("Request to the following coordinates");
    console.log("Lat : "+coord1);
    console.log("Long : "+coord2);
 
  	var data;
  	/* Requesting JSON data from twitter
  	* if succeeded, callback is defining the twitter parser and defining a callback
  	* method
  	*/
  	request.post({ url: searchstring,
    	headers: {'Content-Type': 'application/json'},
    	body: JSON.stringify({ a: 1, b: 2,c: 3})},
    	// CALLBACK FUNCTION
        function(error, response, body){
        	if (!error && response.statusCode == 200) {
        		// Getting parser
        		var parserObj = new twitterutils.Parser(body);

        		// Defining callback for parserObj
        		parserObj.onLoaded = function(tweets) {
        			res.render('tweets',{tweets : tweets});
        		}
        		parserObj.parseTweets();
        	} else {
        		res.render('error');
        	}
      	}
    );
}

function postSearchByUser(req,res) {
  res.send('POST event to /search/user and creates a Search Event of the given Data for a special User');
}

exports.getSearch = getSearch;
exports.getSearchById = getSearchById;
exports.getSearchByUser = getSearchByUser;
exports.postSearch = postSearch;
exports.postSearchByUser = postSearchByUser;
