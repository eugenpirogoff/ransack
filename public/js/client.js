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
					setupLogin(response.username);
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
					setupLogin(response.username);
				}
				else
					alert("Login failed ( "+response.message+" ).");
			}
		});
	});
	
	function setupLogin(username) {
		$('#signup_dropdown').empty();
		$('#signin_dropdown').empty();
		$('#signin_dropdown').append(
			'<a id="userDropdownLink" class="dropdown-toggle" href="#" data-toggle="dropdown"><i class="icon-user">'+
            '</i> '+username+'<strong class="caret"></strong></a>' + 
        	'<div id="userDropdown" class="dropdown-menu" style="padding: 5px; padding-bottom: 0px;">'+
            '<li><a href="settings"><i class="icon-wrench"></i> Settings</a></li>'+
            '<li><a href="logout"><i class="icon-remove-sign"></i> Logout</a></li></div>');
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
					map.drawOverlay({
    					lat: tweet.geo.coordinates[0],
                		lng: tweet.geo.coordinates[1],
                		content: getTweetOverlay(tweet.media),
                		verticalAlign: 'top',
                		horizontalAlign: 'center'
    				});
    			}
    			$("#ajaxoverlay").remove();
			}
		});
	});
	
	function getTweetOverlay(media) {
		return '<div class="overlay_search">'
				+'<img src="'+media[0]+'" width="60px" height="60px" style=" -webkit-border-radius:5px; -moz-border-radius:5px;">'
				+'<div class="overlay_arrow_search above_search"><div>'
				+'<a href="LINKHERE"><img class="icon_left" src="/img/icon_img.png" width="16px" height="16px">'
				+'<img class="icon_right" src="/img/icon_fullscreen.png" width="16px" height="16px"></div></div></div>';
	}
    
});