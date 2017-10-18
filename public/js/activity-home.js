$('.nav-tabs > li > a').hover(function() {
  $(this).tab('show');
  $(this).parent().addClass('active');
});

$('.search-query').focus(function(){
  $('.btn-danger').css('position', 'relative');
  $('.btn-danger').css('z-index', 3000);
});

$('.carousel').carousel({
  interval: 3000
});

$('.carousel-inner > .item:first-child').addClass("active");

var clickEvent = false;
$('#myCarousel').on('click', '.nav-pills a', function() {
  clickEvent = true;
  $('.nav-pills li').removeClass('active');
  $(this).parent().addClass('active');
}).on('slid.bs.carousel', function(e) {
  if(!clickEvent) {
    var count = $('.nav-pills').children().length -1;
    var current = $('.nav-pills li.active');
    current.removeClass('active').next().addClass('active');
    var id = parseInt(current.data('slide-to'));
    if(count == id) {
      $('.nav-pills li').first().addClass('active');
    }
  }
  clickEvent = false;
});
