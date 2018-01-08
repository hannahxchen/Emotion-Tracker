var userID = null;
var physicalAge = null;
var realAge = null;
var emotionInput = {};
var detectedEmotion = {};

function detectmob() {
 if( navigator.userAgent.match(/Android/i)
 || navigator.userAgent.match(/webOS/i)
 || navigator.userAgent.match(/iPhone/i)
 || navigator.userAgent.match(/iPad/i)
 || navigator.userAgent.match(/iPod/i)
 || navigator.userAgent.match(/BlackBerry/i)
 || navigator.userAgent.match(/Windows Phone/i)
 ){
    return true;
  }
 else {
    return false;
  }
}

function detectmob2() {
   if(window.innerWidth <= 800 && window.innerHeight <= 600) {
     return true;
   } else {
     return false;
   }
}

if(detectmob) $('#results').show();
else{
	if(detectmob2) $('#results').show();
}

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
	$('#shot').show();
	$('#reshot').hide();
	$('#submit_photo').hide();
	Webcam.snap( function(data_uri) {
		$('#loadingMsg').html('分析中，請稍後......');
		$('#age-wrapper').hide();
		$('#emotion-wrapper').hide();
		$('#resultsTitle').hide();
		$('#birth').hide();
		$('#inputArea').hide();
		$('#realAge').empty();
		$('dominantEmotion').html('');
		$('#submit').attr("disabled", false);
		var img = new Image();
		img.src = data_uri;
		img.onload = imageLoaded;
		var img_base64 = data_uri.replace('data:image/jpeg;base64,', '');
		recognize(img_base64);
	});
}

function recognize(img_base64){
	$.ajax({
		type: "POST",
		url: "/magicMirror/recognize",
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		data: JSON.stringify({image: img_base64}),
		success: function(data){
			if(data.error == 'no face found' || data.error)
				$('#loadingMsg').html("偵測不到臉，請重拍一次！");
			else if (data.error == 'too many faces')
				$('#loadingMsg').html("請一次偵測一張臉！");
			else{
				userID = data.userID;
				physicalAge = data.physicalAge;
				$('#loadingMsg').html('');
				if(data.realAge){
					realAge = data.realAge;
					$('#realAge').html('實際年齡：' + realAge);
				}
				else{
					$('#realAge').append('<span style="margin-right: 30px;">出生日期：</span><input type="text" name="birthday" value="" class="dropdate">');
					$('.dropdate').dropdate({
						dateFormat:'yyyy/mm/dd'
					});
				}
				$('#physicalAge').html('生理年齡：'+ physicalAge);
				$('#emotion-wrapper').show();
				$('#age-wrapper').show();
				$('#resultsTitle').show();
			}
		},
		failure: function(errMsg) {
			$('#loadingMsg').html('辨識系統錯誤！');
			alert(errMsg);
		}
	});
}

//Construct a PhotoDetector
var detector = new affdex.PhotoDetector();
//Enable detection of all Expressions, Emotions and Emojis classifiers.
detector.detectAllEmotions();
detector.detectAllAppearance();

//Add a callback to notify when the detector is initialized and ready for runing.
detector.addEventListener("onInitializeSuccess", function() {
	$('#logs').hide();
	$("#imageDetect").show();
});

detector.addEventListener("onImageResultsSuccess", function(faces, image, timestamp) {
	$('#resultsTitle').html('');
	$('#results').html('');
	if (faces.length > 0) {
		if(faces[0].appearance.gender == 'Female')
		log('#resultsTitle', "親愛的美女，以下是您的偵測結果：");
		else if(faces[0].appearance.gender == 'Male')
		log('#resultsTitle', "親愛的帥哥，以下是您的偵測結果：");
		else
		log('#resultsTitle', "您好，以下是您的偵測結果：");

		var currentEmotion = null;
		var emotionValue = 0;
		$.each(faces[0].emotions, function(key, val){
			if(val > emotionValue && key != 'valence' && key != 'engagement'){
				currentEmotion = key;
				emotionValue = val.toFixed(0);
			}

			var dominantEmotion = null;
			switch(currentEmotion){
				case 'joy':
				dominantEmotion = '開心';
				break;
				case 'sadness':
				dominantEmotion = '傷心';
				break;
				case 'disgust':
				dominantEmotion = '反感';
				break;
				case 'contempt':
				dominantEmotion = '不屑';
				break;
				case 'anger':
				dominantEmotion = '生氣';
				break;
				case 'fear':
				dominantEmotion = '害怕';
				break;
				case 'surprise':
				dominantEmotion = '驚訝';
				break;
			}

			var adverb = null;
			if(emotionValue <= 0){
				dominantEmotion = '沒有表情';
				adverb = '';
			}
			else if (emotionValue <=10)
			adverb = '有一點點'
			else if (emotionValue <=30)
			adverb = "有點";
			else if (emotionValue <=50)
			adverb = "很";
			else if (emotionValue <=80)
			adverb = "非常";
			else
			adverb = "超級";

			$('#dominantEmotion').html('你現在看起來' + adverb + dominantEmotion);

			$('#inputArea').show();

			var mySlider = $("#" + key +"-input").slider();
			mySlider.slider('setValue', val);
			$("#"+ key + "-value").text(val.toFixed(0));
			emotionInput[key] = val.toFixed(0);
			detectedEmotion[key] = val.toFixed(0);

			var translate;
			switch(key){
				case 'joy':
				translate = '開心';
				break;
				case 'sadness':
				translate = '傷心';
				break;
				case 'disgust':
				translate = '反感';
				break;
				case 'contempt':
				translate = '不屑';
				break;
				case 'anger':
				translate = '生氣';
				break;
				case 'fear':
				translate = '害怕';
				break;
				case 'surprise':
				translate = '驚訝';
				break;
				default:
				translate = null;
				break;
			}
			if(translate){
				$('#results').append('<div id='+ key +' style= "margin-bottom: 30px;"></div>');
				log('#' + key, translate + "：" + val.toFixed(0));
			}
		});
	}
	else{
		$('age-wrapper').hide();
		log('#results', "無法偵測情緒，請重拍一次！");
	}
});

//Initialize the emotion detector
$("#logs").html("啟動中......請稍後");
detector.start();

//Convienence function for logging to the DOM
function log(node_name, msg) {
	$(node_name).append("<span>" + msg + "</span><br />");
}

//Once the image is loaded, pass it down for processing
function imageLoaded(event) {

	var contxt = document.createElement('canvas').getContext('2d');
	contxt.canvas.width = this.width;
	contxt.canvas.height = this.height;
	contxt.drawImage(this, 0, 0, this.width, this.height);

	// Pass the image to the detector to track emotions
	if (detector && detector.isRunning) {
		detector.process(contxt.getImageData(0, 0, this.width, this.height), 0);
	}
}

$('#submit').click(function(){
	$('#submit').attr("disabled", true);
	$('#age-wrapper').hide();
	$('#emotion-wrapper').hide();
	$('#resultsTitle').html('');
	$('#loadingMsg').html('傳送資料中......');
	if(!realAge) var data = {userID: userID, emotionInput: emotionInput, detectedEmotion: detectedEmotion, birth: $('.dropdate').val(), physicalAge: physicalAge};
	else var data = {userID: userID, ageDifference: (physicalAge - realAge), emotionInput: emotionInput, detectedEmotion: detectedEmotion};
	/*$.ajax({
		type: "POST",
		url: "/magicMirror/submitData",
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		data: JSON.stringify(data),
		success: function(data){
			if(data.success){
				$('#loadingMsg').html('送出成功！');
				userID = null;
				physicalAge = null;
				realAge = null;
				emotionInput = {};
				detectedEmotion = {};
			}
		},
		failure: function(errMsg) {
			alert(errMsg);
		}
	});*/
});

$("#joy-input").on("slide", function(slideEvt) {
	$("#joy-value").text(slideEvt.value);
	emotionInput['joy'] = slideEvt.value;
});
$("#sadness-input").on("slide", function(slideEvt) {
	$("#sadness-value").text(slideEvt.value);
	emotionInput['sadness'] = slideEvt.value;
});
$("#anger-input").on("slide", function(slideEvt) {
	$("#anger-value").text(slideEvt.value);
	emotionInput['anger'] = slideEvt.value;
});
$("#fear-input").on("slide", function(slideEvt) {
	$("#fear-value").text(slideEvt.value);
	emotionInput['fear'] = slideEvt.value;
});
$("#disgust-input").on("slide", function(slideEvt) {
	$("#disgust-value").text(slideEvt.value);
	emotionInput['disgust'] = slideEvt.value;
});
$("#contempt-input").on("slide", function(slideEvt) {
	$("#contempt-value").text(slideEvt.value);
	emotionInput['contempt'] = slideEvt.value;
});
$("#surprise-input").on("slide", function(slideEvt) {
	$("#surprise-value").text(slideEvt.value);
	emotionInput['surprise'] = slideEvt.value;
});
