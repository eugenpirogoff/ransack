/**
* Persistence library, offering several options to persist and retrieveimage data
**/
var request = require("request"),
	fs = require("fs");
	path = require("path");

function persistJSON(tweets) {
	var date = new Date();
	var foldername = assembleFolderName();
	fs.mkdir("images/"+foldername,0755,function(err) {
		console.log(err);
		for (var tweet in tweets) {
			var url = tweets[tweet].media[0];
			// TODO
			var file_name = "images/" + foldername + "/" +  path.basename(url);

		    var wstream = fs.createWriteStream(file_name);

		    wstream.on('error', function (err) {
    		    console.log(err, url);
		    });

    		wstream.on( 'close', function(){
    			console.log( "finished downloading: ", url, this.path );
		    });

		    request(url).pipe( wstream );
			console.log("Got tweet:");
			console.log(tweets[tweet].media[0]);
		}
	});
}

function assembleFolderName() {
	var date = new Date();
	return date.toLocaleDateString();
}
exports.persistJSON = persistJSON;