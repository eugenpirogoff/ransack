/*

Configuring the Routes of the Express Server.
Receiving the actual app plus a dictionary.

*/

/*
* param app: Express Server
* param type: get || post
* param handlers: dictionary with handlers // key: route string | value: function
*/


function configureRoutes(app,type,handlers) {
	// CONFIGURING GET ROUTES
	if (type == "get") {
		for ( var route in handlers ) {
			if ( typeof handlers[route] === 'function' ) {
				app.get(route,handlers[route]);
			}
		}
	}
	// CONFIGURING POST ROUTES
	else if ( type == "post" ) {
		for ( var route in handlers ) {
			if ( typeof handlers[route] === 'function' ) {
				app.post(route,handlers[route]);
			}
		}
	}
}

exports.configureRoutes = configureRoutes;
		
		