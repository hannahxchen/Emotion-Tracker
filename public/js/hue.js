var hueIP;
var userCreated = false;
var username;
var groups;

$.ajax({
    type: "GET",
    url: "/hueLight/searchIP",
    dataType: "json",
    success: function(data){
			if(data.hostIP == 'not found'){
				$('#initialize').fadeOut(400, function(){
					$('#ipArea').fadeIn();
				});
			}
			else{
				$('#initialize').hide();
				hueIP = data.hostIP;
				createUser(hueIP, 'auto');
			}
		},
    failure: function(errMsg) {
        alert(errMsg);
    }
});

$('#search').click(function(){
	hueIP = $('#hueIP').val();
	createUser(hueIP, 'search');
});

function createUser(hueIP, option){
	var count = 10;
	$('#countdown').text('請按下bridge上的按鈕進行配對，倒數：');
  $("#countdownPic").attr("src","/img/countdown.gif");
	$('#countdown').show();
	socket.emit('hueIP', hueIP);
	var counter = setInterval(function(){
		$('#countdown').text('請按下bridge上的按鈕進行配對，倒數：');
		count--;
		socket.emit('hueIP', hueIP);
		if(count == -1 && option == 'search'){
			clearInterval(counter);
			$('#countdown').text('無法配對裝置!');
      $("#countdownPic").attr("src","");
		}
		else if(count == -1 && option == 'auto'){
			clearInterval(counter);
      $("#countdownPic").attr("src","");
			$('#ipArea').fadeIn();
			$('#countdown').hide();
		}
		else if(userCreated){
      username = userCreated;
			clearInterval(counter);
      $("#countdownPic").attr("src","");
      getLights(hueIP, username);
      getGroups(hueIP, username);
      $('#ipArea').add('#countdown').fadeOut(400, function(){
        $('#ip').text(hueIP);
        $('#selectorArea').fadeIn();
      });
		}
	}, 1000);
}

socket.on('userCreated', function(data){
	userCreated = data;
});

function getLights(hueIP, username){
  $.ajax({
      type: "POST",
      url: "/hueLight/getLights",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify({host: hueIP, username: username}),
      success: function(data){
        data.lights.forEach(function(element){
          $('#selectLights').append('<label class="btn btn-default"><input type="checkbox" value='+ element.id +'>'+ element.name +'</label>');
          $('#lamps').append('<button type="button" class="btn btn-default" value='+ element.id +'>' + element.name + '</button>')
        });
  		},
      failure: function(errMsg) {
          alert(errMsg);
      }
  });
}

function getGroups(hueIP, username){
  $.ajax({
      type: "POST",
      url: "/hueLight/getGroups",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify({host: hueIP, username: username}),
      success: function(data){
        groups = data;
        data.groups.forEach(function(element){
          $('#removeGroups').append('<button type="button" class="btn btn-default" style="border-radius:10px;" value='+ element.id +'>' +element.name+'<i class="fa fa-times" aria-hidden="true" style="padding-left: 5px;"></i></button>');
        });
  		},
      failure: function(errMsg) {
          alert(errMsg);
      }
  });
}

$('#switch').click(function(){
	if($('#switch').text() == 'On'){
		$('#switch').text('Off');
	}else{
		$('#switch').text('On');
	}
});

$('#ex1').slider({
	formatter: function(value) {
		$('#brightness').text(value);
		return 'Current value: ' + value;
	}
});

$('#colorselector').colorselector();

var RGBChange = function() {
	$('#RGB').css('background', 'rgb('+r.getValue()+','+g.getValue()+','+b.getValue()+')')
};

var r = $('#R').slider()
		.on('slide', RGBChange)
		.data('slider');
var g = $('#G').slider()
		.on('slide', RGBChange)
		.data('slider');
var b = $('#B').slider()
		.on('slide', RGBChange)
		.data('slider');
