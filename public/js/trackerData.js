var serverIP = "http://localhost:8000";
var username = null;
var joy = [];

$(document).ready(function(){
  var socket=io.connect();
  socket.emit('push data start',  true);
  socket.on('getUsername', function(username){
    username = username;
    requestData(username);
  })

  $('#clearData').click(function(){
    var form = document.createElement('form');
    form.setAttribute('method', 'post');
    form.setAttribute('action', '/faceDetect/clearData');
    form.style.display = 'hidden';
    document.body.appendChild(form);
    form.submit();
  });

  /*socket.on('push old data', function(data){
    joy = data.joy;
    anger = data.anger;
    fear = data.fear;
    surprise = data.surprise;
    valence = data.valence;
    engagement = data.engagement;
    sadness = data.sadness;
    disgust = data.disgust;
    contempt = data.contempt;
    createdAt = data.createdAt;
  });*/

  function drawChart(data){
    Highcharts.chart('chart', {

      chart: {
        type: 'spline',
        event: {
          load: function(){
            socket.on('push old data', function(data, time){

            });
          }
        }
      },

      title: {
        text: '情緒變化圖'
      },

      subtitle: {
        text: '情緒監測結果'
      },

      xAxis: {
        type: 'datetime',
      },

      yAxis: {
        title: {
          text: '程度'
        }
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle'
      },

      plotOptions: {
        spline: {
          marker: {
            enabled: true
          }
        },
        series: {
          //pointStart:
        }
      },

      series:  [{
        data: data
      }]

    });
  }

  function requestData(username){
    $.ajax({
      url: serverIP + '/api/face/emotion',
      headers: {
        'key':'stegosaur123',
        'Content-Type':'application/json'
      },
      method: 'POST',
      dataType: 'json',
      data: JSON.stringify({username: username}),
      success: function(data){
        console.log(JSON.stringify(data));
        data.data.forEach(function(element){
          var obj = {x: Date.parse(element.createdAt), y: element.emotions[0].joy};
          joy.push(obj);
        });
        drawChart(joy);
      }
    });
  }

});
