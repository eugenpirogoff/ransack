/**
* CLIENT Script
* Contains all important functions for dynamic AJAX loading and document manipulation
*/

$(document).ready(function() {

  	// Init GMaps
  	var map;
    var overlay;
    map = new GMaps({
      div: '#map',
        lat: -12.043333,
        lng: -77.028333,
        click: function(e) {

          /*
           * Setting the pin to the click position
          */
          var lat = e.latLng.lat();
          var lng = e.latLng.lng();
          map.removeOverlay(overlay);
          overlay = map.drawOverlay({
            lat: lat,
            lng: lng,
            content: '<img src="img/icon_pin_shadow.png" class="icon_pin">',
            verticalAlign: 'top',
            horizontalAlign: 'center'
          });
          $('#formcoord1').val(lat);
          $('#formcoord2').val(lng);
        },
        dragend: function(e) {
          var lat = map.getCenter().lat();
          var lng = map.getCenter().lng();
          
          map.removeOverlay(overlay);
          overlay = map.drawOverlay({
            lat: lat,
            lng: lng,
            content: '<img src="img/icon_pin_shadow.png" class="icon_pin">',
            verticalAlign: 'top',
            horizontalAlign: 'center'
          });
          $('#formcoord1').val(lat);
          $('#formcoord2').val(lng);
        }
    });
    

    /*
    *	Performing geo location
    */
  	GMaps.geolocate({
        success: function(position){
          	var lat = position.coords.latitude;
        	var lng = position.coords.longitude;
        	map.setCenter(lat, lng);
      		$('input[name="formcoord1"]').val(lat);
            $('input[name="formcoord2"]').val(lng);
            overlay = map.drawOverlay({
          		lat: lat,
            	lng: lng,
            	content: '<img src="img/icon_pin_shadow.png" class="icon_pin">',
            	verticalAlign: 'top',
            	horizontalAlign: 'center'
        	});
        },
        error: function(error){
          alert('Geolocation failed: '+error.message);
        },
        not_supported: function(){
          $('input[name="formcoord1"]').val("error");
          $('input[name="formcoord2"]').val("error");
          alert("Your browser does not support geolocation");
        },
        always: function(){
        }
    });

	// Checking if user Logged in, server side is checking for cookie
	function isLoggedIn() {
		$.ajax({
			type: "GET",
			url: "status",
			success: function(response) {
				if (response.login) {
					setupLogin(response.username,response.email);
				}
			}
		});
	}
	isLoggedIn();

	// LOGIN PROCESS
	$("#loginbutton").click(function() {
		var username = $("#username").val();
		var password = $("#password").val();

		$.ajax({
			type: "POST",
			url: "sign_in",
			data: {	username: username,
					password: password
					},
			success: function(response) {
				if (response.success) {
					setupLogin(response.username,response.email);
				}
				else
					alert("Login failed ( "+response.message+" ).");
			}
		});
	});
	
	/*
	* Action Handler for signupbutton
	*/
	$("#signupbutton").click(function() {
		var email_pattern = /^\w+\@\w+\.\w{2,3}$/;
		var username = $("#signupUsername").val();
		var email = $("#signupEmail").val();
		var pwd = $("#signupPassword").val();
		var pwd_confirm = $("#signupPassword_confirm").val();
		// Client sided PWD Check
		if (pwd != pwd_confirm) {
			alert("Passwords don´t match.");
			return;
		}
		if (pwd.length < 5) {
			alert("Password must have a minimum of 5 characters.");
			return;
		}
		if (!email.match(email_pattern)) {
			alert("Invalid Email address.");
			return;
		}
		$.ajax({
			type: "POST",
			url: "sign_up",
			data: { username: username,
					password: pwd,
					password_confirm: pwd_confirm,
					email: email
				},
			success: function(response) {
				if (response.success) {
					alert("Registration of '"+username+"' successful.");
				} else {
					alert(response.message);
				}
			}
		});
	});
	/*
	* Actionhandler for prefPane save button
	*/
	$('#prefSave').click(function() {
		var email_pattern = /^\w+\@\w+\.\w{2,3}$/;
		// Getting input fields
		var username = $("#prefUsername").val();
		console.log(username);
		var email = $("#prefEmail").val();
		var passwordOld = $("#prefPasswordOld").val();
		var password = $("#prefPassword").val();
		var password_confirm = $("#prefPassword_confirm").val();
		// Client sided PWD Check
		if (passwordOld.length > 0) {
			if (password != password_confirm) {
				alert("Passwords don´t match.");
				return;
			}
			if (password.length < 5) {
				alert("New Password must have a minimum of 5 characters.");
				return;
			}
		}
		// Email check
		if (!email.match(email_pattern)) {
			alert("Invalid Email address.");
			return;
		}
		/****************************
		* Performing AJAX call
		****************************/
		$.ajax({
			type: 	"POST",
			url:	"/preferences",
			data: {
				username: username,
				email: email,
				passwordOld: passwordOld,
				password: password,
				password_confirm: password_confirm
			},
			success: function(response) {
				if (response.success)
					setupLogin(username,email);
				alert(response.message);
			}
		});
	});
	/*
	* Updating DOM after successful login process
	*/
	function setupLogin(username,email) {
		$('#signup_dropdown').empty();
		$('#signin_dropdown').empty();
		$('#signin_dropdown').append(
			'<a id="userDropdownLink" class="dropdown-toggle" href="#" data-toggle="dropdown"><i class="icon-user">'+
            '</i> '+username+'<strong class="caret"></strong></a>' + 
        	'<div id="userDropdown" class="dropdown-menu" style="padding: 5px; padding-bottom: 0px;">'+
            '<li><a id="prefpaneButton" data-toggle="modal" href="#prefpane" ><i class="icon-wrench"></i> Settings</a></li>'+
            '<li><a href="logout"><i class="icon-remove-sign"></i> Logout</a></li></div>');
        /*
        * Filling the preference Panel
        */
        $('#prefUsername').attr('value',username);
        $('#prefEmail').attr('value',email);
        $('#prefPasswordOld').attr('value',"");
        $('#prefPassword').attr('value',"");
        $('#prefPassword_confirm').attr('value',"");
	}
	
	/**
	* SEARCH FUNCTION - ajax get request
	*/
	$("#searchbutton").click(function() {
		// Assembling search data
		var searchdata = {
			formcoord1:$("#formcoord1").val(),
			formcoord2:$("#formcoord2").val(),
			formradius:$("#formradius").val()
		};
		$("body").append("<div id='ajaxoverlay'><div id='ajaxgif'><img src='img/ajax-loader.gif' /></div></div>");
		$.ajax({
			type: "POST",
			url: "search",
			data: {
				lat: $("#formcoord1").val(),
				lng: $("#formcoord2").val(),
				radius: $("#formradius").val()
			},
			// This function will set the actual elements on the MAP
			success: function(data) {
				map.removeOverlays();
				for(index in data) {
					var tweet = data[index];
          map.addMarker({
    					      lat: tweet.geo.coordinates[0],
                    lng: tweet.geo.coordinates[1],
                    title:"Image",
                		verticalAlign: 'top',
                		horizontalAlign: 'center',
                    infoWindow: {
                                  content: getTweetOverlay(tweet)
                    }
    				});
    			}
    			$("#ajaxoverlay").remove();
			}
		});
	});


	function getTweetOverlay(tweet) {
		return '<div><img src="'+tweet.media[0]+'" class="small_image"><br><button class="btn btn_mini"><i class="icon-fullscreen"></i>Full Image</button>'+
    '<button href="'+tweet.url+'" target="_blank" class="btn btn_mini"><i class="icon-globe"></i>Show Tweet</button></div>'
	}   
});



