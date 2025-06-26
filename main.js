document.addEventListener('DOMContentLoaded', function() {
    // --- DOM Elements ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const calendarEl = document.getElementById('calendar');
    const addEventButton = document.getElementById('add-event-btn');

    const eventModalOverlay = document.getElementById('event-modal-overlay');
    const eventModalTitle = document.getElementById('event-modal-title');
    const eventForm = document.getElementById('event-form');
    const eventIdInput = document.getElementById('event-id');
    const eventTitleInput = document.getElementById('event-title');
    const eventDescriptionInput = document.getElementById('event-description');
    const eventDateInput = document.getElementById('event-date');

    const notificationTickerContent = document.getElementById('notification-ticker-content');

    const genericModalOverlay = document.getElementById('generic-modal-overlay');
    const genericModalTitle = document.getElementById('generic-modal-title');
    const genericModalMessage = document.getElementById('generic-modal-message');
    const genericModalCancelButton = document.getElementById('generic-modal-cancel');
    const genericModalOkButton = document.getElementById('generic-modal-ok');

    // --- Data Stores (using localStorage for persistence) ---
    let calendarEvents = JSON.parse(localStorage.getItem('dashboardCalendarEvents')) || [];
    let notifications = JSON.parse(localStorage.getItem('dashboardNotifications')) || [
        { id: 'notif1', message: 'Welcome to the new Department Dashboard!', date: '2025-06-26' },
        { id: 'notif2', message: 'Upcoming system maintenance on July 5th. Expect brief downtime.', date: '2025-06-25' },
        { id: 'notif3', message: 'Remember to submit your quarterly reports by end of day Friday.', date: '2025-06-24' }
    ];

    // --- FullCalendar Initialization ---
    let calendar; // Declare calendar globally for access in other functions

    function initializeCalendar() {
        console.log("Initializing calendar...");
        if (calendar) { // Destroy existing calendar instance if it exists
            calendar.destroy();
            console.log("Existing calendar destroyed.");
        }
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            editable: true, // Allow events to be dragged and resized
            selectable: true, // Allow users to select dates
            events: calendarEvents, // Load events from our array

            // Handle date selection to add new event
            select: function(info) {
                console.log("Date selected:", info.startStr);
                // Pre-fill event date with selected date
                eventDateInput.value = info.startStr;
                openEventModal();
                calendar.unselect(); // Deselect the date range
            },

            // Handle clicking an existing event to edit/delete
            eventClick: function(info) {
                console.log("Event clicked:", info.event.id);
                const eventId = info.event.id;
                const eventToEdit = calendarEvents.find(e => e.id === eventId);
                if (eventToEdit) {
                    openEventModal(eventToEdit);
                }
            },

            // Handle event drop (drag-and-drop an event to a new date/time)
            eventDrop: function(info) {
                console.log("Event dropped:", info.event.id, "New start:", info.event.start);
                showConfirm('Move event to ' + info.event.start.toLocaleDateString() + '?', (confirmed) => {
                    if (confirmed) {
                        const updatedEvent = {
                            id: info.event.id,
                            title: info.event.title,
                            description: info.event.extendedProps.description,
                            start: info.event.start.toISOString().split('T')[0] // Use 'start' for consistency with FullCalendar event object
                        };
                        updateCalendarEvent(updatedEvent);
                        showAlert('Event updated!', 'Success');
                    } else {
                        info.revert(); // Revert the change if not confirmed
                        showAlert('Event move cancelled.', 'Cancelled');
                    }
                }, 'Confirm Event Move');
            },

            // Handle event resize (resizing the duration of an event)
            eventResize: function(info) {
                 console.log("Event resized:", info.event.id);
                 showConfirm('Resize event duration?', (confirmed) => {
                    if (confirmed) {
                        const updatedEvent = {
                            id: info.event.id,
                            title: info.event.title,
                            description: info.event.extendedProps.description,
                            start: info.event.start.toISOString().split('T')[0] // Use 'start' for consistency
                            // FullCalendar handles end date implicitly for event objects
                        };
                        updateCalendarEvent(updatedEvent); // Re-save the event to local storage
                        showAlert('Event duration updated!', 'Success');
                    } else {
                        info.revert(); // Revert the change if not confirmed
                        showAlert('Event resize cancelled.', 'Cancelled');
                    }
                }, 'Confirm Event Resize');
            }
        });
        calendar.render();
        console.log("Calendar rendered.");
    }

    // --- Modal Functions (reusable for alerts/confirms) ---
    function showAlert(message, title = 'Notifikasi') {
        genericModalTitle.textContent = message; // Use message for title if title isn't provided
        genericModalMessage.textContent = message;
        genericModalCancelButton.classList.add('hidden'); // Hide cancel button for alerts
        genericModalOkButton.onclick = () => genericModalOverlay.classList.add('hidden');
        genericModalOverlay.classList.remove('hidden');
        console.log("Alert shown:", title, message);
    }

    function showConfirm(message, onConfirm, title = 'Konfirmasi') {
        genericModalTitle.textContent = title;
        genericModalMessage.textContent = message;
        genericModalCancelButton.classList.remove('hidden'); // Show cancel button for confirms

        genericModalOkButton.onclick = () => {
            genericModalOverlay.classList.add('hidden');
            onConfirm(true);
        };
        genericModalCancelButton.onclick = () => {
            genericModalOverlay.classList.add('hidden');
            onConfirm(false);
        };
        genericModalOverlay.classList.remove('hidden');
        console.log("Confirm shown:", title, message);
    }

    // --- Tab Switching Logic ---
    function showTab(tabName) {
        console.log("Showing tab:", tabName);
        tabContents.forEach(content => {
            content.classList.add('hidden');
        });
        tabButtons.forEach(button => {
            button.classList.remove('text-blue-600', 'border-blue-600');
            button.classList.add('text-gray-600', 'border-transparent');
        });

        document.getElementById(`${tabName}-content`).classList.remove('hidden');
        document.querySelector(`.tab-button[data-tab="${tabName}"]`).classList.add('text-blue-600', 'border-blue-600');

        // Re-render calendar when its tab is shown to ensure it's correctly sized
        if (tabName === 'calendar') {
            calendar.render();
            console.log("Calendar re-rendered due to tab switch.");
        }
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            showTab(tabName);
        });
    });

    // --- Calendar CRUD Operations ---
    function openEventModal(event = null) {
        console.log("Opening event modal. Event object:", event);
        eventForm.reset();
        eventIdInput.value = '';
        eventModalTitle.textContent = 'Add Event';

        if (event) { // If editing an existing event
            eventModalTitle.textContent = 'Edit Event';
            eventIdInput.value = event.id;
            eventTitleInput.value = event.title;
            eventDescriptionInput.value = event.extendedProps.description || '';
            eventDateInput.value = event.start ? event.start.toISOString().split('T')[0] : '';
        } else { // If adding a new event
            // Pre-fill date with today's date if not already set by FullCalendar's select callback
            if (!eventDateInput.value) {
                const today = new Date();
                eventDateInput.value = today.toISOString().split('T')[0];
            }
        }
        eventModalOverlay.classList.remove('hidden');
    }

    function closeEventModal() {
        console.log("Closing event modal.");
        eventModalOverlay.classList.add('hidden');
    }

    eventForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent default form submission
        console.log("Event form submitted.");
        const id = eventIdInput.value || 'evt' + Date.now(); // Generate ID if new
        const title = eventTitleInput.value.trim();
        const description = eventDescriptionInput.value.trim();
        const date = eventDateInput.value;

        if (!title || !date) {
            showAlert('Event title and date are required.', 'Input Error');
            console.warn("Event title or date missing.");
            return;
        }

        const newEvent = {
            id: id,
            title: title,
            start: date, // FullCalendar uses 'start' for date
            extendedProps: { // Custom properties
                description: description
            }
        };

        if (eventIdInput.value) { // Editing existing event
            console.log("Editing existing event:", newEvent.id);
            const existingEvent = calendar.getEventById(id);
            if (existingEvent) {
                existingEvent.setProp('title', newEvent.title);
                existingEvent.setStart(newEvent.start);
                existingEvent.setExtendedProp('description', newEvent.extendedProps.description);
                updateCalendarEvent(newEvent); // Update localStorage after FullCalendar update
                showAlert('Event updated successfully!', 'Success');
            } else {
                console.error("Existing event not found in FullCalendar to update:", id);
                showAlert("Could not find event in calendar to update.", "Error");
            }
        } else { // Adding new event
            console.log("Adding new event:", newEvent.id);
            calendar.addEvent(newEvent); // Add to FullCalendar
            saveCalendarEvent(newEvent); // Save to localStorage
            showAlert('Event added successfully!', 'Success');
        }
        closeEventModal();
    });

    // Helper to save a single event to localStorage
    function saveCalendarEvent(eventObj) {
        console.log("Saving event to localStorage:", eventObj);
        // Ensure the event object is in a simple format suitable for storage
        const simpleEvent = {
            id: eventObj.id,
            title: eventObj.title,
            start: eventObj.start,
            extendedProps: eventObj.extendedProps
        };
        calendarEvents.push(simpleEvent);
        localStorage.setItem('dashboardCalendarEvents', JSON.stringify(calendarEvents));
    }

    // Helper to update a single event in localStorage
    function updateCalendarEvent(updatedEvent) {
        console.log("Updating event in localStorage:", updatedEvent);
        const index = calendarEvents.findIndex(e => e.id === updatedEvent.id);
        if (index > -1) {
            // Ensure consistency in stored format after update
            calendarEvents[index] = {
                id: updatedEvent.id,
                title: updatedEvent.title,
                start: updatedEvent.start,
                extendedProps: updatedEvent.extendedProps
            };
            localStorage.setItem('dashboardCalendarEvents', JSON.stringify(calendarEvents));
        } else {
            console.error("Event not found in local storage for update:", updatedEvent);
            showAlert("Could not find event in local storage to update.", "Error");
        }
    }

    window.deleteCalendarEvent = function(eventId) {
        console.log("Attempting to delete event:", eventId);
        showConfirm('Are you sure you want to delete this event?', (confirmed) => {
            if (confirmed) {
                const eventToRemove = calendar.getEventById(eventId);
                if (eventToRemove) {
                    eventToRemove.remove(); // Remove from FullCalendar
                    calendarEvents = calendarEvents.filter(e => e.id !== eventId); // Remove from our array
                    localStorage.setItem('dashboardCalendarEvents', JSON.stringify(calendarEvents)); // Update localStorage
                    showAlert('Event deleted!', 'Success');
                    console.log("Event deleted successfully:", eventId);
                } else {
                    console.error("Event not found in FullCalendar to delete:", eventId);
                    showAlert("Could not find event to delete in calendar.", "Error");
                }
            } else {
                showAlert('Event deletion cancelled.', 'Cancelled');
                console.log("Event deletion cancelled by user.");
            }
        }, 'Confirm Deletion');
    };

    // Make functions globally accessible for HTML onclicks (e.g., from modal close button)
    window.openEventModal = openEventModal;
    window.closeEventModal = closeEventModal;
    // Note: deleteCalendarEvent is already window.deleteCalendarEvent

    addEventButton.addEventListener('click', () => {
        console.log("Add New Event button clicked.");
        openEventModal();
    });

    // --- Notification Ticker Logic ---
    function renderNotificationTicker() {
        console.log("Rendering notification ticker.");
        notificationTickerContent.innerHTML = '';
        if (notifications.length === 0) {
            notificationTickerContent.innerHTML = '<span class="ticker-item">No new notifications.</span>';
            // Disable animation if no items or very few items (to prevent awkward looping)
            notificationTickerContent.style.animationPlayState = 'paused';
            console.log("No notifications, ticker animation paused.");
            return;
        }

        // Create enough duplicates for continuous scroll effect
        const tickerItemsHTML = notifications.map(notif =>
            `<span class="ticker-item">${notif.message} (${new Date(notif.date).toLocaleDateString()})</span>`
        ).join('');
        
        // Duplicate content to ensure seamless loop
        notificationTickerContent.innerHTML = tickerItemsHTML + tickerItemsHTML + tickerItemsHTML; 
        
        // Calculate dynamic animation speed based on content length
        // This is a rough estimation, you might need to fine-tune the multiplier
        const contentWidth = notificationTickerContent.scrollWidth;
        const containerWidth = notificationTickerContent.offsetWidth;
        if (contentWidth > containerWidth) {
            const speed = contentWidth / 50; // Adjust 50 for desired speed (lower = faster)
            notificationTickerContent.style.setProperty('--ticker-speed', `${speed}s`);
            notificationTickerContent.style.animationPlayState = 'running';
            console.log(`Ticker animation running with speed: ${speed}s`);
        } else {
             notificationTickerContent.style.animationPlayState = 'paused';
             notificationTickerContent.style.transform = 'translateX(0)'; // Ensure it's not off-screen
             console.log("Content fits, ticker animation paused.");
        }
    }

    // --- Initial Load ---
    showTab('calendar'); // Default tab on load
    initializeCalendar(); // Initialize FullCalendar
    renderNotificationTicker(); // Start the notification ticker
    console.log("Page fully loaded and initialized.");
});
