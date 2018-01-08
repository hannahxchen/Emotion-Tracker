var select = false;

var activityTable = $('#activityList').DataTable({
  "scrollY": "300px",
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
      height: '300px',
      alwaysVisible: true
    });
  }
});

$('table#activityList tbody tr').click(function(){
  if(!select) {
    var id = $(this).children().eq(1).text();
    console.log(id);
    window.location.href = window.location + '/' + id;
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

  socket.emit('delete_activity', selected);

  activityTable.rows('.selected').remove().draw();

  $('#deleteModal').modal('hide');
  $('.select-checkbox').hide();
  $('#select').show();
  $('#create').show();
  $('table#activityList tbody tr').css('cursor', 'pointer');
  select = false;

  $('th.select-checkbox').each(function(){
    if($(this).hasClass('selected')){
      $(this).removeClass('selected');
    }
  })
});

$('#select').click(function(){
  select = true;
  $('table#activityList tbody tr').css('cursor', 'default');
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
  $('table#activityList tbody tr').css('cursor', 'pointer');
  $('table#activityList tbody tr').each(function(){
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

$('th.select-checkbox').click(function(){
  if ($("th.select-checkbox").hasClass("selected")) {
      $('tbody tr').removeClass("selected");
      $("th.select-checkbox").removeClass("selected");
    } else {
      $('tbody tr').addClass("selected");
      $("th.select-checkbox").addClass("selected");
    }
});
