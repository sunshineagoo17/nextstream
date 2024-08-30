const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const guestAuthenticate = require('../middleware/guestAuthenticate');
const calendarController = require('../controllers/calendarController');

// Get all events for a user - accessible to both authenticated users and guests
router.get('/:userId/events', (req, res, next) => {
    const token = req.cookies.token || req.cookies.guestToken;
  
    if (token) {
      if (req.cookies.token) {
        authenticate(req, res, next);
      } else if (req.cookies.guestToken) {
        guestAuthenticate(req, res, next);
      }
    } else {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
  }, calendarController.getEvents);

// Search events for a user
router.get('/:userId/events/search', authenticate, calendarController.searchEvents); 

// Add a new event
router.post('/:userId/events', authenticate, calendarController.addEvent);

// Update an existing event
router.put('/:userId/events/:eventId', authenticate, calendarController.updateEvent);

// Delete an event
router.delete('/:userId/events/:eventId', authenticate, calendarController.deleteEvent);

module.exports = router;