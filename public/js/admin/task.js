var select = false;
var selected_userID = [];

var taskTable = $('#taskList').DataTable({
  "scrollY":        "200px",
  "scrollCollapse": true,
  'paging'      : false,
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
  'order': [[ 6, 'asc' ]],
  'fnInitComplete': function (oSettings) {
    $('.dataTables_scrollBody').slimScroll({
      height: '200px',
      alwaysVisible: true
    });
  }
});

var userTable = $('#userList').DataTable({
  "scrollY":        "150px",
  "scrollCollapse": true,
  'paging'      : false,
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
      height: '150px',
      alwaysVisible: true
    });
  }
});

$('#taskList thead th:first-child, #taskList tbody td:first-child').hide();


$('#urgency input').iCheck({
  checkboxClass: 'icheckbox_square',
  radioClass: 'iradio_square-blue'
});

$('#select').click(function(){
  $('#newTask').hide();
  $('#select').hide();
  $('#delete').show();
  $('#cancel').show();
  $('table#taskList tbody tr').css('cursor', 'default');
  $('.select-checkbox').show();

  select = true;
});

$('#cancel').click(function(){
  $('#newTask').show();
  $('#select').show();
  $('#delete').hide();
  $('#cancel').hide();
  $('.select-checkbox').hide();
  $('table#taskList tbody tr').css('cursor', 'pointer');
  $('table#taskList tbody tr').each(function(){
    if($(this).hasClass('selected')){
      $(this).removeClass('selected');
    }
  });

  $('th.select-checkbox').each(function(){
    if($(this).hasClass('selected')){
      $(this).removeClass('selected');
    }
  })

  select = false;
});

$('#delete').click(function(e){
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

$('#deleteModal #confirm').click(function(){

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

  $('#deleteModal').modal('hide');
  $('.select-checkbox').hide();
  $('table#taskList tbody tr').css('cursor', 'pointer');
  select = false;

  $('#newTask').show();
  $('#select').show();
  $('#delete').hide();
  $('#cancel').hide();

  $('th.select-checkbox').each(function(){
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
  $('#object_id').val('');
});

$('#userListModal').on('shown.bs.modal', function(){
  userTable.draw();
});

$('#createModal #submit').click(function(){
  var type = $('#createModal option:selected').text();
  var urgency = $('#urgency input:checked').val();
  var content = $('#content').val();

  if(!type || ! urgency || !content || $('#object_id').val() == '')
    $('.bg-warning').show();
  else{
    $('#createModal').modal('hide');

    $.ajax({
      url: '/admin/tasks/createTask',
      type: 'POST',
      contentType: "application/json; charset=utf-8",
  		dataType: "json",
  		data: JSON.stringify({type: type, urgency: urgency, content: content, object_id: selected_userID}),
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

$('th.select-checkbox').click(function(){
  if ($("th.select-checkbox").hasClass("selected")) {
      $('tbody tr').removeClass("selected");
      $("th.select-checkbox").removeClass("selected");
    } else {
      $('tbody tr').addClass("selected");
      $("th.select-checkbox").addClass("selected");
    }
});

$('#object_id').focus(function(){
  $("#userListModal").modal("show");
  userTable.draw();
});

$('#userListModal #confirm').click(function(){
  selected_userID = [];
  $('#userList tbody tr.selected').each(function(){
    selected_userID.push($(this).children().eq(1).text());
  });
  $('#userList tr.selected').removeClass('selected');
  if(selected_userID.length > 0)
    $('#object_id').val(selected_userID[0]+'...');
  $('#userListModal').modal('hide');
});

function newTask(task) {
  var task_row = '<tr><td style="display: none;"></td><td>'+task._id+'</td><td>'+task.applicant_id+'</td><td>'+task.object_id+'</td><td>'+task.task_type.type+'</td><td>'+task.content+'</td><td>';

  if(task.urgency == 'critical') task_row += '<span class="badge bg-red">Critical</span>';
  else if(task.urgency == 'normal') task_row += '<span class="badge bg-yellow">Normal</span>';
  else task_row += '<span class="badge bg-green">Low</span>';

  task_row += '</td><td>'+moment(task.createdAt).format('YYYY/MM/DD HH:mm:ss') +'</td><td>'+ task.done +'</td></tr>';
  taskTable.rows.add($(task_row)).draw();
}
