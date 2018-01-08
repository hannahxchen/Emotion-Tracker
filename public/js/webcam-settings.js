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

Webcam.attach( '#my_camera' );
