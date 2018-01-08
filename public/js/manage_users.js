var socket=io.connect();
var select = false;

$('#userList').DataTable({
  'paging'      : true,
  'lengthChange': true,
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
  'order': [[ 1, 'asc' ]]
});

$('#userList tbody tr').click(function(){
  if(!select) {
    var id = $(this).children().eq(1).text();
    socket.emit('selectUser', {user_id: id, getRelations: true});
    return false;
  }
});

$('#deleteModal #confirm').click(function(){
  var selected = [];
  $('tbody tr').each(function(){
    if($(this).hasClass('selected')){
      selected.push($(this).children().eq(1).text());
    }
  });

  socket.emit('delete_user', selected);
  $('#userList tr.selected').remove();
  $('#profile').hide();
  $('#relationList').hide();

  $('#deleteModal').modal('hide');
  $('.select-checkbox').hide();
  $('#select').show();
  $('#create').show();
  $('table#activityList tbody tr').css('cursor', 'pointer');
  select = false;
});

$('#select').click(function(){
  select = true;
  $('#userList tbody tr').css('cursor', 'default');
  $('.select-checkbox').show();
  $('#select').hide();
  $('#create').hide();
  $('#cancel').show();
  $('#delete').show();
});

$('#cancel').click(function(){
  $('.select-checkbox').hide();
  $('#cancel').hide();
  $('#delete').hide();
  $('#select').show();
  $('#create').show();
  $('userList tbody tr').css('cursor', 'pointer');
  $('useryList tbody tr').each(function(){
    if($(this).hasClass('selected')){
      $(this).removeClass('selected');
    }
  });

  select = false;
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

socket.on('userProfile', function(data){
  $('#profile').show();
  $('#relationList').show();
  $('.widget-user-name').text(data.profile.name);
  $('.widget-user-username').text('@' + data.profile.username);
  $('#profile .img-circle').attr('src', data.profile.profile_picture.path);
  $('.profile-age').text(getAge(data.profile.birth));
  displayRelatives(data.relations);
});


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

$('button#save').click(function(){
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

$('button#cancel').click(function(){
  $('.widget-user-header input#edit-name').hide();
  $('.widget-user-header input#edit-username').hide();
  $('.widget-user-header div.edit-btn-group').hide();
  $('.widget-user-header h3').show();
  $('.widget-user-header h5').show();
  $('.widget-user-header .btn-group').show();
});

$('#deleteModal #confirm').click(function(){
  socket.emit('delete_user', $('#userList tr.selected').attr('id'));
  $('#userList tr.selected').remove();
  $('#profile').hide();
  $('#relationList').hide();
  $('#deleteModal').modal('hide');
});

/*$('table tbody').slimScroll({
  height: '150px'
});*/
