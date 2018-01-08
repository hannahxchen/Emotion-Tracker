var today = new Date();
var user_id = $('#user_id').text();

var calendar =  $('#calendar').fullCalendar({
  header: {
    left: 'agendaDay,agendaWeek,month',
    center: 'title',
    right: 'prev,next today'
  },
  defaultDate: today.toISOString().substring(0, 10),
  defaultView: 'month',
	navLinks: true,
  editable: true,
  selectable: true,
  eventLimit: true,
  events: '/api/getActivities/'+user_id,
  eventRender: function(event, element){

  }
});

$('.fc-event').click(function(){

});
