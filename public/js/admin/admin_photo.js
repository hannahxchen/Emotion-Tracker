var album_id = $('.content-header small').text();
var data;
var img_list;
var index;

$(document).ready(function(){
  $('#image-list .box-body').slimScroll({
    height: '350px',
    railVisible: true,
    alwaysVisible: true
  });

  var imgDataTable = $('#img-data-table').DataTable({
    'paging'      : false,
    "scrollY": "300px",
    "scrollCollapse": true,
    "sScrollX": '100%',
    'searching'   : false,
    'ordering'    : false,
    'info'        : false,
    'autoWidth'   : true,
    'fnInitComplete': function (oSettings) {
      $('.dataTables_scrollBody').slimScroll({
        height: '300px',
        railVisible: true,
        alwaysVisible: true
      });
    }
  });

  var userTable = $('#userList').DataTable({
//    "scroller":       true,
    'paging'      : false,
    "scrollY": "200px",
    "scrollCollapse": true,
    "sScrollX": '100%',
    'searching'   : true,
    'ordering'    : true,
    'info'        : false,
    'autoWidth'   : true,
    'order': [[ 4, 'asc' ]],
    'fnInitComplete': function (oSettings) {
      $('.dataTables_scrollBody').slimScroll({
        height: '200px',
        railVisible: true,
        alwaysVisible: true
      });
    }
  });

  $('canvas').attr("width",$(window).width());
  $('canvas').attr("height",$(window).height());

  $('#photo-carousel').carousel({wrap: true});
  $('.carousel .item').eq(0).addClass('active');

  $.ajax({
    url: '/admin/album/getImgs/'+album_id,
    type: 'GET',
    contentType: "application/json; charset=utf-8",
    success: function(result) {
      if(!result.error){
        img_list = result.image_list;
        data = result.profile;
        if(result.image_list.length > 0){
          result.image_list.forEach(function(img, i){
            var imgData = $.grep(result.profile, function(obj){return obj.image_id === img.imageID;})[0];
            var active = $('#'+img.imageID);
            var c = document.getElementsByTagName('canvas')[i];
            var ctx = c.getContext('2d');
            canvas = ctx.canvas;
            ctx.font = "25px Arial";
            ctx.strokeStyle="#ffff00";
            ctx.lineWidth = 3;
            ctx.fillStyle = '#ffff00';
            var image = new Image();
            image.src = img.path;
            var scaleX = canvas.width / image.width;
            var scaleY = canvas.height / image.height;
            var ratio  = Math.min ( scaleX, scaleY );
            var centerShift_x = ( canvas.width - image.width*ratio ) / 2;
            var centerShift_y = ( canvas.height - image.height*ratio ) / 2;

            image.onload = function(){
              ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, image.width*ratio, image.height*ratio);
              if(img.people){
                img.people.forEach(function(person){
                  ctx.strokeRect(person.position.x*ratio,  person.position.y*ratio, person.faceScale.width*ratio, person.faceScale.height*ratio);
                  if(person.user_id != 'unknown'){
                    var userData = $.grep(imgData.userData, function(obj){return obj.user_id === person.user_id;})[0];
                    if(!person.index) person.index = 0;
                    if(!userData)
                      console.log(img);
                    ctx.fillText('#' + (person.index+1), person.position.x*ratio, person.position.y*ratio -5);
                  }
                  else{
                    if(!person.index) person.index = 0;
                    ctx.fillText('#' + (person.index+1), person.position.x*ratio, person.position.y*ratio -5);
                  }
                });
              }
              active.find('canvas').css('height', '350px');
              active.find('.loading').hide();
              active.find('canvas').show();
              $("#photo-carousel").carousel(1);
            }
          });
        }

      }
    }
  });

  $('#photo-carousel').on('slid.bs.carousel', function (event) {

    var active = $('.carousel-inner > .item.active');
    var img_id = active.attr('id');
    imgDataTable.clear().draw();
    var imgData = $.grep(data, function(obj){return obj.image_id === img_id;})[0];
    var list = $.grep(img_list, function(obj){return obj.imageID === img_id;})[0];
    if(list.people.length > 0){
      list.people.forEach(function(person){
        if(person.user_id != 'unknown'){
          var userData = $.grep(imgData.userData, function(obj){return obj.user_id === person.user_id;})[0];
          if(!person.index) person.index = 0;
          var toolbox = '<td><i class="fa fa-pencil hover-change" aria-hidden="true" style="cursor: pointer;"></i><i class="fa fa-address-book-o hover-change" style="margin-left: 10px; cursor: pointer;" aria-hidden="true"></i></tr>';
          var item = '<tr><td>'+(person.index+1)+'</td><td>'+person.user_id+'</td><td>'+userData.name+'</td><td>'+userData.role+'</td>';
          item += toolbox;
          imgDataTable.row.add($(item)).draw();

        }
        else{
          if(!person.index) person.index = 0;
          var toolbox = '<td><i class="fa fa-pencil hover-change" aria-hidden="true" style="cursor: pointer;"></i></tr>';
          var item = '<tr><td>'+(person.index+1)+'</td><td>unknown</td><td>unknown</td><td></td>';
          item += toolbox;
          imgDataTable.row.add($(item)).draw();
        }
      });
    }
    else{
      var item = '<tr><td colspan=4 style="text-align: center;">No face detected</td></tr>';
      imgDataTable.row.add($(item)).draw();
    }

    initClick();
    clearTable();
    $('.content .alert-danger').hide();
    $('.content .alert-success').hide();

  });

  $('.tz-gallery a').click(function(){
    $('#photo-carousel').carousel('pause');
    $(this).parent().addClass('selected');
  });

  function initClick(){
    $('.fa-address-book-o').on('click', function(){
      var select = $(this).parent().parent();
      if(!select.hasClass('selected')){
        $('#img-data tbody tr').removeClass('selected');
        var user_id = select.children().eq(1).text();
        if(user_id != 'unknown'){
          select.addClass('selected');
          socket.emit('get-selected-user', user_id);
        }
        else clearTable();
      }
    });

    $('.fa-pencil').on('click', function(){
      $('#photo-carousel').carousel('pause');
      var row = $(this).parent().parent();
      index = row.children().eq(0).text()-1;
      selectUser(row.children().eq(1).text());
      $('#userModal').modal('show');
    });
  }

  function selectUser(user_id){
    if(user_id != 'unknown'){
      $('#userModal tr#' + user_id).addClass('selected');
      //var index = userTable.row(('#userModal tr#' + user_id)).index();
      //userTable.row(index).scrollTo();
      $('#userModal img').attr('src', window.location.origin+'/avatar/' + $('#userModal tr.selected').children().eq(0).text()+'.jpg');
    }
  }

  function clearTable(){
    $('#selected-user img').attr('src', '');
    $('#selected-user .profile-userid').html('');
    $('#selected-user .profile-username-plain').html('');
    $('#selected-user .profile-name').html('');
    $('#selected-user .profile-gender').html('');
    $('#selected-user .profile-birth').html('');
      $('#selected-user .profile-registered-time').html('');
  }

  socket.on('send-selected-user', function(user){
    $('#selected-user img').attr('src', '/avatar/'+user.profile_picture_id+'.jpg');
    $('#selected-user .profile-userid').text(user.userID);
    $('#selected-user .profile-username-plain').text(user.username);
    $('#selected-user .profile-name').text(user.name);
    $('#selected-user .profile-gender').text(user.gender);
    $('#selected-user .profile-birth').text(moment.utc(user.birth).local().format('YYYY/MM/DD'));
    $('#selected-user .profile-registered-time').text(moment.utc(user.createdAt).local().format('YYYY/MM/DD HH:mm:ss'));
  });

  $('#userList tbody tr').click(function(){
    if(!$(this).hasClass('selected')){
      $('#userList tbody tr').removeClass('selected');
      $(this).addClass('selected');
      $('#userModal img').attr('src', window.location.origin+'/avatar/'+$(this).children().eq(0).text()+'.jpg');
    }
  });

  $('#userModal').on('shown.bs.modal', function(){
    userTable.draw();
  });
  $('#userModal').on('hidden.bs.modal', function(){
    $('#userModal img').attr('src', '');
    $('#userList tbody tr').removeClass('selected');
  });

  $('.fa').on('click', function(){
    $('.content .alert-danger').hide();
    $('.content .alert-success').hide();
  });

  $('#userModal button#confirm').on('click', function(){
    var user_id = $('#userList tbody tr.selected').children().eq(1).text();
    if(user_id == '') user_id = 'unknown';
    console.log(user_id);
    var img_id = $('.carousel-inner > .item.active').attr('id');
    $.ajax({
      url: '/admin/album/updateImg/'+img_id,
      type: 'POST',
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify({userID: user_id, index: index}),
      success: function(result) {
        if(result.error){
          $('.content .alert-danger').show();
        }
        else{
          $('.content .alert-success').show();
          $('.carousel-inner #' + result.updated.imageID).find('.loading').show();
          updateImage(result.updated);

          var row = $('#img-data tbody').children().eq(index);
          var profile = $.grep(result.userData, function(obj){return obj.user_id === user_id;})[0];
          if(user_id != 'unknown'){
            row.children().eq(1).text(user_id);
            row.children().eq(2).text(profile.name);
            row.children().eq(3).text(profile.role);
            var toolbox = '<i class="fa fa-pencil hover-change" aria-hidden="true" style="cursor: pointer;"></i><i class="fa fa-address-book-o hover-change" style="margin-left: 10px; cursor: pointer;" aria-hidden="true"></i>';
            row.children().eq(4).html(toolbox);
          }
          else{
            row.children().eq(1).text('unknown');
            row.children().eq(2).text('unknown');
            row.children().eq(3).text('');
            var toolbox = '<i class="fa fa-pencil hover-change" aria-hidden="true" style="cursor: pointer;"></i>';
            row.children().eq(4).html(toolbox);
          }

          updateImgData();
          initClick()
        }
      }
    });
    $('#userModal').modal('hide');

  });

  function updateImage(img){

    var index = $('.carousel-inner #'+img.imageID).index();
    var c = document.getElementsByTagName('canvas')[index];
    $(c).hide();
    $(c).attr("width",$(window).width());
    $(c).attr("height",$(window).height());
    var ctx = c.getContext('2d');
    canvas = ctx.canvas;
    ctx.font = "25px Arial";
    ctx.strokeStyle="#ffff00";
    ctx.lineWidth = 3;
    ctx.fillStyle = '#ffff00';
    var image = new Image();
    image.src = img.path;
    var scaleX = canvas.width / image.width;
    var scaleY = canvas.height / image.height;
    var ratio  = Math.min ( scaleX, scaleY );
    var centerShift_x = ( canvas.width - image.width*ratio ) / 2;
    var centerShift_y = ( canvas.height - image.height*ratio ) / 2;

    image.onload = function(){
      ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, image.width*ratio, image.height*ratio);
      if(img.people){
        img.people.forEach(function(person){
          ctx.strokeRect(person.position.x*ratio,  person.position.y*ratio, person.faceScale.width*ratio, person.faceScale.height*ratio);
          if(person.user_id != 'unknown'){
            if(!person.index) person.index = 0;
            ctx.fillText('#' + (person.index+1), person.position.x*ratio, person.position.y*ratio -5);
          }
          else{
            if(!person.index) person.index = 0;
            ctx.fillText('#' + (person.index+1), person.position.x*ratio, person.position.y*ratio -5);
          }
        });
      }
    }
    $('.carousel-inner #'+img.imageID).find('canvas').css('height', '350px');
    $('.carousel-inner #'+img.imageID).find('.loading').hide();
    $('.carousel-inner #'+img.imageID).find('canvas').show();
  }

  function updateImgData(){
    $.ajax({
      url: '/admin/album/getImgs/'+album_id,
      type: 'GET',
      contentType: "application/json; charset=utf-8",
      success: function(result) {
        if(!result.error){
          img_list = result.image_list;
          data = result.profile;
        }
      }
    });
  }

  $('#removeSelect').click(function(){
    $('#userList tr').removeClass('selected');
    $('#userModal img').attr('src', '');
  });

});
