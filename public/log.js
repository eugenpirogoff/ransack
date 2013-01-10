function log(status,message) {
	console.log(status + "\t-\t" + message);
	console.err(status + "\t-\t" + message);
}
exports.log = log;