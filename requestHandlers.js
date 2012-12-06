var application_root = __dirname,
    path = require("path"),
    mongo = require("mongodb").MongoClient,
    request = require("request"),
    twitterutils = require("./twitterutils");
    hashcode = require("password-hash");

/**
* REQUEST HANDLERS
* Sorted by GET and POST type
*/
var twitterURL = "http://search.twitter.com/search.json?q=*&rpp=600&include_entities=true&result_type=mixed&geocode=";

// GET HANDLERS
function getSearch(req, res) {
    res.send('GET event to /search returns a list of Searches');
}
function getSearchById(req, res) {
    res.send('GET event to /search/:id returns a speacial Search by its ID');
}
function getSearchByUser(req, res) {
    res.send('GET event to /search/user returns a list of Searches for a special User');
}
function getRoot(req,res) {
	if (req.session.user) {
		res.render('index',{session:req.session.user});
		console.log(req.session.user);
	}
	else
		res.render('index',{session:""});
}
function getUserList(req, res) {
	mongo.connect("mongodb://localhost:27017/", function(err, db) {
		if (!err) {
			var collection = db.collection('users');
			collection.find().toArray(function(err,items) {
				for(item in items) {
					console.log(items[item]);
				}
			});
		}
	});
	res.render('index');
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

function postSignUp(req,res) {
	var email_pattern = /^\w+\@\w+\.\w{2,3}$/;
	var username = req.body.username;
	var pwd = req.body.password;
	var pwd_confirm = req.body.password_confirm;
	var email = req.body.email;
	/**
	* Validating data
	*/
	if (!email_pattern.test(email)) {
		res.render('error',{message:"Invalid Email Address"});
		return;
	}
	if (pwd.length < 5) {
		res.render('error',{message:"Password too short (minimum 5 characters)"});
		return;
	}
	if (pwd != pwd_confirm) {
		res.render('error',{message:"Passwords don´t match"});
		return;
	}
	/* Building User JSON */
	var user = {
		username:username,
		password:hashcode.generate(pwd),
		email:email
	};
	mongo.connect("mongodb://localhost:27017/", function(err, db) {
		var collection = db.collection('users');
		collection.find({ '$or': [ { username:username }, { email:email } ]}).toArray(function(err,items) {
			// Checking if user doesn´t exist already
			if (!err && items.length == 0) {
				collection.insert(user,function(err,result) {
					if (!err)
						res.render('error',{message:"Registration successful!"});
					else
						res.render('error',{message:"Registration failed (Database error " + err+ "."});
				});
			} else {
				res.render('error',{message:"Username or Email already registred!"});
			}
		});
	});
}

function postSignIn(req,res) {
	var username = req.body.formusername;
	var password = req.body.formpassword;
	
	mongo.connect("mongodb://localhost:27017/", function(err, db) {
		if(err)
			res.render('error',{message:"Error connecting to database"});
		var collection = db.collection('users');
		collection.find({username : username}).toArray(function(err,items) {
			if (items.length == 0) {
				res.render('error',{message:"User not found."});
				return;
			}
			if (!hashcode.verify(password,items[0].password)) {
				res.render('error',{message:"Invalid password."});
				return;
			}
			// Setting up user Session (=email)
			req.session.user = items[0].email;
			res.render('error',{message:"Logged in"});
		});
	});
}

function postSearchByUser(req,res) {
  res.send('POST event to /search/user and creates a Search Event of the given Data for a special User');
}

/* EXPORTS */
// GET
exports.getRoot = getRoot;
exports.getUserList = getUserList;
exports.getSearch = getSearch;
exports.getSearchById = getSearchById;
exports.getSearchByUser = getSearchByUser;
// POST
exports.postSearch = postSearch;
exports.postSearchByUser = postSearchByUser;
exports.postSignIn = postSignIn;
exports.postSignUp = postSignUp;
