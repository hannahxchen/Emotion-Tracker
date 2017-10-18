var today = new Date();

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
  events: [
    {
      title: 'All Day Event',
      start: '2017-10-03'
    },
    {
      title: 'Two Day Event',
      start: '2017-10-15T08:00:00',
      end: '2017-10-16T17:00:00'
    }
  ],
  eventRender: function(event, element){

  }
});

$('.fc-event').click(function(){

});
