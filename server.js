//Initial Configuration of Node and it´s Modules to import.
var application_root = __dirname,
    express = require("express"),
    path = require("path"),
    request = require("request"),
    routes = require("./routes"),
    handlers = require("./requestHandlers");

var app = express();

// Configuration of Express
app.use(express.cookieParser("grumpy cat"));
app.use(express.bodyParser());
app.use(express.session());
app.use(app.router);

// Loggin
app.use(function(req, res, next){
  	console.log("REQUEST\t-"+req.ip+" | "+req.method+" | "+req.url);
  	next();
});
app.use(express.static(path.join(application_root, "public")));
app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
app.set('views', __dirname);


// Assembling Routing dictionary
var getRoutes = {};
getRoutes['/'] = handlers.getRoot;
getRoutes['/logout'] = handlers.getLogout;
getRoutes['/status'] = handlers.getLoginStatus;
getRoutes['/searches'] = handlers.getSearches;
getRoutes['/downloadSearch'] = handlers.getDownloadSearch;

var postRoutes = {};
postRoutes['/sign_up'] = handlers.postSignUp;
postRoutes['/sign_in'] = handlers.postSignIn;
postRoutes['/preferences'] = handlers.postPreferences;
postRoutes['/search'] = handlers.postSearch;
postRoutes['/deleteSearch'] = handlers.postDeleteSearch;

// Configuring GET routes
routes.configureRoutes(app,'get',getRoutes);
// Configuring POST routes
routes.configureRoutes(app,'post',postRoutes);


// Launch the Server
app.listen(8080);