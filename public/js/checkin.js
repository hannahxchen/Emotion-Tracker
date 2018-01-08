var count = 3;
var shot = true;
var realtime = true;
var counter;

var md = new MobileDetect(window.navigator.userAgent);
if(md.mobile() || md.phone() || md.tablet()){

  Webcam.set({
    // live preview size
    width: 360,
    height: 480,

    // format and quality
    image_format: 'jpeg',
    jpeg_quality: 90,
    flip_horiz: true,
    audio: false,

    facingMode: { exact: "user" }
  });
}
else{
  Webcam.set({
    // live preview size
    width: 400,
    height: 300,

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

var checklistTable = $('#checklist table').DataTable({
  'paging'      : false,
  "scrollY": "200px",
  "scrollCollapse": true,
  'searching'   : true,
  'ordering'    : true,
  'info'        : false,
  'autoWidth'   : true,
  'order': [[ 2, 'asc' ]],
  'fnInitComplete': function (oSettings) {
    $('.dataTables_scrollBody').slimScroll({
      height: '200px',
      alwaysVisible: true
    });
  }
});

var unchecklistTable = $('table#unchecked').DataTable({
  'paging'      : false,
  "scrollY": "200px",
  "scrollCollapse": true,
  'searching'   : true,
  'ordering'    : true,
  'info'        : false,
  'autoWidth'   : true,
  'fnInitComplete': function (oSettings) {
    $('.dataTables_scrollBody').slimScroll({
      height: '200px',
      alwaysVisible: true
    });
  }
});

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

$('.nav-pills li').click(function(){
  var nextId = $(this).children('a').attr("href");
  console.log(nextId);
  if(nextId == '#manual_mode'){
    $('#countdown').hide();
    $('#shot').show();
    shot = false;
    realtime = true;
  }
  else if (nextId == '#auto_mode'){
    shot = true;
    realtime = true;
    countdown();
    $('#countdown').show();
    $('#shot').hide();
  }
  else if(nextId == '#nonRealTime'){
    shot = false;
    realtime = false;
    console.log(realtime);
    $('#countdown').hide();
    $('#shot').show();
  }
  else{
    shot = false;
    realtime = true;
    $('.nav-pills .active').removeClass('active');
  }
});


function submit(){
  $('#user_profile').hide();
  Webcam.snap(function(data_uri) {
		$('#submit').attr("disabled", false);
		var img_base64 = data_uri.replace('data:image/jpeg;base64,', '');
    if(realtime){
      $('#message').html('辨識中，請稍後......');
      recognize(img_base64, false);
    }
    else{
      $('#message').html('送出中，請稍後......');
      sendPhoto(img_base64);
    }
	});
  $('#shot').show();
	$('#reshot').hide();
	$('#submit_photo').hide();
};

function sendPhoto(img_64){
  $.ajax({
		type: "POST",
		url: window.location.pathname + '_nonRealTime',
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		data: JSON.stringify({img: img_64}),
		success: function(data){
			if(data.error){
        $('#message').html("傳送錯誤！");
      }
      else{
        $('#message').html("送出成功！");
      }
		},
		failure: function(errMsg) {
			$('#loadingMsg').html('系統錯誤！');
			alert(errMsg);
		}
	});
}

function recognize(img_base64, auto){
	$.ajax({
		type: "POST",
		url: window.location.pathname,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		data: JSON.stringify({image: img_base64}),
		success: function(data){
			if(data.error){
        if(data.message == 'No face found') $('#message').html("辨識不到臉！");
        else if(data.message == 'Too many faces') $('#message').html("請一次一個人進行拍照！");
        else if(data.message == 'Unknown User') $('#message').html("未知的使用者！");
        else $('#message').html("偵測錯誤！");
      }
      else{
        if(data.checkin == 'not enrolled') $('#message').html('使用者尚未報名！');
        else if(data.checkin == 'already checked in') {
          $('#message').html("使用者已報到過了！");
        }
        else{
          $('#message').html("報到成功！");
          $('#user_profile').show();
          $('#user_id').html(data.profile.userID);
          $('#username').html(data.profile.username);
          $('#name').html(data.profile.name);
          $('#gender').html(data.profile.gender);
        }
      }
      if(auto){
        $('#countdown').empty();
        $('#countdown').append("重新開始辨識身分...");
        Webcam.unfreeze();
        setTimeout(function(){
          $('#countdown').empty();
          countdown();
        }, 2000);
      }
		},
		failure: function(errMsg) {
			$('#loadingMsg').html('辨識系統錯誤！');
			alert(errMsg);
		}
	});
}

function countdown(){
  $('#countdown').empty();
  $('#countdown').append("拍照倒數");
  var counter = setInterval(function(){
    if(shot){
      $('#countdown').append(count);
      count--;
      if(count == -1){
        count = 3;
        snap(counter);
      }
    }else{
      clearInterval(counter);
    }
    }, 1000);
}

function snap(counter){
  clearInterval(counter);
  $('#countdown').empty();
  $('#countdown').append("身分辨識中......");
  Webcam.freeze();
  Webcam.snap(function(data_uri){
    var img_base64 = data_uri.replace('data:image/jpeg;base64,', '');
    recognize(img_base64, true);
  });
}

function getAge(birthday) {
  birthday = new Date(birthday);
  var today = new Date();
  var age = today.getFullYear() - birthday.getFullYear();
  var m = today.getMonth() - birthday.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }
  return age;
}

$('button#submitForm').click(function(e){
  e.preventDefault();
  $('#checkin-modal').modal('hide');
  $.ajax({
		type: "POST",
		url: window.location.pathname+'/manual',
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		data: JSON.stringify({username: $('#form-username').val(), password: $('#form-password').val()}),
		success: function(data){
			if(data.error){
        if(data.message == 'Unknown User') $('#message').html("未知的使用者！");
        else if(data.message == 'Invalid Password') $('#message').html("密碼輸入錯誤！");
        else $('#message').html("偵測錯誤！");
      }
      else{
        if(data.checkin == 'not enrolled') $('#message').html('使用者尚未報名！');
        else if(data.checkin == 'already checked in') {
          $('#message').html("使用者已報到過了！");
        }
        else{
          $('#message').html("報到成功！");
          $('#user_profile').show();
          $('#user_id').html(data.profile.userID);
          $('#username').html(data.profile.username);
          $('#name').html(data.profile.name);
          $('#gender').html(data.profile.gender);
          updateList(data.profile, data.checkInTime);
        }
      }
      if(auto){
        $('#countdown').empty();
        $('#countdown').append("重新開始辨識身分...");
        Webcam.unfreeze();
        setTimeout(function(){
          $('#countdown').empty();
          countdown();
        }, 2000);
      }
		},
		failure: function(errMsg) {
			$('#loadingMsg').html('辨識系統錯誤！');
			alert(errMsg);
		}
	});
});

$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    var target = $(e.target).attr("href");
    if ((target == '#checked')) {
      checklistTable.draw();
    } else {
      unchecklistTable.draw();
    }
});

socket.on('update-checked-list', function(list){
  checklistTable.clear().draw();
  unchecklistTable.clear().draw();
  list.checked.forEach(function(user){
    var row = '<tr><td>'+user.username+'</td><td>'+user.name+'</td><td>'+moment(user.checkInTime).format('YYYY/MM/DD hh:mm:ss')+'</td></tr>';
    checklistTable.rows.add($(row)).draw();
  });
  list.unchecked.forEach(function(user){
    var row = '<tr><td>'+user.username+'</td><td>'+user.name+'</td><td>'+moment(user.checkInTime).format('YYYY/MM/DD hh:mm:ss')+'</td></tr>';
    unchecklistTable.rows.add($(row)).draw();
  });
//  checklistTable.draw();
});
