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

// Share an event with multiple friends
router.post('/:userId/events/:eventId/share', authenticate, calendarController.shareEventWithFriends);

// Accept or decline a shared event
router.put('/:userId/shared-events/:calendarEventId/respond', authenticate, calendarController.respondToSharedEvent);

// Get pending calendar invites for a user
router.get('/pending-invites', authenticate, calendarController.getPendingCalendarInvites);

// Get the list of friends with whom an event has already been shared
router.get('/:userId/events/:eventId/shared', authenticate, calendarController.getSharedFriendsForEvent);

module.exports = router;