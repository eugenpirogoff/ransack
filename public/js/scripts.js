
$(function() {
  // Setup drop down menu
  $(".dropdown-toggle").dropdown();
 
  // Fix input element click problem
  $(".dropdown input, .dropdown label").click(function(e) {
    e.stopPropagation();
  });
});


$(document).ready(function(){
	$('.mymap').css("min-height",$(window).innerHeight()-40);
	$('.mymap').css("height",$(window).innerHeight()-40);
	console.log($(window).innerHeight());
})