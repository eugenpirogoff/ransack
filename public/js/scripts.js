$(function() {
  // Setup drop down menu
  $(".dropdown-toggle").dropdown(); 
  // Fix input element click problem
  $(".dropdown input, .dropdown label").click(function(e) {
    e.stopPropagation();
  });
});

/*map width and height, space for the left userbar*/
$(document).ready(function(){
	$('.mymap').css("min-height",$(window).innerHeight()-40);
	$('.mymap').css("height",$(window).innerHeight()-40);
	$('.mymap').css("width",$(window).innerWidth()-220);
	$('.mymap').css("min-widtht",$(window).innerWidth()-220);
	$('#sidebar').css("height",$(window).innerHeight()-40);


})
    
$(window).resize(function(){
	$('.mymap').css("min-height",$(window).innerHeight()-40);
	$('.mymap').css("height",$(window).innerHeight()-40);
	$('.mymap').css("width",$(window).innerWidth()-220);
	$('.mymap').css("min-widtht",$(window).innerWidth()-220);
	$('#sidebar').css("height",$(window).innerHeight()-40);
})