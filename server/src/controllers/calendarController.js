const knex = require('../config/db');
const moment = require('moment-timezone');
const { sendPushNotifications } = require('../services/pushNotificationService');

// Get all events for a user
exports.getEvents = async (req, res) => {
  const { userId } = req.params;
  console.log('Request User ID:', userId);

  try {
    // Differentiate between authenticated users and guests
    let userIdentifier;
    if (req.user && req.user.role === 'guest') {
      userIdentifier = 'guest';
    } else {
      userIdentifier = userId;
    }

    const events = await knex('events').where({ user_id: userIdentifier });
    console.log('Fetched events for User ID:', userIdentifier, events);

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
    // Differentiate between authenticated users and guests
    let userIdentifier;
    if (req.user && req.user.role === 'guest') {
      userIdentifier = 'guest';
    } else {
      userIdentifier = userId;
    }

    const events = await knex('events')
      .where({ user_id: userIdentifier })
      .andWhere('title', 'like', `%${query}%`);

    res.status(200).json(events);
  } catch (error) {
    console.error('Error searching events:', error);
    res.status(500).json({ message: 'Error searching events' });
  }
};

// Add a new event
exports.addEvent = async (req, res) => {
  const { title, start, end, eventType, timezone } = req.body;

  // Validate eventType
  if (!['movie', 'tv', 'unknown'].includes(eventType)) {
    return res.status(400).json({ message: 'Invalid eventType' });
  }

  try {
    const formattedStart = moment.tz(start, timezone).format('YYYY-MM-DD HH:mm:ss');
    const formattedEnd = end ? moment.tz(end, timezone).format('YYYY-MM-DD HH:mm:ss') : null;

    // Differentiate between authenticated users and guests
    let userIdentifier;
    if (req.user && req.user.role === 'guest') {
      userIdentifier = 'guest';
    } else {
      userIdentifier = req.params.userId;
    }

    const [eventId] = await knex('events').insert({
      user_id: userIdentifier,
      title,
      start: formattedStart,
      end: formattedEnd,
      eventType
    });

    // Send push notifications only for authenticated users
    if (userIdentifier !== 'guest') {
      const user = await knex('users').where({ id: userIdentifier }).first();
      const events = await knex('events')
        .where('user_id', userIdentifier)
        .andWhere('start', '>=', moment().toISOString())
        .andWhere('start', '<', moment(formattedStart).add(user.notificationTime, 'minutes').toISOString());

      await sendPushNotifications(user, events);
    }

    res.status(201).json({ eventId, title, start: formattedStart, end: formattedEnd, eventType });
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ message: 'Error adding event' });
  }
};

// Update an existing event
exports.updateEvent = async (req, res) => {
  const { eventId } = req.params;
  const { title, start, end, eventType, timezone } = req.body;

  // Validate eventType
  if (eventType && !['movie', 'tv', 'unknown'].includes(eventType)) {
    return res.status(400).json({ message: 'Invalid eventType' });
  }

  try {
    const formattedStart = moment.tz(start, timezone).format('YYYY-MM-DD HH:mm:ss');
    const formattedEnd = end ? moment.tz(end, timezone).format('YYYY-MM-DD HH:mm:ss') : null;

    // Differentiate between authenticated users and guests
    let userIdentifier;
    if (req.user && req.user.role === 'guest') {
      userIdentifier = 'guest';
    } else {
      userIdentifier = req.params.userId;
    }

    await knex('events')
      .where({ id: eventId, user_id: userIdentifier })
      .update({ title, start: formattedStart, end: formattedEnd, eventType });

    // Send push notifications only for authenticated users
    if (userIdentifier !== 'guest') {
      const user = await knex('users').where({ id: userIdentifier }).first();
      const events = await knex('events')
        .where('user_id', userIdentifier)
        .andWhere('start', '>=', moment().toISOString())
        .andWhere('start', '<', moment(formattedStart).add(user.notificationTime, 'minutes').toISOString());

      await sendPushNotifications(user, events);
    }

    res.status(200).json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Error updating event' });
  }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
  const { eventId } = req.params;

  try {
    // Differentiate between authenticated users and guests
    let userIdentifier;
    if (req.user && req.user.role === 'guest') {
      userIdentifier = 'guest';
    } else {
      userIdentifier = req.params.userId;
    }

    await knex('events')
      .where({ id: eventId, user_id: userIdentifier })
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