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

$('#createModal button#submit').on('click', function(){
  if($('#activityType').val() == 'none'){
    event.preventDefault();
    alert('請選擇活動類型！');
  }
  else{
    var form = $('#uploadActivity')[0];
    var data = new FormData(form);
    $.ajax({
      type: "POST",
      enctype: 'multipart/form-data',
      url: "/activity/upload",
      data: data,
      processData: false,
      contentType: false,
      cache: false,
      timeout: 600000,
      success: function (data) {
        if(data.error){
          console.log(data.check_errors);
          if(data.check_errors){
            data.check_errors.forEach(function(error){
              $('#check_errors').append('<div class="alert alert-danger">'+error.msg+'</div>');
            });

          }else{
            $('.alert-danger').show();
          }
          $("html, body, .modal").animate({ scrollTop: 0 }, "slow");
        }
        else{
          $('#createModal').modal('hide');
          $('.alert-success').show();
          var activity = data.newActivity;
          activityTable.row.add([activity._id, activity.title, activity.type, activity.venue, activity.speaker,
            moment.utc(activity.startTime).local().format('YYYY/MM/DD HH:mm'), moment.utc(activity.endTime).local().format('YYYY/MM/DD HH:mm')]).draw();
        }
      },
      error: function (e) {
        $('.alert-danger').show();
      }
    });
  }
});

$('#createModal').on('hide.bs.modal', function(){
  $('#createModal input').val('');
  $('#createModal select').val('');
  removeCover();
  $('.alert-danger').hide();
  $('#check_errors').html('');
});
