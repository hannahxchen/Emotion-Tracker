var select = false;
var img_change = false;
var user_id = [];
var updates = {};
var reader = new FileReader();
var updating = false;

$('.dropdate').dropdate({
  dateFormat:'yyyy/mm/dd'
});

var userTable = $('#userList').DataTable({
  "paging": false,
  "scrollY": "200px",
  "scrollCollapse": true,
  'searching'   : true,
  'ordering'    : true,
  'info'        : false,
  'autoWidth'   : true,
  responsive  : {
    details: {
      type: 'column'
    }
  },
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
      height: '250px',
      alwaysVisible: true
    });
  }
});

var taskTable = $('#taskList').DataTable({
  "scrollY":        "200px",
  "scrollCollapse": true,
  "paging":   false,
  'searching'   : true,
  'ordering'    : true,
  'info'        : false,
  'autoWidth'   : true,
  responsive  : {
    details: {
      type: 'column'
    }
  },
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

$('table thead th:first-child, table tbody td:first-child').hide();
$('#profileModal table thead th:first-child, #profileModal table tbody td:first-child').show();
userTable.draw();

$('#userList tbody tr').click(function(){
  $(this).addClass("selected").siblings().removeClass("selected");
  user_id[0] = $(this).children().eq(1).text();
  socket.emit('selectUser', {user_id: user_id[0], getRelations: true});
});

$('#profile #deleteModal #confirm').click(function(){
  $.ajax({
    url: '/removeUser',
    type: 'POST',
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    data: JSON.stringify({userID: user_id[0]}),
    success: function(result) {
      if(result.error){
        $('.content .alert-danger').show();
        $('.content .alert-danger').text('刪除失敗');
      }
      else{
        $('.content .alert-success').show();
        $('.content .alert-success').text('刪除成功');
        userTable.rows('.selected').remove().draw();
        $('#profile').hide();
        $('#relationList').hide();
        $('#task-area').hide();
      }
    }
  });

  $('#deleteModal').modal('hide');
  $('table#userList tbody tr').css('cursor', 'pointer');
});

socket.on('userData', function(data){
  $('div#profile').show();
  //$('#relationList').show();
  $('.profile-name').text(data.profile.name);
  $('#userList .selected').find('.list-name').text(data.profile.name);
  $('.profile-userid').text(data.profile.userID);
  $('div#profile .profile-username').text('@' + data.profile.username);
  $('#userList .selected').find('.list-username').text(data.profile.username);
  $('#profileModal .profile-username-plain').text(data.profile.username);
  $('#profile img, #profile-avatar img').attr('src', data.profile.profile_picture.path);
  $('.profile-age').text(getAge(data.profile.birth));
  $('.profile-gender').text(data.profile.gender);
  $('#userList .selected').find('.list-gender').text(data.profile.gender);
  $('.profile-registered-time').text(moment.utc(data.profile.createdAt).local().format('YYYY/MM/DD HH:mm:ss'));
  $('.profile-email').text(data.profile.email);
  $('.profile-birth').text(moment.utc(data.profile.birth).local().format('YYYY/MM/DD'));
  var role;
  if(data.profile.role == 'elder')
    role = '一般使用者';
  else if(data.profile.role == 'relative')
    role = '家屬';
  else if(data.profile.role == 'admin')
    role = '管理員';
  else if(data.profile.role == 'unregistered')
    role = '未註冊';
  else
    role = '未知';

  $('.profile-role').text(role);
  $('#userList .selected').find('.list-role').text(role);
  //displayRelatives(data.relations);

  taskTable.clear().draw();
  data.tasks.forEach(function(task){
    newTask(task);
  });

  $('#task-area').show();
  taskTable.draw();
});

function displayProfile(){

}


function getAge(birthday) {
  var today = new Date();
  birthday = new Date(birthday);
  var age = today.getFullYear() - birthday.getFullYear();
  var m = today.getMonth() - birthday.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }
  return age;
}

function displayRelatives(users){
  for(key in users){
    var intimacy = '<div class="progress"><div class="progress-bar progress-bar-danger" style="width: 55%"></div><span class="progress-completed">55%</span></div>';
    var text = '<td>'+(key+1)+'</td>'+'<td>'+users[key].relative_profile.name+'</td>'+'<td>'+intimacy+'</td>'+'<td>'+users[key].relation_type.type+'</td>'+'</td>';
    $('#relationList tbody').append('<tr id='+users[key].relative_profile.username+'></tr>');
    $('#relationList tbody #'+users[key].relative_profile.username).append(text);
  }
}

$('#profile li#edit a').click(function(){
  $('.widget-user-header h3').hide();
  $('.widget-user-header h5').hide();
  $('.widget-user-header .btn-group').hide();
  var name = $('.widget-user-header h3').text();
  var username = $('.widget-user-header h5').text().replace('@', '');
  $('.widget-user-header input#edit-name').val(name);
  $('.widget-user-header input#edit-username').val(username);
  $('.widget-user-header input#edit-name').show();
  $('.widget-user-header input#edit-username').show();
  $('.widget-user-header div.edit-btn-group').show();
});

$('#profile button#save').click(function(){
  var name = $('.widget-user-header input#edit-name').val();
  var username = $('.widget-user-header input#edit-username').val();
  if(name != $('.widget-user-header h3').text() || username != $('.widget-user-header h5').text()){
    var userID = $('#userList tr.selected').attr('id');
    socket.emit('edit_profile', {userID: userID, update: {name: name, username: username}});
    $('#userList tr.selected').children().eq(1).text(name);
    $('#userList tr.selected').children().eq(0).text(username);
  }
  $('.widget-user-header input#edit-name').hide();
  $('.widget-user-header input#edit-username').hide();
  $('.widget-user-header div.edit-btn-group').hide();
  $('.widget-user-header h3').text(name);
  $('.widget-user-header h5').text('@'+username);
  $('.widget-user-header h3').show();
  $('.widget-user-header h5').show();
  $('.widget-user-header .btn-group').show();
});

$('#urgency input').iCheck({
  checkboxClass: 'icheckbox_square',
  radioClass: 'iradio_square-blue'
});

$('th.select-checkbox').click(function(){
  if ($("th.select-checkbox").hasClass("selected")) {
      $('tbody tr').removeClass("selected");
      $("th.select-checkbox").removeClass("selected");
    } else {
      $('tbody tr').addClass("selected");
      $("th.select-checkbox").addClass("selected");
    }
});

$('#task-area #select').click(function(){
  $('#newTask').hide();
  $('#task-area #select').hide();
  $('#task-area #delete').show();
  $('#task-area #cancel').show();
  $('table#taskList tbody tr').css('cursor', 'default');
  $('#task-area .select-checkbox').show();

  select = true;
});

$('#task-area #cancel').click(function(){
  $('#newTask').show();
  $('#task-area #select').show();
  $('#task-area #delete').hide();
  $('#task-area #cancel').hide();
  $('#task-area .select-checkbox').hide();
  $('table#taskList tbody tr').css('cursor', 'pointer');
  $('table#taskList tbody tr').each(function(){
    if($(this).hasClass('selected')){
      $(this).removeClass('selected');
    }
  });

  $('#task-area th.select-checkbox').each(function(){
    if($(this).hasClass('selected')){
      $(this).removeClass('selected');
    }
  })

  select = false;
});

$('#task-area #delete').click(function(e){
  var selected = [];
  $('#taskList body tr').each(function(){
    if($(this).hasClass('selected')){
      selected.push($(this).children().eq(1).text());
    }
  });

  if(selected.length == 0){
    $('.content .alert-warning').text('您尚未選取任何一筆資料');
    $('.content .alert-warning').show();
    e.preventDefault();
  }
});

$('.btn-group li').click(function(){
  $('.content .alert-danger').hide();
  $('.content .alert-success').hide();
  $('.content .alert-warning').hide();
});

$('#deleteTaskModal #confirm').click(function(){

  var selected = [];
  var error = false;
  $('#taskList tbody tr').each(function(){
    if($(this).hasClass('selected')){
      selected.push($(this).children().eq(1).text());
    }
  });

  $.ajax({
    url: '/admin/tasks/deleteTasks',
    type: 'POST',
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    data: JSON.stringify({selected: selected}),
    success: function(result) {
      if(result.error){
        error = true;
        $('.content .alert-danger').show();
        $('.content .alert-danger').text('刪除失敗');
      }
      else{
        $('.content .alert-success').show();
        $('.content .alert-success').text('刪除成功');
        taskTable.rows('.selected').remove().draw();


      }
    }
  });

  $('#deleteTaskModal').modal('hide');
  $('#task-area .select-checkbox').hide();
  $('table#taskList tbody tr').css('cursor', 'pointer');
  select = false;

  $('#task-area #newTask').show();
  $('#task-area #select').show();
  $('#task-area #delete').hide();
  $('#task-area #cancel').hide();

  $('#task-area th.select-checkbox').each(function(){
    if($(this).hasClass('selected')){
      $(this).removeClass('selected');
    }
  })
});


$('#createTaskType').click(function(){
  var newType = $('#newTaskType').val();
  $.ajax({
    url: '/admin/tasks/createTaskType',
    type: 'POST',
    contentType: "application/json; charset=utf-8",
		dataType: "json",
		data: JSON.stringify({type: newType}),
    success: function(result) {
      if(result.error){
        $('#createModal .bg-danger').show();
        $('#newTaskType').val('');
      }
      else{
        $('#newTaskType').val('');
        $('#createModal select').append('<option value="'+newType+'">'+ newType +'</option>');
        $('#createModal .bg-success').show();
      }
    }
  });
});

$('#createModal #content, #createModal input, #createModal select').focus(function(){
  $('#createModal .bg-warning').hide();
  $('#createModal .bg-success').hide();
  $('#createModal .bg-danger').hide();
});

$("#createModal").on("hidden.bs.modal", function () {
  $('select').val('');
  $('#createModal #content').val('');
});

$('#task-area #createModal #submit').click(function(){
  var type = $('#createModal option:selected').text();
  var urgency = $('#urgency input:checked').val();
  var content = $('#content').val();

  if(!type || ! urgency || !content)
    $('.bg-warning').show();
  else{
    $('#createModal').modal('hide');

    $.ajax({
      url: '/admin/tasks/createTask',
      type: 'POST',
      contentType: "application/json; charset=utf-8",
  		dataType: "json",
  		data: JSON.stringify({type: type, urgency: urgency, content: content, object_id: user_id}),
      success: function(result) {
        if(result.error){
          $('.content .alert-danger').show();
          $('.content .alert-danger').text('新增失敗');
        }
        else{
          result.tasks.forEach(function(task){
            newTask(task);
          });

          $('.content .alert-success').show();
          $('.content .alert-success').text('新增成功');

          $('#createModal option:selected').text('');
          $('#createModal #content').val('');
        }
      }
    });
  }

});

function newTask(task) {
  var task_row = '<tr><td style="display: none;"></td><td>'+task._id+'</td><td>'+task.applicant_id+'</td><td>'+task.task_type.type+'</td><td>'+task.content+'</td><td>';

  if(task.urgency == 'critical') task_row += '<span class="badge bg-red">Critical</span>';
  else if(task.urgency == 'normal') task_row += '<span class="badge bg-yellow">Normal</span>';
  else task_row += '<span class="badge bg-green">Low</span>';

  task_row += '</td><td>'+moment(task.createdAt).format('YYYY/MM/DD HH:mm:ss') +'</td><td>'+ task.done +'</td></tr>';
  taskTable.rows.add($(task_row)).draw();
}

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
}

$('#edit-profile').click(function(){
  $(this).hide();
  $('#cancel-edit').show();
  $('#save-profile').show();
  $('#profileModal .edit-input').each(function(){
    $(this).prev().hide();
    $(this).find('input').val($(this).prev().text());
    $(this).find('select').val($(this).prev().text());
    $(this).show();
  });
  $('#profileModal .edit-birth').find('select').eq(0).val(moment(Date.parse($('.profile-birth').text())).format('YYYY'));
  $('#profileModal .edit-birth').find('select').eq(1).val(moment(Date.parse($('.profile-birth').text())).format('M'));
  $('#profileModal .edit-birth').find('select').eq(2).val(moment(Date.parse($('.profile-birth').text())).format('D'));
  $('#cover-preview').attr('src', $('#profile-avatar img').attr('src'));
  $('#cover-preview').show();
  $('#upload_photo').show();
  $('#profile-avatar').hide();
  $('#input_img').css('display', 'inline-block');
});

$('#cancel-edit').click(function(){
  $(this).hide();
  $('#save-profile').hide();
  $('#edit-profile').show();
  $('#profileModal .edit-input').each(function(){
    $(this).prev().show();
    $(this).hide();
  });
  $('#upload_photo').hide();
  $('#profile-avatar').show();
  img_change = false;
  updates = {};
});

$('#profileModal tbody input').focusout(function(){
  if($(this).val()!= $(this).parent().prev().text()){
    if($(this).parent().prev().attr('class') == 'profile-name') updates.name = $(this).val();
    else if($(this).parent().prev().attr('class') == 'profile-username-plain') updates.username = $(this).val();
    else if($(this).parent().prev().attr('class') == 'profile-password') updates.password = $(this).val();
    else if($(this).parent().prev().attr('class') == 'profile-email') updates.email = $(this).val();
  }
});

$('#profileModal tbody select').change(function(){
  if($(this).val()!= $(this).parent().prev().text()){
    if($(this).parent().prev().attr('class') == 'profile-gender') {
      updates.gender = $(this).val();
      $(this).parent().prev().text($(this).val());
    }
    else if($(this).parent().prev().attr('class') == 'profile-role') {
      updates.role = $(this).val();
      $(this).parent().prev().text($(this).val());
    }
    else if($(this).parent().prev().attr('class') == 'profile-birth') {
      updates.birth = $('.edit-birth').find('input').val();
    }
  }
});

$('#save-profile').click(function(){
  var avatar;

  if(img_change){
    updating = true;
    $('#profileModal .bg-info').show();
    if($('#cover-preview').attr('src').length == 0) avatar = false;
    else avatar = reader.result.replace('data:image/jpeg;base64,', '');
    $('#profile-avatar img, .profile-user-img').attr('src', reader.result);

    if(avatar){
      $.ajax({
        url: '/updateAvatar/'+ user_id[0],
        type: 'POST',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({avatar: avatar}),
        success: function(result) {
          if(result.error){
            $('#profileModal #img_error').show();
            if(result.message) $('#profileModal #img_error').text(result.message);
            else $('#profileModal #img_error').text('頭貼更新失敗');
          }
          else{
            $('#profileModal #img_success').show();
          }
          updating = false;
          $('#profileModal .bg-info').hide();
        }
      });
    }
  }

  if(!jQuery.isEmptyObject(updates)){
    $.ajax({
      url: '/updateProfile/'+ user_id[0],
      type: 'POST',
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify({updates: updates}),
      success: function(result) {
        if(result.error){
          $('#profileModal #profile-error').show();
        }
        else{
          socket.emit('selectUser', {user_id: user_id[0], getRelations: true});

          $('#profileModal #profile-success').show();
        }
      }
    });
  }

  updates = {};
  $(this).hide();
  $('#upload_photo').hide();
  $('#profile-avatar').show();
  $('#cancel-edit').hide();
  $('#edit-profile').show();
  $('#profileModal .edit-input').each(function(){
    $(this).prev().show();
    $(this).hide();
  });
  img_change = false;
});

$('#profileModal').on("hidden.bs.modal", function () {
  $('.bg-danger').hide();
  $('.bg-success').hide();
  $('#save-profile').hide();
  $('#upload_photo').hide();
  $('#profile-avatar').show();
  $('#cancel-edit').hide();
  $('#edit-profile').show();
  $('#profileModal .edit-input').each(function(){
    $(this).prev().show();
    $(this).hide();
  });
  $('#profileModal #img_error').text('頭貼更新失敗');
  img_change = false;
});

$('#profileModal').on('hide.bs.modal', function (e) {
    if(updating){
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
});
