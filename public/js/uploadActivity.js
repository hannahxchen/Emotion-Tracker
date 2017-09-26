var UTCdate = moment.utc().format('YYYY-MM-DD HH:mm');
var stillUtc = moment.utc(UTCdate).toDate();
var date = moment(stillUtc).local().format('YYYY-MM-DD');
var time = moment(stillUtc).local().format('HH:mm');

$('#startDate').val(date);
$('#endDate').val(date);
$('#startTime').val(time);
$('#endTime').val(time);
$('#deadLine-date').val(date);
$('#deadLine-time').val(time);

function readURL(input){
  if (input.files && input.files[0]) {
    var reader = new FileReader();

    reader.onload = function (e) {
      $('#cover-preview').attr('src', e.target.result);
      $('#cover-preview').show();
    };

    reader.readAsDataURL(input.files[0]);
  }else{
    $('#cover-preview').hide();
  }
}

function removeCover(){
  $('#cover-img').val('');
  $('#cover-preview').attr('src', '');
  $('#cover-preview').hide();
}

$('#submit').click(function(){
  if($('#activityType').val() == 'none'){
    event.preventDefault();
    alert('請選擇活動類型！');
  }
});
