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
					fetchImages(data,folderpath,function() {
						zipFiles(folderpath);
						saveSearch(username,data);
					});
				} else {
					console.log("Error creating folder "+folderpath);
				}
			});
		}
		else {
			fetchImages(data,folderpath,function() {
				zipFiles(folderpath);
				saveSearch(username,data,address);
			});
		}
	});
}

/*
 * Fetching images from given tweet Data
 */
function fetchImages(data,folderpath,callback) {
		console.log("Downloading images...");
		var start = 0;
		var end;
		console.log("Downloading start=0 length="+data.tweets.length);
		if (data.tweets.length<=40) {
			end = data.tweets.length;
			fetchImage(start,end,callback);
		} else {
			end = 40;
			fetchImage(start,end,recursiveCall);
		}
		function recursiveCall(result) {
			start = result;
			if (data.tweets.length > start+40) {
				end = start + 40;
				console.log("Rec call");
				fetchImage(start,end,recursiveCall);
			} else {
				console.log("abort");
				end = data.tweets.length;
				fetchImage(start,end,callback);
			}
		}
		
		function fetchImage(start,end, next) {
			console.log("Downloading start="+start+" end="+end);
			var counter = start;
			for (i = start; i<end;i++) {
				var url = data.tweets[i].media[0];
				var options = { url: url, pool:{maxSockets:500}};				
				var file_name = folderpath + "/" +  path.basename(url);

			    var wstream = fs.createWriteStream(file_name);

			    wstream.on('error', function (err) {
    			    console.log(err, url);
	    		});

   				wstream.on( 'close', function(){
    				if (++counter == end) {
    					next(end);
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