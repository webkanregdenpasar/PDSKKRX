// Basic FullCalendar Example
document.addEventListener('DOMContentLoaded', function() {
  var calendarEl = document.getElementById('calendar');
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    editable: true, // Allow event drag/drop
    selectable: true, // Allow selecting days to add events
    events: [
      // Start with some sample events
      { title: 'Sample Event', start: '2025-06-28' }
    ],
    select: function(info) {
      const title = prompt('Event Title:');
      if (title) {
        calendar.addEvent({
          title,
          start: info.startStr,
          end: info.endStr,
          allDay: info.allDay
        });
      }
      calendar.unselect();
    },
    eventClick: function(info) {
      if (confirm('Remove this event?')) {
        info.event.remove();
      }
    }
  });
  calendar.render();
});
