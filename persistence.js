/**
* Persistence library, offering several options to persist and retrieveimage data
**/
var request = require("request"),
	fs = require("fs"),
	path = require("path"),
	easyimage = require("easyimage"),
	exec = require("child_process").exec,
	mongo = require("mongodb").MongoClient,
	rimraf = require("rimraf");

function persistJSON(username, data,address) {
	var folderpath = "images/"+username+"/"+data.timestamp;
	fs.exists(folderpath,function(exists) {
		if(!exists) {
			fs.mkdir(folderpath,0755,function(err) {
				if(!err){
					fetchImages(function() {
						zipFiles(folderpath);
						saveSearch(username,data);
					});
				} else {
					console.log("Error creating folder "+folderpath);
				}
			});
		}
		else {
			fetchImages(function() {
				zipFiles(folderpath);
				saveSearch(username,data,address);
			});
		}
	});
	
	function fetchImages(callback) {
		var counter = 0;
		console.log("Downloading images...");
		for (var tweet in data.tweets) {

				var url = data.tweets[tweet].media[0];
				var options = { url: url, pool:{maxSockets:500}};				
				var file_name = folderpath + "/" +  path.basename(url);

			    var wstream = fs.createWriteStream(file_name);

			    wstream.on('error', function (err) {
	    		    console.log(err, url);
			    });

   				wstream.on( 'close', function(){
    				if (++counter == data.tweets.length) {
    					callback(folderpath);
    				}
			    });

			    request(options).pipe( wstream );
		}
	}	
	
}

function zipFiles(folderpath) {
	console.log("Zipping files...");
	exec("zip -rj "+folderpath+"/images.zip "+folderpath,function(err,stdout,stderr) {
		cleanPath(folderpath);
	});
	
}

/*************************************
* Cleaning up image folder after leeching
*************************************/
function cleanPath(folderpath) {
	fs.readdir(folderpath,function(err,items) {
		for (item in items) {
			if (!items[item].match(/.zip$/)) {
				fs.unlink(folderpath+'/'+items[item],function(err){});
			}
		}
	});
}

/*********************************************
* Saving the search into the DB
/*********************************************/
function saveSearch(username,data) {
	mongo.connect("mongodb://localhost:27017/", function(err, db) {
		var collection = db.collection('users');
		collection.find({username : username}).toArray(function(err,items) {
			if (items.length == 0) {
				return;
			}
			var result = items[0];
			result.searches[data.timestamp] = data;
			collection.update(
				{username:username},
				{$set:{searches:result.searches}},
				function(err,result) {
					if (!err) {
						console.log("Search saved!");
					}
					else {
						console.warn(err.message);
					}
			});
		});
		
	});
}
function removeSearch(username,timestamp) {
	rimraf('images/'+username+'/'+timestamp,function(err) {
		if (!err)
			console.log("Sucessfully removed "+timestamp);
		else
			console.warn(err);
	});
}

/*
* Not in use any more
*/
function generateThumbnails(folderpath) {
	var thumbpath = folderpath+"/thumbnails";
	fs.mkdir(folderpath+"/thumbnails",0755,function(err) {
		if (err) {
			console.log("Error creating folder "+folderpath+"/thumbnails");
		}
		fs.readdir(folderpath,function(err,files) {
			if (err) {
				console.log("Error reading path "+folderpath);
				return;
			}
			console.log("Creating thumbnails...");
			// Thumbnail Processing
			for (var file in files) {
				easyimage.resize({src:folderpath+"/"+files[file],dst: thumbpath+"/"+files[file],
								width:128, height:128}, 
								function(err,stdout,stderr) {
									if (err)
										console.log(err);
								}
				);
					
			}
			console.log("Done!");
		});
				
	});
}
exports.persistJSON = persistJSON;
exports.saveSearch = saveSearch;
exports.removeSearch = removeSearch;