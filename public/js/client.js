/**
* CLIENT Script
* Contains all important functions for dynamic AJAX loading and document manipulation
*/

$(document).ready(function() {

  	// Init GMaps
  	var map;
    var overlay;
    var isLoggedIn = false;
    var searches = {};
    var geocoder = new google.maps.Geocoder();
    var lastClick = Date.now();
    var isFirstSearch = true;
    var checkSum = 0;
    
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
	function checkLogin() {
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
	checkLogin();

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
					setupSearches();
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
        // Updating isLoggedIn bool
        isLoggedIn = true;
	}
	
	/**************************************************
	* Fetching saved searches
	**************************************************/
	function setupSearches(username,email) {
		$.ajax({
			type: "GET",
			url: "searches",
			success: function(data) {
				$('#searches').empty();
				searches = {};
				for(prop in data) {
					// Filling search dict
					searches[data[prop].timestamp] = data[prop];
					appendSearch(data[prop]);
				}
			}
		});
	}
	
	/***************************************************
	* Appending given search
	**************************************************/
	function appendSearch(search) {
		var date = new Date(search.timestamp);
		var dateStr = date.getDay() + '.' + date.getMonth() + ' ' + date.getFullYear() +
					' - ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
		$('#searches').prepend(
		'<div id='+search.timestamp+'><hr>'+search.address+'<br>'+dateStr+'<br>'+
		'<a id="view'+search.timestamp+'">View</a> | '+
		'<a id="download'+search.timestamp+'">Download</a> | '+
		'<a id="delete'+search.timestamp+'">Delete</a>');
		// Setting EventListeners
		$('#view'+search.timestamp).click(function() {
			viewSearchHandler(search.timestamp);
		});
		$('#download'+search.timestamp).click(function() {
			downloadSearchHandler(search.timestamp);
		});
		$('#delete'+search.timestamp).click(function() {
			deleteSearchHandler(search.timestamp);
		});
	}
	/***************************************************
	* SEARCH FUNCTION - ajax get request
	****************************************************/
	$("#searchbutton").click(function() {
		if (Date.now() - lastClick < 3000 && !isFirstSearch) {
			$('#patience').modal({show:true});
			return;
		}
		isFirstSearch = false;
		lastClick = Date.now();
		// Assembling search data
		var searchdata = {
			lat:$("#formcoord1").val(),
			lng:$("#formcoord2").val(),
			radius:$("#formradius").val(),
			checkSum: checkSum
		};
		// Trying to aquire address via reverse geocoding
		var latlng = new google.maps.LatLng(searchdata.lat,searchdata.lng);
		geocoder.geocode({latLng:latlng},function(results,status) {
			if (results[0]) {
				searchdata.address = results[0].formatted_address;
			}
			$("body").append("<div id='ajaxoverlay'><div id='ajaxgif'><img src='img/ajax-loader.gif' /></div></div>");
			$.ajax({
				type: "POST",
				url: "search",
				data: searchdata,
				// This function will set the actual elements on the MAP
				success: function(data) {
					if (data.error) {
						$("#ajaxoverlay").remove();
						alert(data.error);
						return;
					}
					checkSum = data.checkSum;
					searches[data.timestamp] = data;
					viewTweets(data,true);
				}
			});	
		});
		
	});
	
	function viewTweets(data,isSearch) {
		map.removeOverlays();
		map.removeMarkers();
		for(index in data.tweets) {
			var tweet = data.tweets[index];
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
    	if (isSearch)
    		appendSearch(data);
	}

	function getTweetOverlay(tweet) {
    	return '<div><img src="'+tweet.media[0]+'" class="small_image"><p><p>'
        	  +'<div class="btn-group">'
                +'<a rel="lightbox[gallery]" href="'+tweet.media[0]+'" target="_blank" class="btn btn-info btn-mini"><i class="icon-white icon-fullscreen"></i>Show Image</a>'
                +'<a href="'+tweet.url+'" target="_blank" class="btn btn-info btn-mini"><i class="icon-white icon-globe"></i> Open Tweet</a>'
         	+'</div>';
	} 
	
	/********************************
	* Event Handler for searches links
	********************************/
	function viewSearchHandler(timestamp) {
		var lat = searches[timestamp].latlng.lat;
		var lng = searches[timestamp].latlng.lng;
		// Setting map coordinates
		map.setCenter(lat,lng);
		viewTweets(searches[timestamp],false);
	}
	function downloadSearchHandler(timestamp) {
		if (isLoggedIn) {
			document.location = 'downloadSearch?timestamp='+timestamp;
		}
		else {
			alert("Please login for this function");
		}
	}
	function deleteSearchHandler(timestamp) {
		if (!confirm("Are you sure?"))
			return;
			
		if (isLoggedIn) {
			$.ajax({
				type:"POST",
				url:"deleteSearch",
				data: { timestamp: timestamp },
				success: function(data) {
					if(data.success) {
						$('#'+timestamp).remove();
						delete searches[timestamp];
					} else {
						alert("Database error. Sorry :(");
					}
				}
			});
		}
		else {
			$('#'+timestamp).remove();
			delete searches[timestamp];
		}
	}
	
});