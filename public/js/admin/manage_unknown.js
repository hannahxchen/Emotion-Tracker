var socket=io.connect();

var userTable = $('#unknownUserTable').DataTable({
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
  'order': [[ 1, 'asc' ]],
  'fnInitComplete': function (oSettings) {
    $('.dataTables_scrollBody').slimScroll({
      height: '200px',
      alwaysVisible: true
    });
  }
});

$('thead th:first-child, tbody td:first-child').hide();

userTable.draw();

$('#unknownUserList tbody tr').click(function(){
  $(this).addClass("selected").siblings().removeClass("selected");
  $(this).children().css('background-color', '#87CEFA');
  $(this).siblings().children().css('background-color', '#FFFFFF');

  var user_id = $(this).children().eq(1).text();
  socket.emit('selectUser', {user_id: user_id, getRelations: false});
});

socket.on('userData', function(data){
  $('#profile').show();
  $('#relationList').show();
  if(data.profile.name) $('.widget-user-name').text(data.profile.name);
  else $('.widget-user-name').text('Unknown');
  if(data.profile.username) $('.widget-user-username').text('@' + data.profile.username);
  else $('.widget-user-username').text('@');

  $('#profile .img-circle').attr('src', data.profile.profile_picture.path);
  if(data.profile.birth) $('.profile-age').text(getAge(data.profile.birth));
  else $('.profile-age').text(data.age);

  $('#profile h5.profile-gender').text(data.profile.gender);
});

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
  $('.widget-user-header button#save').show();
  $('.widget-user-header button#cancel').show();

  //edit gender
  var gender = $('#profile h5.profile-gender').text();
  $('select#edit-gender').val(gender);
  $('#profile h5.profile-gender').hide();
  $('select#edit-gender').show();
});

$('.widget-user-header button#save').click(function(){
  var name = $('.widget-user-header input#edit-name').val();
  var username = $('.widget-user-header input#edit-username').val();
  var gender =   $('select#edit-gender').val();
  if(name != $('.widget-user-header h3').text() || username != $('.widget-user-header h5').text() || gender!= $('#profile h5.profile-gender').text()){
    var userID = $('#unknownUserList tr.selected').children().eq(1).text();
    socket.emit('edit_profile', {userID: userID, update: {name: name, username: username, gender: gender}});
    $('#unknownUserList tr.selected').children().eq(3).text(name);

    $('#profile h5.profile-gender').text(gender);
    $('#unknownUserList tr.selected').children().eq(2).text(gender);
  }
  $('.widget-user-header input#edit-name').hide();
  $('.widget-user-header input#edit-username').hide();
  $('.widget-user-header button#save').hide();
  $('.widget-user-header button#cancel').hide();
  $('.widget-user-header h3').text(name);
  $('.widget-user-header h5').text('@'+username);
  $('.widget-user-header h3').show();
  $('.widget-user-header h5').show();
  $('.widget-user-header .btn-group').show();

  $('#profile h5.profile-gender').show();
  $('select#edit-gender').hide();
});

$('.widget-user-header button#cancel').click(function(){
  $('.widget-user-header input#edit-name').hide();
  $('.widget-user-header input#edit-username').hide();
  $('.widget-user-header button#save').hide();
  $('.widget-user-header button#cancel').hide();
  $('.widget-user-header h3').show();
  $('.widget-user-header h5').show();
  $('.widget-user-header .btn-group').show();

  $('#profile h5.profile-gender').show();
  $('select#edit-gender').hide();
});

$('#deleteModal #confirm').click(function(){
  socket.emit('delete_user', $('#unknownUserList tr.selected').children().eq(1).text());
  $('#unknownUserList tr.selected').remove();
  $('#profile').hide();
  $('#deleteModal').modal('hide');
});
