const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate'); 
const knex = require('../config/db');

// Get all events for a user
router.get('/:userId/events', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const events = await knex('events').where({ user_id: userId });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// Add a new event
router.post('/:userId/events', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { title, start, end } = req.body;
    const [eventId] = await knex('events').insert({
      user_id: userId,
      title,
      start,
      end,
    });
    res.status(201).json({ eventId, title, start, end });
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ message: 'Error adding event' });
  }
});

// Update an event
router.put('/:userId/events/:eventId', authenticate, async (req, res) => {
  try {
    const { userId, eventId } = req.params;
    const { title, start, end } = req.body;
    await knex('events')
      .where({ id: eventId, user_id: userId })
      .update({ title, start, end });
    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Error updating event' });
  }
});

// Delete an event
router.delete('/:userId/events/:eventId', authenticate, async (req, res) => {
  try {
    const { userId, eventId } = req.params;
    await knex('events')
      .where({ id: eventId, user_id: userId })
      .del();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Error deleting event' });
  }
});

module.exports = router;
