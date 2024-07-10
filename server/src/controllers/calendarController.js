const knex = require('../config/db');
const moment = require('moment-timezone');

// Get all events for a user
exports.getEvents = async (req, res) => {
  const { userId } = req.params;
  try {
    const events = await knex('events').where({ user_id: userId });
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
};

// Add a new event
exports.addEvent = async (req, res) => {
  const { userId } = req.params;
  const { title, start, end, timezone } = req.body; 
  try {
    const formattedStart = moment.tz(start, timezone).format('YYYY-MM-DD HH:mm:ss');
    const formattedEnd = moment.tz(end, timezone).format('YYYY-MM-DD HH:mm:ss');

    const [eventId] = await knex('events').insert({
      user_id: userId,
      title,
      start: formattedStart,
      end: formattedEnd,
    });
    res.status(201).json({ eventId, title, start: formattedStart, end: formattedEnd });
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ message: 'Error adding event' });
  }
};

// Update an existing event
exports.updateEvent = async (req, res) => {
  const { userId, eventId } = req.params;
  const { title, start, end, timezone } = req.body; 
  try {
    const formattedStart = moment.tz(start, timezone).format('YYYY-MM-DD HH:mm:ss');
    const formattedEnd = moment.tz(end, timezone).format('YYYY-MM-DD HH:mm:ss');

    await knex('events')
      .where({ id: eventId, user_id: userId })
      .update({ title, start: formattedStart, end: formattedEnd });
    res.status(200).json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Error updating event' });
  }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
  const { userId, eventId } = req.params;
  try {
    await knex('events')
      .where({ id: eventId, user_id: userId })
      .del();
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Error deleting event' });
  }
};