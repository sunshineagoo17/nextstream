const knex = require('../config/db');
const moment = require('moment-timezone');
const { sendPushNotifications } = require('../services/pushNotificationService');

// Get all events for a user
exports.getEvents = async (req, res) => {
  const { userId } = req.params;
  console.log('Request User ID:', userId);

  try {
    // Differentiate between authenticated users and guests
    const userIdentifier = req.user && req.user.role === 'guest' ? 'guest' : userId;

    // Fetch the user's own events
    const userEvents = await knex('events').where({ user_id: userIdentifier });
    console.log('Fetched user\'s own events:', userEvents);

    // Fetch shared events (including both accepted and pending invites)
    const sharedEvents = await knex('calendar_events')
      .join('events', 'calendar_events.event_id', '=', 'events.id')
      .where({ friend_id: userIdentifier })
      .select('events.*', 'calendar_events.isShared', 'calendar_events.isAccepted');
    
    console.log('Fetched shared events:', sharedEvents);

    // Combine both user events and shared events
    const allEvents = [...userEvents, ...sharedEvents];

    if (allEvents.length === 0) {
      return res.status(404).json({ message: 'No events found for this user' });
    }

    // Send all events (both owned and shared)
    res.status(200).json(allEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
};

// Share an event with a friend
exports.shareEventWithFriends = async (req, res) => {
  const { userId, eventId } = req.params;
  const { friendIds } = req.body;

  try {
    const event = await knex('events').where({ id: eventId, user_id: userId }).first();
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const sharedEventsData = friendIds.map(friendId => ({
      event_id: eventId,
      user_id: userId,
      friend_id: friendId,
      isShared: true,
    }));

    await knex('calendar_events').insert(sharedEventsData);

    res.status(200).json({ message: 'Event shared successfully with friends.' });
  } catch (error) {
    console.error('Error sharing event with friends:', error);
    res.status(500).json({ message: 'Error sharing event with friends.' });
  }
};

// Respond to a shared event
exports.respondToSharedEvent = async (req, res) => {
  const { userId, calendarEventId } = req.params;
  const { isAccepted } = req.body;

  try {
    const sharedEvent = await knex('calendar_events')
      .where({ id: calendarEventId, friend_id: userId })
      .first();

    if (!sharedEvent) {
      return res.status(404).json({ message: 'Shared event not found' });
    }

    // Update the shared event status to accepted
    await knex('calendar_events')
      .where({ id: calendarEventId, friend_id: userId })
      .update({ isAccepted });

    // Fetch updated event details to move to the shared calendar list
    const updatedEvent = await knex('calendar_events')
      .join('events', 'calendar_events.event_id', '=', 'events.id')
      .where({ 'calendar_events.id': calendarEventId })
      .select('events.*')
      .first();

    res.status(200).json({
      message: 'Shared event response updated successfully.',
      updatedEvent,
    });
  } catch (error) {
    console.error('Error responding to shared event:', error);
    res.status(500).json({ message: 'Error responding to shared event.' });
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

    // Search user's own events
    const events = await knex('events')
      .where({ user_id: userIdentifier })
      .andWhere('title', 'like', `%${query}%`);

    // Search shared events for this user
    const sharedEvents = await knex('calendar_events')
      .join('events', 'calendar_events.event_id', '=', 'events.id')
      .where({ friend_id: userIdentifier, isAccepted: true })
      .andWhere('events.title', 'like', `%${query}%`)
      .select('events.*', 'calendar_events.isShared');

    // Combine user's events and shared events
    const allEvents = [...events, ...sharedEvents];

    res.status(200).json(allEvents);
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

// Fetch pending calendar invites for a user
exports.getPendingCalendarInvites = async (req, res) => {
  const { userId } = req.user;  

  try {
    const pendingInvites = await knex('calendar_events')
      .join('events', 'calendar_events.event_id', '=', 'events.id') 
      .join('users', 'calendar_events.user_id', '=', 'users.id') 
      .where({ 'calendar_events.friend_id': userId, 'calendar_events.isAccepted': false }) 
      .select(
        'calendar_events.id as inviteId',
        'events.title as eventTitle',
        'events.start',
        'events.end',
        'events.eventType',
        'users.name as inviterName',
        'calendar_events.isAccepted'
      );

    // Return an empty array if no pending invites are found
    if (pendingInvites.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(pendingInvites);
  } catch (error) {
    console.error('Error fetching pending calendar invites:', error);
    res.status(500).json({ message: 'Error fetching pending calendar invites' });
  }
};

exports.shareEventWithFriends = async (req, res) => {
  const { eventId, userId } = req.params;
  const { friendIds } = req.body;

  if (!Array.isArray(friendIds) || friendIds.length === 0) {
    return res.status(400).json({ message: 'No friends selected' });
  }

  try {
    const sharedEventsData = friendIds.map((friendId) => ({
      event_id: eventId,
      user_id: userId,
      friend_id: friendId,
      isShared: true,
    }));

    await knex('calendar_events').insert(sharedEventsData);

    res.status(200).json({ message: 'Event shared successfully with friends.' });
  } catch (error) {
    console.error('Error sharing event with friends:', error);
    res.status(500).json({ message: 'Error sharing event with friends.' });
  }
};

// Fetch sent invites
exports.getSharedFriendsForEvent = async (req, res) => {
  const { eventId, userId } = req.params;

  try {
    // Fetch friends with whom the event has already been shared
    const sharedFriends = await knex('calendar_events')
      .where({ event_id: eventId, user_id: userId, isShared: true })
      .select('friend_id');

    // If no friends found, return empty array
    if (sharedFriends.length === 0) {
      return res.status(200).json({ sharedFriendIds: [] });
    }

    // Return the list of shared friend IDs
    const sharedFriendIds = sharedFriends.map((friend) => friend.friend_id);
    res.status(200).json({ sharedFriendIds });
  } catch (error) {
    console.error('Error fetching shared friends:', error);
    res.status(500).json({ message: 'Error fetching shared friends.' });
  }
};

// Get all shared events for a user
exports.getSharedEvents = async (req, res) => {
  const { userId } = req.params;

  try {
    const sharedEvents = await knex('calendar_events')
      .join('events', 'calendar_events.event_id', '=', 'events.id')
      .where({ friend_id: userId, isAccepted: true }) 
      .select('events.*', 'calendar_events.isShared', 'calendar_events.isAccepted');

    if (sharedEvents.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(sharedEvents);
  } catch (error) {
    console.error('Error fetching shared events:', error);
    res.status(500).json({ message: 'Error fetching shared events' });
  }
};