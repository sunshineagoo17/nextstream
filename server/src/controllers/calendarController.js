const knex = require('../config/db');
const moment = require('moment-timezone');
const { sendPushNotifications } = require('../services/pushNotificationService');

// Get all events for a user
exports.getEvents = async (req, res) => {
  const { userId } = req.params;
  console.log('Request User ID:', userId);  
  try {
    const events = await knex('events').where({ user_id: userId });
    console.log('Fetched events for User ID:', userId, events);  
    if (events.length === 0) {
      return res.status(404).json({ message: 'No events found for this user' });
    }
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
};

// Search events for a user
exports.searchEvents = async (req, res) => {
  const { userId } = req.params;
  const { query } = req.query;
  try {
    const events = await knex('events')
      .where({ user_id: userId })
      .andWhere('title', 'like', `%${query}%`);
    res.status(200).json(events);
  } catch (error) {
    console.error('Error searching events:', error);
    res.status(500).json({ message: 'Error searching events' });
  }
};

// Add a new event
exports.addEvent = async (req, res) => {
  const { userId } = req.params;
  const { title, start, end, eventType, timezone } = req.body;

  // Validate eventType
  if (!['movie', 'tv', 'unknown'].includes(eventType)) {
    return res.status(400).json({ message: 'Invalid eventType' });
  }

  try {
    const formattedStart = moment.tz(start, timezone).format('YYYY-MM-DD HH:mm:ss');
    const formattedEnd = end ? moment.tz(end, timezone).format('YYYY-MM-DD HH:mm:ss') : null;

    const [eventId] = await knex('events').insert({
      user_id: userId,
      title,
      start: formattedStart,
      end: formattedEnd,
      eventType
    });

    // Fetch the user and the events within the notification time offset
    const user = await knex('users').where({ id: userId }).first();
    const events = await knex('events')
      .where('user_id', userId)
      .andWhere('start', '>=', moment().toISOString())
      .andWhere('start', '<', moment(formattedStart).add(user.notificationTime, 'minutes').toISOString());

    // Send push notifications
    await sendPushNotifications(user, events);

    res.status(201).json({ eventId, title, start: formattedStart, end: formattedEnd, eventType });
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ message: 'Error adding event' });
  }
};

// Update an existing event
exports.updateEvent = async (req, res) => {
  const { userId, eventId } = req.params;
  const { title, start, end, eventType, timezone } = req.body;

  // Validate eventType
  if (eventType && !['movie', 'tv', 'unknown'].includes(eventType)) {
    return res.status(400).json({ message: 'Invalid eventType' });
  }

  try {
    const formattedStart = moment.tz(start, timezone).format('YYYY-MM-DD HH:mm:ss');
    const formattedEnd = end ? moment.tz(end, timezone).format('YYYY-MM-DD HH:mm:ss') : null;

    await knex('events')
      .where({ id: eventId, user_id: userId })
      .update({ title, start: formattedStart, end: formattedEnd, eventType });

    // Fetch the user and the events within the notification time offset
    const user = await knex('users').where({ id: userId }).first();
    const events = await knex('events')
      .where('user_id', userId)
      .andWhere('start', '>=', moment().toISOString())
      .andWhere('start', '<', moment(formattedStart).add(user.notificationTime, 'minutes').toISOString());

    // Send push notifications
    await sendPushNotifications(user, events);

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

// Get today's events
exports.getTodaysEvents = async (req, res) => {
  try {
      const today = new Date().toISOString().split('T')[0];
      console.log(`Today's Date: ${today}`);

      const events = await knex('events')
          .whereRaw('DATE(start) = ?', [today])
          .select('title', 'start', 'end', 'eventType');

      // Log the events being processed
      console.log('Events fetched for today:', events);

      res.json(events);
  } catch (error) {
      console.error('Error fetching today\'s events:', error);
      res.status(500).json({ message: 'Error fetching today\'s events' });
  }
};