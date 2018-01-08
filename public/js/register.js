$(document).ready(function(){
	var shot = false;
	var mobile = false;
	var md = new MobileDetect(window.navigator.userAgent);
  if(md.mobile() || md.phone() || md.tablet()){
		$('#results').show();
		//$('#shot').hide();
		//$('#reshot').hide();
		mobile = true;
		Webcam.set({
			// live preview size
			width: 360,
			height: 480,

			// format and quality
			image_format: 'jpeg',
			jpeg_quality: 90,
			flip_horiz: true,
			audio: false,

			facingMode: { exact: "environment" }
		});
	}
	else {
		Webcam.set({
			// live preview size
			width: 320,
			height: 240,

			// device capture size
			dest_width: 640,
			dest_height: 480,

			// final cropped size
			crop_width: 640,
			crop_height: 480,

			// format and quality
			image_format: 'jpeg',
			jpeg_quality: 90,
			flip_horiz: true,
			audio: false,

			facingMode: { exact: "environment" }
		});
	}


	Webcam.attach( '#my_camera' );


	$('#shot').on('click', function(){
		shot = true;
	});

	$('#reshot').on('click', function(){
		shot = false;
	});

	$('#submit').on('click', function(){
		if(shot || mobile){
			Webcam.snap( function(data_uri) {
				$('#img').val(data_uri.replace('data:image/jpeg;base64,', ''));
			});
		}
		else{
			event.preventDefault();
			alert('請拍張個人照！');
		}
	});

	$('.dropdate').dropdate({
		dateFormat:'yyyy/mm/dd'
	});
});
