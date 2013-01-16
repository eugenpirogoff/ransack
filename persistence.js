/**
* Persistence library, offering several options to persist and retrieveimage data
**/
var request = require("request"),
	fs = require("fs"),
	path = require("path"),
	easyimage = require("easyimage");

function persistJSON(tweets) {
	var date = new Date();
	var folderpath = "images/"+assembleFolderName();
	fs.exists(folderpath,function(exists) {
		if(!exists) {
			fs.mkdir(folderpath,0755,function(err) {
				if(!err){
					fetchImages();
					generateThumbnails(folderpath);
				} else {
					console.log("Error creating folder "+folderpath);
				}
			});
		}
		else {
			fetchImages(generateThumbnails);
		}
	});
	
	function fetchImages(callback) {
		var counter = 0;
		for (var tweet in tweets) {
				var url = tweets[tweet].media[0];
				// TODO
				var file_name = folderpath + "/" +  path.basename(url);

			    var wstream = fs.createWriteStream(file_name);

			    wstream.on('error', function (err) {
	    		    console.log(err, url);
			    });

   				wstream.on( 'close', function(){
    				if (++counter == tweets.length) {
    					callback(folderpath);
    				}
			    });

			    request(url).pipe( wstream );
		}
	}	
	
}

function assembleFolderName() {
	var date = new Date();
	return date.toLocaleDateString();
}
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
			// Thumbnail Processing
			for (var file in files) {
				console.log("rise and shine, mr freeman");
				easyimage.resize({src:folderpath+"/"+files[file],dst: thumbpath+"/"+files[file],
								width:128, height:128}, 
								function(err,stdout,stderr) {
									if (err)
										console.log(err);
									else
									console.log("Resizing complete");
								}
				);
					
			}
		});
				
	});
}
exports.persistJSON = persistJSON;