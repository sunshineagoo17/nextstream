const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const calendarController = require('../controllers/calendarController');

// Get all events for a user
router.get('/:userId/events', authenticate, calendarController.getEvents);

// Search events for a user
router.get('/:userId/events/search', authenticate, calendarController.searchEvents); 

// Add a new event
router.post('/:userId/events', authenticate, calendarController.addEvent);

// Update an existing event
router.put('/:userId/events/:eventId', authenticate, calendarController.updateEvent);

// Delete an event
router.delete('/:userId/events/:eventId', authenticate, calendarController.deleteEvent);

module.exports = router;
