var socket=io.connect();
var count = 3;
shot = true;

$(document).ready(function(){
  countdown();
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
  $('#countdown').empty();
  $('#countdown').append("身分辨識中......");
  Webcam.freeze();
  Webcam.snap(function(data_uri){
    socket.emit('login-img', data_uri);
  });
}

socket.on('login', function(data){
  if(data.success == false){
    console.log(username);
    $('#countdown').empty();
    $('#countdown').append("重新開始辨識身分...");
    Webcam.unfreeze();
    setTimeout(function(){
      $('#countdown').empty();
      countdown();
    }, 2000);
  }
  else{
    var id = data.id;
    $("#username").val(id);
    $("#form").submit();
  }
});
