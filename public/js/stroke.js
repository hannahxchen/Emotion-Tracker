//webcam setup
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
	flip_horiz: true
});

Webcam.attach( '#my_camera');

function preview_snapshot() {
	// freeze camera so user can preview pic
	Webcam.freeze();

	// swap button sets
	$('#shot').hide();
	$('#reshot').show();
	$('#submit_photo').show();
}

function cancel_preview() {
	// cancel preview freeze and return to live camera feed
	Webcam.unfreeze();

	// swap buttons back
	$('#shot').show();
	$('#reshot').hide();
	$('#submit_photo').hide();
}

function startTest(){
	$('#results').html("");
	$('#shot').show();
	$('#reshot').hide();
	$('#submit_photo').hide();
	Webcam.snap( function(data_uri) {
		var img = new Image();
		img.src = data_uri;
		img.onload = imageLoaded;
	});
}

log("#logs", "偵測系統啟動中......");

//Setup PhotoDetector

var imageData	= document.getElementById("image_canvas");	// image data for BRFv4

var brfManager	 = null;
var resolution	 = null;
var brfv4		= null;

window.onload = function(){
	waitForSDK();

	function waitForSDK() {

		if(brfv4 === null) {
			brfv4 = {locateFile: function() { return "js/libs/brf/BRFv4_JS_trial.js.mem"; }};
			initializeBRF(brfv4);
		}

		if(brfv4.sdkReady) {
			initSDK();
		} else {
			setTimeout(waitForSDK, 100);
		}
	}

	function initSDK() {
		log('#logs', "偵測系統啟動完成！請開始拍照偵測!");
		$("#shot").show();

		// Resize the canvas to match the webcam video size.
		imageData.width		= 640;
		imageData.height	= 480;

		resolution	= new brfv4.Rectangle(0, 0, imageData.width, imageData.height);

		brfManager	= new brfv4.BRFManager();
		brfManager.init(resolution, resolution, "com.tastenkunst.brfv4.js.examples.minimal.image");


	}
}
//Once the image is loaded, pass it down for processing
function imageLoaded(event) {

	var contxt = document.createElement('canvas').getContext('2d');
	contxt.canvas.width = this.width;
	contxt.canvas.height = this.height;
	contxt.drawImage(this, 0, 0, this.width, this.height);
	var image = new Image();
  image.src = contxt.canvas.toDataURL("image/png");

	trackFaces(image);
}

function trackFaces(image) {

	var imageDataCtx = imageData.getContext("2d");
	imageDataCtx.clearRect(0, 0, 640, 480);
	image.onload = function(){
		imageDataCtx.drawImage(image, 0, 0, resolution.width, resolution.height);

		var data = imageDataCtx.getImageData(0, 0, resolution.width, resolution.height).data;

		for(var i = 0; i < 10; i++) {
			brfManager.update(data);
		}

		var faces = brfManager.getFaces();

		for(i = 0; i < faces.length; i++) {

			var face = faces[i];

			if(face.state === brfv4.BRFState.FACE_TRACKING_START ||
				face.state === brfv4.BRFState.FACE_TRACKING) {

					imageDataCtx.strokeStyle="#00a0ff";

					for(var k = 0; k < face.vertices.length; k += 2) {
						imageDataCtx.beginPath();
						imageDataCtx.arc(face.vertices[k], face.vertices[k + 1], 2, 0, 2 * Math.PI);
						imageDataCtx.stroke();
					}

					//deviation of angle of mouth
					var points = [48*2 , 54*2, 8*2, 27*2]; //[Right Lip Corner, Left Lip Corner, Nose Root, Tip of Chin]
					var m1 = getSlope(face.vertices[points[0]], face.vertices[points[0] + 1],
						face.vertices[points[1]], face.vertices[points[1] + 1]);
					var m2 = getSlope(face.vertices[points[2]], face.vertices[points[2] + 1],
						face.vertices[points[3]], face.vertices[points[3] + 1]);
					var deg1 = calcAngle(m1, m2);
					var deg2 = 180 - deg1;
					log('#results', "deg1: " + deg1);
					log('#results', "deg2: " + deg2);
					drawLine(face.vertices[points[0]], face.vertices[points[0] + 1],
						face.vertices[points[1]], face.vertices[points[1] + 1]);
					drawLine(face.vertices[points[2]], face.vertices[points[2] + 1],
						face.vertices[points[3]], face.vertices[points[3] + 1]);
					$('#next').show();
				}
				else{
					log('#results', "偵測不到臉!");
				}
		}
	}
}


function log(node_name, msg) {
	$(node_name).append("<span>" + msg + "</span><br />");
}

function getSlope(p0_x, p0_y, p1_x, p1_y){
  var m = (p0_y - p1_y)/(p0_x - p1_x);
  return m;
}

function calcAngle(m1, m2){
  if(m1*m2 == -1) return 90;
	var rad2deg = 180/Math.PI;
	var degrees = Math.atan(Math.abs((m1 - m2)/(1 + m1*m2)))*rad2deg;
	return degrees;
}

function drawLine(p0_x, p0_y, p1_x, p1_y){
	var contxt = $('#image_canvas')[0].getContext('2d');
	contxt.strokeStyle = "red";
	contxt.lineWidth = 1;
	contxt.beginPath();
	contxt.moveTo(p0_x, p0_y);
	contxt.lineTo(p1_x, p1_y);
	contxt.stroke();
}

function uploadResults(){
	$.ajax({
	    type: "POST",
	    url: "/uploadResults",
			contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify({deg1: deg1, deg2: deg2}),
	    success: function(data){

			},
	    failure: function(errMsg) {
	        alert(errMsg);
	    }
	});
}

var final_transcript = '';
var recognizing = false;
var ignore_onend;

$('#next').click(function(){
	$('#next').hide();
	$('#imageDetect').hide();
	$('#speechTest').show();

	if ('webkitSpeechRecognition' in window) {
		var recognition = new webkitSpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.onresult = function(event) {
	    var interim_transcript = '';
	    for (var i = event.resultIndex; i < event.results.length; ++i) {
	      if (event.results[i].isFinal) {
	        final_transcript += event.results[i][0].transcript;
	      } else {
	        interim_transcript += event.results[i][0].transcript;
	    	}
	  	}
	    final_transcript = capitalize(final_transcript);
	    $('#final_span').html = linebreak(final_transcript);
	    $('#interim_span').html = linebreak(interim_transcript);
	  };
		recognition.onstart = function() {
	    recognizing = true;
	  };

		recognition.onerror = function(event) {
	    console.log(event.error);
	  };

	  recognition.onend = function() {
	    recognizing = false;
	  };
	} else{
		$('#results').html('您的瀏覽器無法支援，請更新瀏覽器至最新版！')
	}

	var two_line = /\n\n/g;
	var one_line = /\n/g;
	function linebreak(s) {
		return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
	}

	function capitalize(s) {
		return s.replace(s.substr(0,1), function(m) { return m.toUpperCase(); });
	}

	$('#start_button').click(function(event){
		if (recognizing) {
			recognition.stop();
			return;
		}

		final_transcript = '';
		recognition.start();
		ignore_onend = false;
		recognition.lang = "cmn-Hant-TW";
		final_span.innerHTML = '';
		interim_span.innerHTML = '';
	});
});
