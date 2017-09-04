$(function(){
  var socket=io.connect();
  var $table = $('#visitor-table > tbody:last-child');
  var $profile = $('#visitor-profile > tbody:last-child');
  var count = 1;
  var selected_id = null;
  var clicked = false;
  var alerted = false;

  socket.on('load visitors', function(visitor){
    for(var i = 0 ; i<visitor.length ; i++){
   		displayVisitors(visitor[i]);
   	}
  });

  function displayVisitors(data){
    var date = moment(data.createdAt).format('YYYY-MM-DD hh:mm:ss a');
    if(data.name){
      $table.append('<tr style="cursor: pointer"> <th>'+count
      +'</th>'+'<th>'+data.username+'</th>'+'<th>'+data.name+'</th>'+'<th>'+date+'</th> </tr>');
    }
    else{
      $table.append('<tr style="cursor: pointer"> <th>'
      +count+'</th>'+'<th>'+data.username+'</th>'+'<th>'+'</th>'+'<th>'+date+'</th> </tr>');
    }
    count++;

    $('#visitor-table tr').click(function(){
      if(clicked) return false;
      else{
        clicked = true;
        $('#hint').hide();
        $('#visitor-profile tbody').empty();
        $('#edit').show();
        selected_id = $(this).find('th:eq(1)').text();
        socket.emit('selected-id', selected_id);
      }
    });
  }

  socket.on('visitor data', function(data){
    $profile.append('<tr><td colspan="2" align="center">'+'<img src="'+data.img_base64
    +'" style="width: 40%"/>'+'</td></tr>');
    $profile.append('<tr><th><strong>UserID</strong></th><th>'+data.username+'</th></tr>');
    if(data.name){
      $profile.append('<tr><th><strong>姓名</strong></th><th>'+data.name+'</th></tr>');
    }
    else{
      $profile.append('<tr><th><strong>姓名</strong></th><th>無</th></tr>');
    }
    $profile.append('<tr><th><strong>性別</strong></th><th>'+data.gender+'</th></tr>');
    $profile.append('<tr><th><strong>年齡</strong></th><th>'+data.age+'</th></tr>');
    $profile.append('<tr><th><strong>身分</strong></th><th>'+data.role+'</th></tr>');
    clicked = false;

    $('#edit').click(function(){
      $('#edit').hide();
      $('#cancel').show();
      $('#save').show();
      clicked = true;
      var visitorName = data.name;
      $('#visitor-profile tbody').find('th:eq(3)').replaceWith($('<th><input type="text" class="form-control">'+'</th>'));
    });

    $('#save').click(function(){
      var newName = $('#visitor-profile tbody input').val();
      if(!newName){
        if(!alerted) alert('請輸入姓名!'); alerted = true;
        return false;
      }
      else{
        $('#cancel').hide();
        $('#save').hide();
        $('#edit').show();
        clicked = false;
        $('#visitor-profile tbody').find('th:eq(3)').replaceWith($('<th>'+newName+'</th>'));
        socket.emit('profile-update', {username: data.username, name: newName});
      }
      alerted = false;
    });

    $('#cancel').click(function(){
      $('#cancel').hide();
      $('#save').hide();
      $('#edit').show();
      clicked = false;
      if(data.name) $('#visitor-profile tbody').find('th:eq(3)').replaceWith($('<th>'+data.name+'</th>'));
      else $('#visitor-profile tbody').find('th:eq(3)').replaceWith($('<th>'+'無'+'</th>'));
    });
  });

  $('#search').click(function(){
    $('#visitor-table tbody').empty();
    var option = $( "#search-reference option:selected" ).text();
    var input = $('#search-input').val();
    socket.emit('search user', {option: option, input: input});
  });
  socket.on('searched user data', function(data){
    if(data.length == 0) $table.append('<tr><td colspan="4" align="center">找不到符合條件的訪客</td></tr>');
    else{
      count = 1;
      for(var i = data.length-1 ; i>=0 ; i--){
     		displayVisitors(data[i]);
     	}
    }
  });
});
