const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const guestAuthenticate = require('../middleware/guestAuthenticate');
const calendarController = require('../controllers/calendarController');

// Get all events for an authenticated user
router.get('/:userId/events', authenticate, calendarController.getEvents);

// Get all events for a guest user
router.get('/guest/events', guestAuthenticate, calendarController.getEvents);

// Search events for an authenticated user
router.get('/:userId/events/search', authenticate, calendarController.searchEvents);

// Add a new event for an authenticated user
router.post('/:userId/events', authenticate, calendarController.addEvent);

// Update an existing event for an authenticated user
router.put('/:userId/events/:eventId', authenticate, calendarController.updateEvent);

// Delete an event for an authenticated user
router.delete('/:userId/events/:eventId', authenticate, calendarController.deleteEvent);

module.exports = router;