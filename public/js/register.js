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
        $('#img_uri').val(data_uri);
        $('#ifshot').val(shot);
      });
    }
    else{
      $('#ifshot').val(shot);
    }
	});
});
