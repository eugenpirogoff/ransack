//Initial Configuration of Node and it´s Modules to import.
var application_root = __dirname,
    express = require("express"),
    path = require("path"),
    mongoose = require("mongoose"),
    request = require("request"),
    routes = require("./routes"),
    handlers = require("./requestHandlers");

// Creating Schema for a Search 
/* MongoDB Code
var Schema = mongoose.Schema;  

var Search = new Schema({
    id : Number, 
    location : { latitude : Number, longtitude: Number }
}); 

var SearchModel = mongoose.model('Search', Search);  
*/


var app = express.createServer();

/* MongoDB CODE
// Database
mongoose.connect('mongodb://localhost/ransack');
*/

// Configuration of Express
app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(application_root, "public")));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.set('views', __dirname);
app.set('view engine', 'jade');


// Assembling Routing dictionary
var getRoutes = {};
getRoutes['/search'] = handlers.getSearch;
getRoutes['/search/:id'] = handlers.getSearchById;
getRoutes['/search/user'] = handlers.getSearchByUser;

var postRoutes = {};
postRoutes['/signup'] = handlers.postSignUp;
postRoutes['/search'] = handlers.postSearch;
postRoutes['/search/user'] = handlers.postSearchByUser;

// Configuring GET routes
routes.configureRoutes(app,'get',getRoutes);
// Configuring POST routes
routes.configureRoutes(app,'post',postRoutes);


// Launch the Server
app.listen(8080);