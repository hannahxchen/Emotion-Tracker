var select = false;
var img_change = false;

$(document).ready(function(){
  var activity_id = $('.content-header text').text();
  var reader = new FileReader();

  $('.counter').counterUp({
    delay: 100,
    time: 1200
  });

  $('#checkedIn-list tbody tr').css('cursor', 'default');

  $('.circliful-chart').circliful();

  var checkedTable = $('#checkedList').DataTable({
    'paging'      : false,
    "scrollY": "200px",
    "scrollCollapse": true,
    "sScrollX": '100%',
    'searching'   : true,
    'ordering'    : true,
    'info'        : true,
    'autoWidth'   : true,
    'columnDefs': [ {
      'orderable': false,
      'className': 'select-checkbox',
      'targets':   0
    } ],
    'select': {
      'style': 'multi',
      'selector': 'td:first-child'
    },
    'order': [[ 1, 'asc' ]],
    'fnInitComplete': function (oSettings) {
      $('.dataTables_scrollBody').slimScroll({
        height: '200px',
        alwaysVisible: true
      });
    }
  });

  var uncheckedTable = $('#uncheckedList').DataTable({
    'paging'      : false,
    "scrollY": "200px",
    "sScrollX": '100%',
    "scrollCollapse": true,
    'searching'   : true,
    'ordering'    : true,
    'info'        : true,
    'autoWidth'   : true,
    'columnDefs': [ {
      'orderable': false,
      'className': 'select-checkbox',
      'targets':   0
    } ],
    'select': {
      'style': 'multi',
      'selector': 'td:first-child'
    },
    'order': [[ 1, 'asc' ]],
    'fnInitComplete': function (oSettings) {
      $('.dataTables_scrollBody').slimScroll({
        height: '200px',
        alwaysVisible: true
      });
    }
  });

  var tmpTable = $('#tmpList').DataTable({
    'paging'      : false,
    "scrollY": "200px",
    "sScrollX": '100%',
    "scrollCollapse": true,
    'searching'   : false,
    'ordering'    : true,
    'info'        : true,
    'autoWidth'   : true,
    'columnDefs': [ {
      'orderable': false,
      'className': 'select-checkbox',
      'targets':   0
    } ],
    'select': {
      'style': 'multi',
      'selector': 'td:first-child'
    },
    'order': [[ 2, 'asc' ]],
    'fnInitComplete': function (oSettings) {
      $('.dataTables_scrollBody').slimScroll({
        height: '200px',
        alwaysVisible: true
      });
    }
  });

  var userTable = $('#userList').DataTable({
    'paging'      : false,
    "scrollY": "200px",
    "scrollCollapse": true,
    "sScrollX": '100%',
    'searching'   : true,
    'ordering'    : true,
    'info'        : true,
    'autoWidth'   : true,
    'order': [[ 1, 'asc' ]],
    'fnInitComplete': function (oSettings) {
      $('.dataTables_scrollBody').slimScroll({
        height: '200px',
        alwaysVisible: true
      });
    }
  });

  var unenrollListTable = $('#unenrolledList').DataTable({
    'paging'      : false,
    "scrollY": "200px",
    "scrollCollapse": true,
    'searching'   : true,
    'ordering'    : true,
    'info'        : true,
    'autoWidth'   : true,
    'columnDefs': [ {
      'orderable': false,
      'className': 'select-checkbox',
      'targets':   0
    } ],
    'select': {
      'style': 'multi',
      'selector': 'td:first-child'
    },
    'order': [[ 1, 'asc' ]],
    'fnInitComplete': function (oSettings) {
      $('.dataTables_scrollBody').slimScroll({
        height: '200px',
        alwaysVisible: true
      });
    }
  });

  $('#uncheck-tab').on('shown.bs.tab', function (e) {
    uncheckedTable.draw();
  });

  $('#check-tab').on('shown.bs.tab', function (e) {
    checkedTable.draw();
  });

  $('#tmp-tab').on('shown.bs.tab', function (e) {
    tmpTable.draw();
    $('#tmpList tbody tr').css('cursor', 'pointer');
  });

  $('table#tmpList tbody').on('click', 'tr', function(){
    if(!select){
      var tmp_id = $(this).attr('id');
      $(this).addClass('selected');
      $('#tmp-img img').attr('src', $(this).children().eq(1).text());
      $(this).siblings().removeClass('selected');
      $('button#recognize').show();
      $('button#known').show();
      $('button#register-user').show();
    }
  });

  $('#enroll').click(function(){
    unenrollListTable.clear().draw();
    socket.emit('get_unenrolledList', activity_id);
  });

  socket.on('unenrolledList', function(unenrolled){
    unenrolled.forEach(function(user){
      update_unenrolled(user);
    });
  });

  function update_unenrolled(user){
    var data = '<tr><td></td><td>'+user.userID+'</td><td>'+user.username+'</td><td>'+user.name+'</td><td>'+user.gender+'</td></tr>';
    unenrollListTable.row.add($(data)).draw();
  }

  $('#select').click(function(){
    select = true;
    $('.select-checkbox').show();
    $('#select').hide();
    $('#enroll').hide();
    $('#cancel').show();
    $('#delete').show();
    $('tr.selected').removeClass('selected');
  });

  $('#cancel').click(function(){
    $('.select-checkbox').hide();
    $('tr.selected').removeClass('selected');
    $('#cancel').hide();
    $('#delete').hide();
    $('#select').show();
    $('#enroll').show();
    select = false;
  });

  $('th.select-checkbox').click(function(){
    if ($("th.select-checkbox").hasClass("selected")) {
        $('tbody tr').removeClass("selected");
        $("th.select-checkbox").removeClass("selected");
      }
    else {
      $('tbody tr').addClass("selected");
      $("th.select-checkbox").addClass("selected");
    }
  });

  $('#enrollModal button#confirm').click(function(){
    var selected = [];
    $('#enrollModal tbody tr.selected').each(function(){
      selected.push($(this).children().eq(1).text());
      var userData = $(this).children();
      var data = '<tr><td style="display: none;"></td>'+userData.eq(1)+'</td><td>'+userData.eq(2)+'</td><td>'+userData.eq(3)+'</td><td>'+userData.eq(4)+'</td></tr>';
      $('#uncheckedList tbody').append(data);
    });
    socket.emit('enroll_newUser', {activity_id: activity_id, list: selected});
    //renewDataTable('#uncheckedList');
    $('#enrollModal').modal('hide');
  });

  $('#enrollModal').on('shown.bs.modal', function(){
    unenrollListTable.draw();
  });

  $('#edit-activity').click(function(){
    $(this).hide();
    $('#cancel-edit').show();
    $('#save-activity').show();
    $('#activity tbody tr select').val($('#activity tbody tr#type').children().eq(1).text());
    $('table#activity tbody tr').each(function(){
      $(this).children().eq(1).hide();
      $(this).children('td').children('input').val($(this).children().eq(1).text());
      $(this).children().eq(2).show();
    });
    $('#startTime input').val(moment(Date.parse($('#startTime').children().eq(1).text())).format('YYYY-MM-DDThh:mm'));
    $('#endTime input').val(moment(Date.parse($('#endTime').children().eq(1).text())).format('YYYY-MM-DDThh:mm'));
    $('.content-header h1 input').val($('.content-header h1 span').text());
    $('.content-header h1 span').hide();
    $('.content-header h1 input').show();
    $('#upload_photo').show();
    $('#coverPhoto').hide();
    $('#input_img').css('display', 'inline-block');
  });

  $('#cancel-edit').click(function(){
    $(this).hide();
    $('#save-activity').hide();
    $('#edit-activity').show();
    $('table#activity tbody tr').each(function(){
      $(this).children().eq(2).hide();
      $(this).children().eq(1).show();
    });
    $('.content-header h1 span').show();
    $('.content-header h1 input').hide();
    $('#upload_photo').hide();
    $('#coverPhoto').show();
    img_change = false;
  });

  $('#save-activity').click(function(){
    var updates = {};
    var coverPhoto;
    $(this).hide();
    $('#cancel-edit').hide();
    $('#edit-activity').show();
    if($('#startTime').children().eq(1).text() != moment($('#startTime input').val()).format('YYYY/MM/DD hh:ss A')){
      $('#startTime').children().eq(1).text(moment($('#startTime input').val()).format('YYYY/MM/DD hh:ss A'));
      updates.startTime = moment($('#startTime input').val()).toISOString()
    }
    if($('#endTime').children().eq(1).text() != moment($('#endTime input').val()).format('YYYY/MM/DD hh:ss A')){
      $('#endTime').children().eq(1).text(moment($('#endTime input').val()).format('YYYY/MM/DD hh:ss A'));
      updates.endTime = moment($('#endTime input').val()).toISOString()
      console.log(updates.endTime);
    }
    if($('#activity tbody tr select').val() != $('#activity tbody tr#type').children().eq(1).text()){
      $('#activity tbody tr#type').children().eq(1).text($('#activity tbody tr select').val());
      var activity_type = $('#activity tbody tr select').val();
    }
    $('table#activity tbody tr').each(function(){
      if($(this).attr('id') != 'startTime' && $(this).attr('id') != 'endTime' && $(this).attr('id') != 'type'){
        if($(this).children().eq(1).text() != $(this).children('td').children('input').val()){
          var tag_id = $(this).attr('id');
          $(this).children().eq(1).text($(this).children('td').children('input').val());
          updates[tag_id] = $(this).children('td').children('input').val();
        }
      }
      $(this).children().eq(2).hide();
      $(this).children().eq(1).show();
    });
    if($('.content-header h1 input').val() != $('.content-header h1 span').text()){
      updates.title = $('.content-header h1 input').val();
      $('.content-header h1 span').text($('.content-header h1 input').val());
    }

    if(img_change){
      if($('#cover-preview').attr('src').length == 0) coverPhoto = false;
      else coverPhoto = reader.result.replace('data:image/jpeg;base64,', '');
      $('#coverPhoto img').attr('src', reader.result);
    }
    else coverPhoto = false;

    $('.content-header h1 input').hide();
    $('.content-header h1 span').show();
    $('#coverPhoto').show();
    $('#upload_photo').hide();

    if(updates || activity_type)
      socket.emit('update-activity', {id: activity_id, updates: updates, activity_type: activity_type, coverPhoto: coverPhoto});

    img_change = false;
  });

  function readURL(input){
    if (input.files && input.files[0]) {
      reader.onload = function (e) {
        $('#cover-preview').attr('src', e.target.result);
        $('#cover-preview').show();
      };

      reader.readAsDataURL(input.files[0]);
    }else{
      $('#cover-preview').hide();
    }
    img_change = true;
  }

  function removeCover(){
    $('#input_img').val('');
    $('#cover-preview').attr('src', '');
    $('#cover-preview').hide();
    img_change = true;
  }

  var loading = false;

  $('#recognizeModal').on('hide.bs.modal', function (e) {
    if(loading){
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });

  $('button#recognize').click(function(e){
    e.preventDefault();
    loading = true;
    $('#recognize-result').hide();
    $('#loader').show();
    $('#recognizeModal').modal('show');
    $.ajax({
      url: '/activity/recognize/checkinTmp',
      type: 'POST',
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify({path: $('#tmp-img img').attr('src')}),
      success: function(result) {
        loading = false;
        if(result.error){
          console.log(result.message);
          $('#recognizeModal').modal('hide');
          $('#AlertModal span').text(result.message);
          $('#AlertModal').modal('show');
        }
        else{
          var c = document.getElementById("myCanvas");
          var ctx = c.getContext("2d");
          var canvas = ctx.canvas;
          $('#recognizeModal tbody').html('');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.font = "16px Arial";
          ctx.strokeStyle="#ffff00";
          ctx.lineWidth = 3;
          ctx.fillStyle = '#ffff00';
          var img = new Image();
          img.src = $('#tmp-thumbnail').attr('src');
          var scaleX = canvas.width / img.width;
          var scaleY = canvas.height / img.height;
          var ratio  = Math.min ( scaleX, scaleY );
          var centerShift_x = ( canvas.width - img.width*ratio ) / 2;
          var centerShift_y = ( canvas.height - img.height*ratio ) / 2;
          ctx.drawImage(img, 0, 0, img.width, img.height,
                      0, 0, img.width*ratio, img.height*ratio);
          var count = 0;
          var rects = [];

          result.results.forEach(function(person, i){
            ctx.strokeRect(person.transaction.topLeftX*ratio,  person.transaction.topLeftY*ratio, person.transaction.width*ratio, person.transaction.height*ratio);
            rects.push({x: person.transaction.topLeftX*ratio, y: person.transaction.topLeftY*ratio, w: person.transaction.width*ratio, h: person.transaction.height*ratio });

            if(person.transaction.status == 'success'){
              ctx.fillText('#' + i +': '+ result.profile[count].name, person.transaction.topLeftX*ratio, person.transaction.topLeftY*ratio -10);
              $('#recognizeModal tbody').append('<tr><td>'+i+'</td><td>'+person.transaction.subject_id+'</td><td>'+result.profile[count].name+'</td></tr>');
              count++;
            }
            else{
              ctx.fillText('#' + i +': unknown', person.transaction.topLeftX*ratio, person.transaction.topLeftY*ratio  -10);
              $('#recognizeModal tbody').append('<tr><td>'+i+'</td><td>unknown</td><td>unknown</td></tr>');
            }
          });
          $('#recognize-result').show();
          $('#loader').hide();
          $('#recognizeModal').modal('show');
        }
      }
    });
  });

  $('button#known').click(function(e){
    e.preventDefault();
    socket.emit('get-user-data', true);
    $('#knownModal #compare-img').attr('src',$('#tmp-thumbnail').attr('src'));
    $('#knownModal #compare-user').attr('src','');
    $('#knownModal').modal('show');
  });

  socket.on('send-user-data', function(users){
    userTable.clear().draw();
    users.forEach(function(user){
      var newRow = '<tr><td style="display: none;">'+user.profile_picture_id+'</td><td>'+user.userID+'</td><td>'+user.username+'</td><td>'+user.name+'</td><td>'+user.gender+'</td><td>'+user.role+'</td></tr>';
      userTable.rows.add($(newRow)).draw();
    });
  });

  $('table#userList tbody').on('click', 'tr', function(){
    if(!select){
      var select_id = $(this).attr('id');
      $(this).addClass('selected');
      $(this).siblings().removeClass('selected');
      var url = window.location.href;
      var arr = url.split("/");
      $('#knownModal #compare-user').attr('src', arr[0] + "//" + arr[2]+'/avatar/'+$(this).children().eq(0).text()+'.jpg');
    }
  });

  $('#knownModal button#confirm').click(function(e){
    e.preventDefault();
    var select_id = $('table#userList .selected').children().eq(1).text();
    var tmp_id = $('table#tmpList .selected').attr('id');
    $.ajax({
      url: '/admin/manageActivities/updateTmp/'+activity_id,
      type: 'POST',
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify({tmp_id: tmp_id, user_id: select_id}),
      success: function(result) {
        if(result.error){
          $('.content .alert-danger').show();
          $('.content .alert-danger').text('送出失敗');
        }
        else{
          $('.content .alert-success').show();
          $('.content .alert-success').text('修改成功');
          userTable.rows('.selected').remove().draw();
          updateCheckList(result.enroll.enrollList);
        }
      }
    });
    $('#knownModal').modal('hide');
  });

  $('#knownModal').on('shown.bs.modal', function() {
    userTable.draw();
  });

  function updateCheckList(list){
    checkedTable.clear().draw();
    list.forEach(function(data){
      if(data.checkIn){
        var newRow = '<tr><td style="display:none;"></td><td>'+data.user_id+'</td><td>'+data.data.username+'</td><td>'+data.data.name+'</td><td>'+data.data.gender+'</td><td>'+data.checkInTime+'</td></tr>';
        checkedTable.rows.add($(newRow));
      }
    });
    checkedTable.draw();
  }

  $('#deleteModal button#confirm').click(function(){
    if($('ul.nav-tabs li.active').attr('id') == 'check-tab' || $('ul.nav-tabs li.active').attr('id') == 'uncheck-tab'){
      var selected = [];
      $('#checkedList tr.selected').each(function(){
        selected.push($(this).children().eq(1).text());
      });
      $('#uncheckedList tr.selected').each(function(){
        selected.push($(this).children().eq(1).text());
      });
      console.log(selected);
      $.ajax({
        url: '/admin/manageActivities/deleteEnroll/'+activity_id,
        type: 'POST',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({selected: selected}),
        success: function(result) {
          if(result.error){
            $('.content .alert-danger').show();
            $('.content .alert-danger').text('刪除失敗');
          }
          else{
            $('.content .alert-success').show();
            $('.content .alert-success').text('刪除成功');
            checkedTable.rows('.selected').remove().draw();
            uncheckedTable.rows('.selected').remove().draw();
          }
        }
      });
    }
    else if($('ul.nav-tabs li.active').attr('id') == 'tmp-tab'){
      var selected = [];
      $('#userList tr.selected').each(function(){
        selected.push($(this).attr('id'));
      });

      console.log(selected);
      $.ajax({
        url: '/admin/manageActivities/deleteTmp',
        type: 'POST',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({selected: selected}),
        success: function(result) {
          if(result.error){
            $('.content .alert-danger').show();
            $('.content .alert-danger').text('刪除失敗');
          }
          else{
            $('.content .alert-success').show();
            $('.content .alert-success').text('刪除成功');
            userTable.rows('.selected').remove().draw();
          }
        }
      });
    }

    $('.select-checkbox').hide();
    $('#deleteModal').modal('hide');
    $('#select').show();
    $('#cancel').hide();
    $('#delete').hide();
    $('#enroll').show();
  });

  $('#recognizeModal tbody').on('click', 'tr', function(){
    $(this).addClass('selected');
    $(this).siblings().removeClass('selected');
    if($(this).children().eq(1) == 'unknown')
      $('#recognize-register').show();
    else
      $('#recognize-checkin').show();
  });

  $('#recognize-checkin').on('click', function(e){
    e.preventDefault();
    var tmp_id = $('#tmpList tr.selected').attr('id');
    var user_id = $('#recognizeModal tbody tr').children().eq(1).text();
    $.ajax({
      url: '/admin/manageActivities/updateTmp/'+activity_id,
      type: 'POST',
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify({tmp_id: tmp_id, user_id: user_id}),
      success: function(result) {
        if(result.error){
          $('.content .alert-danger').show();
          $('.content .alert-danger').text('送出失敗');
        }
        else{
          $('.content .alert-success').show();
          $('.content .alert-success').text('送出成功');
          tmpTable.row($('#tmpList tr.selected')).remove().draw();
          $('#tmp-thumbnail').attr('src', '');
        }
      }
    });
    $('#recognizeModal').modal('hide');
    $('#recognize-checkin').hide();
    $('#recognize-register').hide();
    $('#recognizeModal tbody').html('');
  });

  $('#recognize-register').on('click', function(e){
    e.preventDefault();
    var tmp_id = $('#tmpList tr.selected').attr('id');
    var user_id = $('recognizeModal tr').children().eq(1).text();
    $.ajax({
      url: '/updateTmp/'+activity_id,
      type: 'POST',
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify({tmp_id: tmp_id, user_id: user_id}),
      success: function(result) {
        if(result.error){
          $('.content .alert-danger').show();
          $('.content .alert-danger').text('送出失敗');
        }
        else{
          $('.content .alert-success').show();
          $('.content .alert-success').text('送出成功');
          if(result.data) {
            var item = '<tr><td></td><td>'+result.data.userID+'<td></td>'+result.data.username+'<td></td>'+result.data.name+'<td></td>'+result.data.gender+'<td></td>'+result.time+'</td></tr>';
            checkedTable.row.add($(item)).draw();
          }
        }
      }
    });
    $('#recognizeModal').modal('hide');
    $('#recognize-checkin').hide();
    $('#recognize-register').hide();
    $('#recognizeModal tbody').html('');
  });

});
