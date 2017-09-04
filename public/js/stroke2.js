//webcam setup
Webcam.set({
	  // live preview size
	  width: 320,
	  height: 240,

	  // device capture size
	  dest_width: 640,
	  dest_height: 480,

	  // final cropped size
	  crop_width: 480,
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
		var img = new Image();
		img.src = data_uri;
		img.onload = imageLoaded;
	});
}

//Construct a PhotoDetector
var detector = new affdex.PhotoDetector();
//Enable detection of all Expressions, Emotions and Emojis classifiers.
detector.detectAllEmotions();
detector.detectAllExpressions();
detector.detectAllAppearance();

//Add a callback to notify when the detector is initialized and ready for runing.
detector.addEventListener("onInitializeSuccess", function() {
  log('#logs', "The detector reports initialized");
  $("#shot").show();
});

detector.addEventListener("onImageResultsSuccess", function(faces, image, timestamp) {
  drawImage(image, faces[0].featurePoints);
  $('#results').html("");
  log('#results', "Timestamp: " + timestamp.toFixed(2));
  log('#results', "Number of faces found: " + faces.length);
  if (faces.length > 0) {
    log('#results', "Appearance: " + JSON.stringify(faces[0].appearance));
    log('#results', "Emotions: " + JSON.stringify(faces[0].emotions, function(key, val) {
      return val.toFixed ? Number(val.toFixed(0)) : val;
    }));
    log('#results', "Expressions: " + JSON.stringify(faces[0].expressions, function(key, val) {
      return val.toFixed ? Number(val.toFixed(0)) : val;
    }));
    //drawFeaturePoints(image, faces[0].featurePoints);
  }
});

//Initialize the emotion detector
log("#logs", "Starting the detector .. please wait");
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

//Draw Image to container
function drawImage(img, featurePoints) {
  var contxt = $('#image_canvas')[0].getContext('2d');

  var temp = document.createElement('canvas').getContext('2d');
  temp.canvas.width = img.width;
  temp.canvas.height = img.height;
  temp.putImageData(img, 0, 0);

  var image = new Image();
  image.src = temp.canvas.toDataURL("image/png");

  //Scale the image to 640x480 - the size of the display container.
  contxt.canvas.width = img.width <= 640 ? img.width : 640;
  contxt.canvas.height = img.height <= 480 ? img.height : 480;

  var hRatio = contxt.canvas.width / img.width;
  var vRatio = contxt.canvas.height / img.height;
  var ratio = Math.min(hRatio, vRatio);

  //Draw the image on the display canvas
  contxt.clearRect(0, 0, contxt.canvas.width, contxt.canvas.height);

  contxt.scale(ratio, ratio);
  image.onload = function(){
  	contxt.drawImage(image, 0, 0);
		//Draw the detected facial feature points on the image
    contxt.strokeStyle = "#FFFFFF";
    for (var id in featurePoints) {
      contxt.beginPath();
      contxt.arc(featurePoints[id].x, featurePoints[id].y, 2, 0, 2 * Math.PI);
      contxt.stroke();
    }

		//deviation of angle of mouth
		var points = [20 , 24, 11, 2]; //[Right Lip Corner, Left Lip Corner, Nose Root, Tip of Chin]
		var m1 = getSlope(featurePoints[points[0]], featurePoints[points[1]]);
		var m2 = getSlope(featurePoints[points[2]], featurePoints[points[3]]);
		var deg1 = calcAngle(m1, m2);
		var deg2 = 180 - deg1;
		console.log("deg1:", deg1);
		console.log("deg2:", deg2);
		drawLine(featurePoints[points[0]], featurePoints[points[1]]);
		drawLine(featurePoints[points[2]], featurePoints[points[3]]);
  };
}

function getSlope(p0, p1){
  var m = (p0.y - p1.y)/(p0.x - p1.x);
  return m;
}

function calcAngle(m1, m2){
  if(m1*m2 == -1) return 90;
	var rad2deg = 180/Math.PI;
	var degrees = Math.atan(Math.abs((m1 - m2)/(1 + m1*m2)))*rad2deg;
	return degrees;
}

function drawLine(p0, p1){
	var contxt = $('#image_canvas')[0].getContext('2d');
	contxt.strokeStyle = "red";
	contxt.lineWidth = 1;
	contxt.beginPath();
	contxt.moveTo(p0.x, p0.y);
	contxt.lineTo(p1.x, p1.y);
	contxt.stroke();
}
