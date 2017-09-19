$(document).ready(function(){
	var socket=io.connect();
	var shot = false;

	$('#shot').on('click', function(){
	  shot = true;
	});

	$('#reshot').on('click', function(){
	  shot = false;
	});

	$('#submit').on('click', function(){
    if(shot){
      Webcam.snap( function(data_uri) {
        $('#img').val(data_uri.replace('data:image/jpeg;base64,', ''));
        $('#ifshot').val(shot);
      });
    }
    else{
      $('#ifshot').val(shot);
    }
	});

	$('.dropdate').dropdate({
    dateFormat:'yyyy/mm/dd'
  });
});
