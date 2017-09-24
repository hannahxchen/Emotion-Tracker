var angle;
var img_base64;
var sampleTextID;
var sampleText;
var audioText;
var landmarks = [];

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
		img_base64 = data_uri.replace('data:image/jpeg;base64,', '');
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

					for(var i = 0; i < 68 ; i++){
						landmarks.push({
							x: face.vertices[2*i],
							y: face.vertices[2*i + 1]
						});
					}


					//deviation of angle of mouth
					var points = [48*2 , 54*2, 8*2, 27*2]; //[Left Lip Corner, Right Lip Corner, Nose Root, Tip of Chin]
					var m1 = getSlope(face.vertices[points[0]], face.vertices[points[0] + 1],
						face.vertices[points[1]], face.vertices[points[1] + 1]);
					var m2 = getSlope(face.vertices[points[2]], face.vertices[points[2] + 1],
						face.vertices[points[3]], face.vertices[points[3] + 1]);

					var deg = calcAngle(m1, m2);
					angle = Math.abs(90 - deg);
					if(face.vertices[points[0] + 1] < face.vertices[points[1] + 1]){
						log('#results', "順時針傾斜(左高右低): " + angle + "°");
						angle *= (-1);
					}
					else log('#results', "逆時針傾斜(右高左低): " + angle + "°");

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

var final_transcript = '';
var recognizing = false;
var ignore_onend;
var duration;

$('#next').click(function(){
	$('#next').hide();
	$('#imageDetect').hide();
	$('#speechTest').show();
	generateText();

	var microm = new Microm();
	microm.on('loadedmetadata', onLoaded);

	if ('webkitSpeechRecognition' in window) {
		console.log('version accepted!');
		var recognition = new webkitSpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.lang = "cmn-Hant-TW";
		final_span.innerHTML = '';
		interim_span.innerHTML = '';

		recognition.onresult = function(event) {
	    var interim_transcript = '';
			if(typeof(event.results) == 'undefined'){
		    	console.log('undefined');
		    	recognition.onend = null;
		    	recognition.stop();
		    	return;
		   }
	    for (var i = event.resultIndex; i < event.results.length; ++i) {
	      if (event.results[i].isFinal) {
	        final_transcript += event.results[i][0].transcript;
	      } else {
	        interim_transcript += event.results[i][0].transcript;
	    	}
	  	}
	    final_transcript = capitalize(final_transcript);
	    $('#final_span').html(linebreak(final_transcript));
	    $('#interim_span').html(linebreak(interim_transcript));
	  };
		recognition.onstart = function() {
	    recognizing = true;
	  };

		recognition.onerror = function(event) {
	    console.log(event.error);
			ignore_onend = true;
	  };

	  recognition.onend = function() {
	    recognizing = false;
			if(ignore_onend){
				return;
			}
			if (window.getSelection) {
      	window.getSelection().removeAllRanges();
      	var range = document.createRange();
      	range.selectNode(document.getElementById('final_span'));
      	window.getSelection().addRange(range);
    	}
	  };
	} else{
		alert('您的瀏覽器無法支援，請更新瀏覽器至最新版！');
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
		$('#stop_button').show();
		$('#start_button').hide();
		$('#pause_button').hide();
		$('#play_button').hide();

		start();

		final_transcript = '';
  	recognition.lang = "zh-TW";
  	recognition.start();
  	ignore_onend = false;
  	$('#final_span').html('');
		$('#interim_span').html('');
  	$('#start_button').attr("disabled", true);
		$('#stop_button_button').attr("disabled", false);
	});

	$('#stop_button').click(function (event){
		$('#start_button').show();
		$('#start_button').text('重新錄音');
		$('#stop_button').hide();
		$('#sendResults').show();
		$('#play_button').show();

		stop();
		recognition.stop();

		$('#start_button').attr("disabled", false);
		$('#stop_button_button').attr("disabled", true);
	});

	$('#play_button').click(function(){
		microm.play();
		$('#pause_button').show();
	});

	$('#pause_button').click(function(){
		microm.pause();
	});

	function start() {
	  microm.record().then(function() {
	    console.log('recording...')
	  }).catch(function() {
	    console.log('error recording');
	  });
	}

	function stop() {
	  microm.stop().then(function(result) {
	  });
	}

	function onLoaded(time) {
		duration = time;
	  console.log(duration);
	}

	$('#sendResults').click(function(){
		microm.getBase64().then(function(base64string) {
			var audio_base64 = base64string.replace('data:audio/mp3;base64,', '');
			audioText = $('#final_span').text();
		 $.ajax({
		    type: 'POST',
				url: '/strokeTest/uploadResults',
		    contentType: 'application/json; charset=utf-8',
				dataType: "json",
				data: JSON.stringify({img: img_base64, angle: angle, landmarks: landmarks, audio: audio_base64, duration: duration, audioText: audioText, sampleTextID: sampleTextID, sampleText: sampleText}),
		    success: function(data){
					$('#speechTest').hide();
					$('#testComplete').show();

					if(angle < 0) $('#resultAngle').text('順時針傾斜(左高右低) ' + Math.abs(angle) + "°");
					else $('#resultAngle').text("逆時針傾斜(右高左低) " + angle + "°");
					$('#resultAccuracy').text(data.speechAccuracy);
				},
				failure: function(errMsg) {
		      alert(errMsg);
		    }
		  });
		});
	});
});

function generateText(){
	$.ajax({
    type: "GET",
    url: "/strokeTest/generateText",
    dataType: "json",
    success: function(data){
			sampleTextID = data.SampleTextID;
			$('#plainText').text(data.text);
			sampleText = data.text;
		},
    failure: function(errMsg) {
        alert(errMsg);
    }
	});
}

$('#testAgain').click(function(){
	$('#testComplete').hide();
	$('#imageDetect').show();
	$('#results').html("");
	var imageDataCtx = imageData.getContext("2d");
	imageDataCtx.clearRect(0, 0, 640, 480);
});
