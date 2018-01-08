var select = false;

var raspiTable = $('#raspiList').DataTable({
  "paging": false,
  "scrollY": "200px",
  "scrollCollapse": true,
  'searching'   : false,
  'ordering'    : true,
  'info'        : false,
  'autoWidth'   : true,
  responsive  : {
    details: {
      type: 'column'
    }
  },
  'order': [[ 2, 'asc' ]],
  'fnInitComplete': function (oSettings) {
    $('.dataTables_scrollBody').slimScroll({
      height: '200px',
      alwaysVisible: true
    });
  }
});

$('#newDevice').click(function() {
  var rowHtml = $("#newRow").find("tr")[0].outerHTML;
  raspiTable.row.add($(rowHtml)).draw();
});

$('#raspiList').on('mousedown.edit', 'i.fa.fa-pencil', function(){
  $('.content .alert-success').hide();
  $('.content .alert-danger').hide();
  $('.content .alert-warning').hide();

  var $row = $(this).closest("tr");
  var location = $row.children().eq(1).text();
  $row.children().eq(1).html('<input name="location" type="text" style="width: 100px;" placeholder="some place"></td>');
  $row.find('input').val(location);
  raspiTable.draw();
  $row.find('.fa-pencil').hide();
  $row.find('.fa-floppy-o').show();
  $row.find('.fa-trash-o').show();
});

$('#raspiList').on('mousedown.delete', 'i.fa.fa-trash-o', function(){
  $('.content .alert-success').hide();
  $('.content .alert-danger').hide();
  $('.content .alert-warning').hide();

  var $row = $(this).closest("tr");
  var device_id = $row.children().eq(0).text();
  if(device_id){
    $.ajax({
      url: '/admin/raspi/deleteDevice/' + device_id,
      type: 'POST',
      contentType: "application/json; charset=utf-8",
      success: function(result) {
        if(result.error){
          $('.content .alert-danger').show();
          $('.content .alert-danger').text('刪除失敗');
        }
        else{
          $('.content .alert-success').show();
          $('.content .alert-success').text('刪除成功');
          raspiTable.row($row).remove().draw();
        }
      }
    });
  }
  else raspiTable.row($row).remove().draw();
});

$('#raspiList').on('mousedown.save', "i.fa.fa-floppy-o",function(){
  var $row = $(this).closest("tr");

  var location = $row.find('input').val();
  if(location != ''){
    if($row.children().eq(0).text() == ''){
      $.ajax({
        url: '/admin/raspi/newDevice',
        type: 'POST',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({location: location}),
        success: function(result) {
          if(result.error){
            $('.content .alert-danger').show();
            $('.content .alert-danger').text('新增失敗');
          }
          else{
            $('.content .alert-success').show();
            $('.content .alert-success').text('新增成功');
            $row.children().eq(1).html(location);
            $row.children().eq(0).html(result.device._id);
            raspiTable.draw();
            $row.find('.fa-pencil').show();
            $row.find('.fa-floppy-o').hide();
          }
        }
      });
    }
    else{
      var device_id = $row.children().eq(0).text();
      $.ajax({
        url: '/admin/raspi/updateDevice/'+device_id,
        type: 'POST',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({location: location}),
        success: function(result) {
          if(result.error){
            $('.content .alert-success').show();
            $('.content .alert-danger').text('修改失敗');
          }
          else{
            $('.content .alert-success').show();
            $('.content .alert-success').text('修改成功');
            $row.children().eq(1).html(location);
            raspiTable.draw();
            $row.find('.fa-pencil').show();
            $row.find('.fa-floppy-o').hide();
          }
        }
      });
    }
  }
  else {
    $('.content .alert-warning').show();
    $('.content .alert-warning').text('資料輸入不完全');
  }
});

$('input').focus(function(){
  $('.content .alert-success').hide();
  $('.content .alert-danger').hide();
  $('.content .alert-warning').hide();
});

$('button').click(function(){
  $('.content .alert-success').hide();
  $('.content .alert-danger').hide();
  $('.content .alert-warning').hide();
});
