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
	$('.mymap').css("width",$(window).innerWidth()-30);
	$('.mymap').css("min-widtht",$(window).innerWidth()-30);
	$('#sidebar').css("height",$(window).innerHeight()-40);


})
    
$(window).resize(function(){
	$('.mymap').css("min-height",$(window).innerHeight()-40);
	$('.mymap').css("height",$(window).innerHeight()-40);
	$('.mymap').css("width",$(window).innerWidth()-30);
	$('.mymap').css("min-widtht",$(window).innerWidth()-30);
	$('#sidebar').css("height",$(window).innerHeight()-40);
})



//result slider from left 
$(document).ready(function() {
    $("#sidebar").bind("mouseenter",function(){
      $("#sidebar").animate({"left": "+=230px"}, "fast");
      $('.mymap').animate({"margin-left": "+=230px"}, "fast").animate({"width": "-=230px"}, "fast").dequeue();
    }).bind("mouseleave",function(){
      $('.mymap').animate({"width": "+=230px"}, "fast").animate({"margin-left":"-=230px"},"fast").dequeue();
      $("#sidebar").animate({"left": "-=230px"}, "fast");
    });
  });

$(document).ready(function() {
    $(window).bind("mouseleave,mouseout",function(){
      $('.mymap').animate({"width": $(window).innerWidth()-30}, "fast").animate({"margin-left":"=230px"},"fast").dequeue();
      $("#sidebar").animate({"left": "-230px"}, "fast");
    });
  });

