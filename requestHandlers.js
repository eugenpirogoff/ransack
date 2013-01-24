var application_root = __dirname,
    path = require("path"),
    mongo = require("mongodb").MongoClient,
    request = require("request"),
    twitterutils = require("./twitterutils"),
    hashcode = require("password-hash"),
    log = require("./log"),
    persistence = require("./persistence"),
    fs = require("fs"),
    util = require("util"),
    url = require("url");
    

/*************************************************
* CONSTANTS
*************************************************/
var twitterURL = "http://search.twitter.com/search.json";
var email_pattern = /^\w+\@\w+\.\w{2,3}$/;
var spamTolerance = 5000; // Spam timeout in ms

// Dictionary, saving tokens with session ID as key
var sessionTokens = {};
/**
* REQUEST HANDLERS
* Sorted by GET and POST type
*/

// GET HANDLERS
function getSearches(req, res) {
	if (!req.session.user) {
		res.end();
		return;
	}
	var result;
	var username = req.session.user;
	mongo.connect("mongodb://localhost:27017/", function(err, db) {
		if(err) {
			console.log("Database error");
			return;
		}
		var collection = db.collection('users');
		collection.find({username : username}).toArray(function(err,items) {
			// Setting up user Session (=email)
			if (!err) {
				result = items[0].searches;
				res.json(result);
			}
		});
	});
}

/*
* Method for the / request
* Checking if a session cookie exists
*/
function getRoot(req,res) {
	var token = Date.now();
	// Setting session
	req.session.checkSum = token;
	req.session.isFirst = true;
	sessionTokens[req.session._id] = token 
	// Delivering Page
	res.sendfile('public/index.html');	
}
/************************************
* GET for zipped images
************************************/
function getDownloadSearch(req,res) {
	if (!req.session.user) {
		res.end();
		return;
	}
	res.setHeader("Content-type: application/octet-stream");
	res.setHeader('Content-disposition: attachment; filename="images.zip"'); 
	var url_parts = url.parse(req.url, true);
	var timestamp = url_parts.query.timestamp;
	var filePath = 'images/'+req.session.user+'/'+timestamp+'/images.zip'; 
	// Creating readStream
	var readStream = fs.createReadStream(filePath);
    // We replaced all the event handlers with a simple call to util.pump()
    util.pump(readStream, res);

}
/**
* Returning if user is already logged in
*/
function getLoginStatus(req,res) {
	if (req.session.user) {
		res.json({login:true,username:req.session.user,email:req.session.email});
	} else {
		res.send({login:false});
	}
}	
function getLogout(req, res) {
	if (req.session.user) {
		req.session.destroy();
		res.redirect('/');
	} else {
		res.render('error',{message:"Not logged in actually.."});
	}
}

// POST handlers
/****************************************
* SEARCH handler for twitter request
*****************************************/
function postSearch(req,res) {
	/**************************************************
	* Spam protection
	**************************************************/
	if (!req.session || spamProtection(req.session,req.body.checkSum)) {
		res.json({error:"You shall not spam !"});
		console.log("Spam detected...");
		return;
	}
	sessionTokens[req.session._id] = 0;
    var lat = req.body.lat;
    var lng = req.body.lng;
    var radius = req.body.radius;
    var address = req.body.address?req.body.address:false;
	var properties = {
		q : '*',
		rpp : '100',
		include_entities : 'true',
		result_type : 'mixed',
		geocode : lat+','+lng+','+radius+'km',
		page : '1'
	}
	var searchstring = twitterutils.buildTwitterUrl(properties);
	//console.log("Request to "+lat+"   "+lng);
 
  	var data;
  	/* Requesting JSON data from twitter
  	* if succeeded, callback is defining the twitter parser and defining a callback
  	* method
  	*/
  	var tweets = { results : [] };
  	console.log("Sending request to twitter...");
  	//console.log("Processing resultpage...");
  	requestTweets(searchstring);
  	
  	function requestTweets(url) {
  		request.get(url,
  		function(error, response, body){
        	if (!error && response.statusCode == 200) {
        		var result = JSON.parse(body);
    	    	tweets.results = tweets.results.concat(result.results);
    	    	// If still pages available, recursive call
    	    	if (result.next_page) {
    	    		requestTweets(twitterutils.TWITTERURL + result.next_page);
    	    	} 
    	    	// If no more pages, start parsing process !
    	    	else {
    	    		startParsing();
        		}
        	} else {
	        	startParsing();
        	}
        	function startParsing() {
				console.log("Parsing tweets...");
    	    	var parserObj = new twitterutils.Parser(tweets);
        		/*****************************************
        		* Callback called when everything is done
        		****************************************/
        		parserObj.onLoaded = function(result) {
        			if (address) {
        				result.address = address;
        			}
        			// Generating new token (UNIX timestamp)
        			var token = Date.now();
        			result.latlng = {lat:lat,lng:lng};
        			result.checkSum = token;
        			// Updating session tokens
        			req.session.checkSum = token;
        			req.session.isFirst = false;
        			res.json(result);
        			sessionTokens[req.session._id] = token;
        			/*****************************************
        			* Checking if user is logged in -> Saving search
        			****************************************/
        			if (req.session.user) {
        				persistence.persistJSON(req.session.user,result,address);
        			}
        			

        		}
        		parserObj.parseTweets();
        	}
        	
        });
    }
}

/**
* Anti Spam function
* return: true = spam, false = OK !
*/
function spamProtection(session,checksum) {
	if (session.isFirst)
		return false;
	if (sessionTokens[session._id] != checksum)
		return true;
	else
		return false;
}
/*******************************************************
* SignUp process
*******************************************************/
function postSignUp(req,res) {
	var username = req.body.username;
	var pwd = req.body.password;
	var pwd_confirm = req.body.password_confirm;
	var email = req.body.email;
	var response = { success: false };
	/******************************************************
	* Validating data
	*******************************************************/
	if (!email_pattern.test(email)) {
		response.message = "Invalid Email Addresss.";
	}
	if (pwd.length < 5) {
		response.message = "Password too short (minimum 5 characters).";
	}
	if (pwd != pwd_confirm) {
		response.message = "Passwords don´t match."
	}
	/*
	 * If any error message has been created, send json and abort
	 */
	if (response.message) {
		res.json(response);
		return;
	}
	/* Building User JSON */
	var user = {
		username:username,
		password:hashcode.generate(pwd),
		email:email,
		searches:{}
	};
	/******************************************************
	* Connecting to mongodb
	*******************************************************/
	mongo.connect("mongodb://localhost:27017/", function(err, db) {
		var collection = db.collection('users');
		collection.find({ '$or': [ { username:username }, { email:email } ]}).toArray(function(err,items) {
			// Checking if user doesn´t exist already
			if (!err && items.length == 0) {
				collection.insert(user,function(err,result) {
					if (!err) {
						response.success = true;
						response.message = "Registration successful!";
					}
					else
						response.message = "Registration failed (Database error " + err+ ".";
					res.json(response);
				});
			} else {
				response.message = "Username or Email already registered.";
				res.json(response);
			}
		});
	});
	/*******************************************************
	* Creating user images dir
	*******************************************************/
	fs.mkdir("images/"+username,0755,function(err) {
	});
}

/*******************************************************
* SignIn process (login)
*******************************************************/
function postSignIn(req,res) {
	var username = req.body.username;
	var password = req.body.password;
		
	var result = {};
	result.success = false;
	
	mongo.connect("mongodb://localhost:27017/", function(err, db) {
		if(err) {
			result.message = "Error connecting to database";
			res.json(result);
			return;
		}
		var collection = db.collection('users');
		collection.find({username : username}).toArray(function(err,items) {
			if (items.length == 0) {
				result.message = "User doesn´t exist.";
			}
			else if (!hashcode.verify(password,items[0].password)) {
				result.message = "Password not correct.";
			} else {
				// Setting up user Session (=email)
				req.session.user = items[0].username;
				req.session.email = items[0].email;
				result.success = true;
				result.username = items[0].username;
				result.email = items[0].email;
				result.message = "Logged In";
			}
			res.json(result);
		});
	});
}

/*******************************************************
* Preferences Request
*******************************************************/
function postPreferences(req,res) {
	var response = { success:false };
	// Login check
	if(!req.session.user) {
		response.message = "Not logged in. Nice try, rookie";
		res.json(response);
		return;
	}
	var username = req.session.user;
	var email = req.body.email;
	var pwdOld = req.body.passwordOld;
	var pwd = req.body.password;
	var pwd_confirm = req.body.password_confirm;
	/***
	* Connecting to Database
	***/
	mongo.connect("mongodb://localhost:27017/", function(err, db) {
		if(err) {
			response.message = "Error connecting to database";
			res.json(response);
			return;
		}
		var collection = db.collection('users');
		collection.find({username : username}).toArray(function(err,items) {
			if (items.length == 0) {
				result.message = "User doesn´t exist.";
			}
			var result = items[0];
			console.log(result);
			// Copying user to new user object
			var newUser = result;
			
			// Checking if Email has been changed
			if (email != result.email) {
				if (email.match(email_pattern)) {
					newUser.email = email;
				}
				else {
					response.message = "Invalid Email address.";
				}
			}
			// Checking if password change has been requested
			if (pwdOld.length > 0) {
				if (hashcode.verify(pwdOld,result.password)) {
					// Validating new Passwords
					if (pwd == pwd_confirm && pwd.length > 5) {
						newUser.password = hashcode.generate(pwd);
					}
					else {
						response.message = "Invalid (new) passwords.";
					}
				} else {
					response.message = "Wrong password.";
				}
			}
			// Error message thrown ?
			if (response.message) {
				res.json(response)
				return;
			}
			/**
			* Time to update the database
			*/
			collection.update({username:username},
				{$set: { email: newUser.email, password: newUser.password }},
				{w:1}, function(err,result) {
					if (!err) {
						console.log(result);
						response.success = true;
						response.message = "Changing successful!";
						// Setting new session
						req.session.user = newUser.username;
						req.session.email = newUser.email;
					} else {
						response.message = "Error updating data.";
					}
					res.json(response);
			});
		});
	});
}



function postDeleteSearch(req,res) {
	var response = { success : false };
	var timestamp = req.body.timestamp;
	var username = req.session.user;
	/***
	* Connecting to Database
	***/
	mongo.connect("mongodb://localhost:27017/", function(err, db) {
		if(err) {
			response.message = "Error connecting to database";
			res.json(response);
			return;
		}
		var collection = db.collection('users');
		collection.find({username : username}).toArray(function(err,items) {
			if (items.length == 0) {
				response.message = "User doesn´t exist.";
			}
			var result = items[0];
			console.log(result);
			// Deleting given timestamp
			delete result.searches[timestamp];
			/**
			* Time to update the database
			*/
			collection.update({username:username},
				{$set: { searches: result.searches }},
				{w:1}, function(err,result) {
					if (!err) {
						response.success = true;
						persistence.removeSearch(req.session.user,timestamp);
					}
					res.json(response);
			});
		});
	});
}



/* EXPORTS */
// GET
exports.getRoot = getRoot;
exports.getLogout = getLogout;
exports.getSearches = getSearches;
exports.getLoginStatus = getLoginStatus;
exports.getDownloadSearch = getDownloadSearch;
// POST
exports.postSearch = postSearch;
exports.postDeleteSearch = postDeleteSearch;
exports.postSignIn = postSignIn;
exports.postSignUp = postSignUp;
exports.postPreferences = postPreferences;