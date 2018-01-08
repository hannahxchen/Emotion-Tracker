var count = 3;
var shot = true;
var counter;
var manual = false;

$(document).ready(function(){

  var md = new MobileDetect(window.navigator.userAgent);
  if(md.mobile() || md.phone() || md.tablet()){
    $('#results').show();
    $('#countdown').hide();
    $('#submit_photo').show();
    manual = true;

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
  else{
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
    countdown();
  }

  Webcam.attach( '#my_camera' );
});

function countdown(){
  $('#countdown').append("拍照倒數");
  var counter = setInterval(function(){
    $('#loginManual').on('click', function(){
      shot = false;
    });
    if($('#modal-1').css('display') == 'none'){
      shot = true;
    }
    if(shot){
      $('#countdown').append(count);
      count--;
      if(count == -1){
        count = 3;
        snap(counter);
      }
    }
  }, 1000);
}

function snap(counter){
  clearInterval(counter);
  $('#message').hide();
  $('#countdown').empty();
  $('#countdown').append("身分辨識中......");
  Webcam.freeze();
  Webcam.snap(function(data_uri){
    var image = data_uri.replace('data:image/jpeg;base64,', '');
    socket.emit('login-img', image);
  });
}

$('#submit_photo').click(function(){
  Webcam.snap(function(data_uri){
    var image = data_uri.replace('data:image/jpeg;base64,', '');
    $("html, body").animate({ scrollTop: 0 }, "slow");
    $('#countdown').text('辨識中......請稍後');
    $('#countdown').show();
    socket.emit('login-img', image);
  });
});

socket.on('login', function(data){
  if(!data.success && !manual){
    if(data.message == 'Unknown user') $('#message').text('未知的使用者');
    else if(data.message == 'Too many faces') $('#message').text('請一次一人進行拍照');
    else if(data.message == 'No face found') $('#message').text('辨識不到臉');
    $('#countdown').empty();
    $('#countdown').append("重新開始辨識身分...");
    Webcam.unfreeze();
    setTimeout(function(){
      $('#countdown').empty();
      countdown();
    }, 2000);
  }
  else if(!data.success && manaul){
    if(data.message == 'Unknown user') $('#message').text('未知的使用者');
    else if(data.message == 'Too many faces') $('#message').text('請一次一人進行拍照');
    else if(data.message == 'No face found') $('#message').text('辨識不到臉');
    $('#countdown').hide();
    $('#message').show();
  }
  else{
    var id = data.id;
    $("#username").val(id);
    $("#form").submit();
  }
});

$('#login_manual button').click(function(e){
  e.preventDefault();
  $('#login_manual').submit();
});
