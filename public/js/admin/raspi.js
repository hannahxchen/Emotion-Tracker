var select = false;

$(document).ready(function(){

  var raspiLogTable = $('#logList').DataTable({
    "paging": false,
    "scrollY": "200px",
    "scrollCollapse": true,
    'searching'   : true,
    'ordering'    : true,
    'info'        : false,
    'autoWidth'   : true,
    'responsive'  : {
      details: {
        type: 'column'
      }
    },
    'columnDefs': [ {
      'orderable': false,
      'className': 'select-checkbox',
      'targets':   0
    } ],
    'order': [[ 5, 'asc' ]],
    'fnInitComplete': function (oSettings) {
      $('.dataTables_scrollBody').slimScroll({
        height: '200px',
        alwaysVisible: true
      });
    }
  });

  var SensorDataTable = $('#sensorDataList').DataTable({
    "paging": false,
    "scrollY": "200px",
    "scrollCollapse": true,
    'searching'   : true,
    'ordering'    : true,
    'info'        : false,
    'autoWidth'   : true,
    'responsive'  : {
      details: {
        type: 'column'
      }
    },
    'columnDefs': [ {
      'orderable': false,
      'className': 'select-checkbox',
      'targets':   0
    } ],
    'order': [[ 8, 'asc' ]],
    'fnInitComplete': function (oSettings) {
      $('.dataTables_scrollBody').slimScroll({
        height: '200px',
        alwaysVisible: true
      });
    }
  });

  $('thead th:first-child, tbody td:first-child').hide();
  raspiLogTable.draw();
  sensorDataTable.draw();

  $('th.select-checkbox').click(function(){
    if ($("th.select-checkbox").hasClass("selected")) {
        $('tbody tr').removeClass("selected");
        $("th.select-checkbox").removeClass("selected");
      } else {
        $('tbody tr').addClass("selected");
        $("th.select-checkbox").addClass("selected");
      }
  });

  $('#log-area #select').click(function(){
    $(this).hide();
    $('#log-area #delete').show();
    $('#log-area #cancel').show();
    $('table#logList tbody tr').css('cursor', 'default');
    $('#log-area .select-checkbox').show();

    select = true;
  });

  $('#log-area #cancel').click(function(){
    $('#log-area #select').show();
    $('#log-area #delete').hide();
    $(this).hide();
    $('#log-area .select-checkbox').hide();
    $('table#logList tbody tr').css('cursor', 'pointer');
    $('table#logList tbody tr').each(function(){
      if($(this).hasClass('selected')){
        $(this).removeClass('selected');
      }
    });

    $('#log-area th.select-checkbox').each(function(){
      if($(this).hasClass('selected')){
        $(this).removeClass('selected');
      }
    })

    select = false;
  });

  $('#log-area #delete').click(function(e){
    var selected = [];
    $('#logList body tr').each(function(){
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

  $('#deleteLogModal #confirm').click(function(){

    var selected = [];
    var error = false;
    $('#logList tbody tr').each(function(){
      if($(this).hasClass('selected')){
        selected.push($(this).children().eq(1).text());
      }
    });

    $.ajax({
      url: '/admin/raspi/deleteLogs',
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
          raspiLogTable.rows('.selected').remove().draw();
        }
      }
    });

    $('#deleteLogModal').modal('hide');
    $('#log-area .select-checkbox').hide();
    $('table#logList tbody tr').css('cursor', 'pointer');
    select = false;

    $('#log-area #select').show();
    $('#log-area #delete').hide();
    $('#log-area #cancel').hide();

    $('#log-area th.select-checkbox').each(function(){
      if($(this).hasClass('selected')){
        $(this).removeClass('selected');
      }
    })
  });

  $('#sensorData-area #select').click(function(){
    $(this).hide();
    $('#sensorData-area #delete').show();
    $('#sensorData-area #cancel').show();
    $('table#sensorDataList tbody tr').css('cursor', 'default');
    $('#sensorData-area .select-checkbox').show();

    select = true;
  });

  $('#sensorData-area #cancel').click(function(){
    $('#sensorData-area #select').show();
    $('#sensorData-area #delete').hide();
    $(this).hide();
    $('#sensorData-area .select-checkbox').hide();
    $('table#sensorDataList tbody tr').css('cursor', 'pointer');
    $('table#sensorDataList tbody tr').each(function(){
      if($(this).hasClass('selected')){
        $(this).removeClass('selected');
      }
    });

    $('#sensorData-area th.select-checkbox').each(function(){
      if($(this).hasClass('selected')){
        $(this).removeClass('selected');
      }
    })

    select = false;
  });

  $('#sensorData-area #delete').click(function(e){
    var selected = [];
    $('#sensorDataList body tr').each(function(){
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

  $('#deleteDataModal #confirm').click(function(){

    var selected = [];
    var error = false;
    $('#sensorDataList tbody tr').each(function(){
      if($(this).hasClass('selected')){
        selected.push($(this).children().eq(1).text());
      }
    });

    $.ajax({
      url: '/admin/raspi/deleteSensorData',
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
          sensorDataTable.rows('.selected').remove().draw();
        }
      }
    });

    $('#deleteDataModal').modal('hide');
    $('#sensorData-area .select-checkbox').hide();
    $('table#sensorDataList tbody tr').css('cursor', 'pointer');
    select = false;

    $('#sensorData-area #select').show();
    $('#sensorData-area #delete').hide();
    $('#sensorData-area #cancel').hide();

    $('#sensorData-area th.select-checkbox').each(function(){
      if($(this).hasClass('selected')){
        $(this).removeClass('selected');
      }
    })
  });

  $('.btn-group li').click(function(){
    $('.content .alert-danger').hide();
    $('.content .alert-success').hide();
    $('.content .alert-warning').hide();
  });
});
