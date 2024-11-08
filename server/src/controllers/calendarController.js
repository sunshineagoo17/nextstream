const knex = require('../config/db');
const moment = require('moment-timezone');
const { getMediaDetailsByTitle } = require('../utils/tmdbUtils');
const { sendPushNotifications } = require('../services/pushNotificationService');

// Get all events for a user
exports.getEvents = async (req, res) => {
  const { userId } = req.params;

  try {
    // Differentiate between authenticated users and guests
    const userIdentifier = req.user && req.user.role === 'guest' ? 'guest' : userId;

    // Fetch the user's own events
    const userEvents = await knex('events')
      .where({ user_id: userIdentifier })
      .select(
        'id', 
        'title', 
        'start', 
        'end', 
        'eventType', 
        'media_id', 
        'media_type', 
        'user_id as createdBy'
      );

    // Fetch shared events (including both accepted and pending invites)
    const sharedEvents = await knex('calendar_events')
      .join('events', 'calendar_events.event_id', '=', 'events.id')
      .where({ friend_id: userIdentifier, isAccepted: true })
      .select(
        'events.*',
        'calendar_events.isShared',
        'calendar_events.isAccepted',
        'events.media_id', 
        'events.media_type',
        'events.user_id as createdBy'
      );

    const allEvents = [...userEvents, ...sharedEvents];

    // Return a 200 response with an empty array if no events found
    return res.status(200).json(allEvents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events' });
  }
};

// Share an event with a friend
exports.shareEventWithFriends = async (req, res) => {
  const { userId, eventId } = req.params;
  const { friendIds } = req.body;

  try {
    const event = await knex('events')
      .where({ id: eventId, user_id: userId })
      .first();
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const sharedEventsData = friendIds.map((friendId) => ({
      event_id: eventId,
      user_id: userId,
      friend_id: friendId,
      isShared: true,
    }));

    await knex('calendar_events').insert(sharedEventsData);

    res.status(200).json({ message: 'Event shared successfully with friends.' });
  } catch (error) {
    res.status(500).json({ message: 'Error sharing event with friends.' });
  }
};

// Respond to a shared event
exports.respondToSharedEvent = async (req, res) => {
  const { userId, calendarEventId } = req.params;
  const { isAccepted } = req.body;

  try {
    const sharedEvent = await knex('calendar_events')
      .where({ id: calendarEventId })
      .where(function() {
        this.where('friend_id', userId).orWhere('user_id', userId);
      })
      .first();

    if (!sharedEvent) {
      return res.status(404).json({ message: 'Shared event not found' });
    }

    if (isAccepted) {
      await knex('calendar_events')
        .where({ id: calendarEventId, friend_id: userId })
        .update({ isAccepted: true });

      const event = await knex('events').where({ id: sharedEvent.event_id }).first();

      if (event && event.media_id && event.media_type) {
        const mediaDetails = await getMediaDetailsByTitle(event.title, event.media_type);
        if (!mediaDetails) throw new Error('Media details not found');

        const { title: mediaTitle, genres, duration } = mediaDetails;
        const genre = genres.join(', ');
        const updateMediaStatus = async (userIdToUpdate) => {
          await knex('media_statuses')
            .insert({
              userId: userIdToUpdate,
              media_id: event.media_id,
              media_type: event.media_type,
              status: 'scheduled',
              title: mediaTitle,
              genre,
              duration,
            })
            .onConflict(['user_id', 'media_id'])
            .merge({
              status: 'scheduled',
              title: mediaTitle,
              genre,
              duration,
            });
        };

        await updateMediaStatus(userId);
        await updateMediaStatus(sharedEvent.user_id);
      }
    } else {
      // Decline: delete the event if declined by either the inviter or invitee
      await knex('calendar_events').where({ id: calendarEventId }).del();
    }

    // Fetch updated events for the user
    const updatedEvents = await knex('calendar_events')
      .join('events', 'calendar_events.event_id', '=', 'events.id')
      .where({ 'calendar_events.friend_id': userId })
      .select(
        'events.*',
        'calendar_events.isShared',
        'calendar_events.isAccepted'
      );

    res.status(200).json({
      message: isAccepted
        ? 'Shared event accepted successfully and media status updated.'
        : 'Shared event declined and removed.',
      updatedEvents,
    });
  } catch (error) {
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
      .andWhere('title', 'like', `%${query}%`)
      .select(
        'id',
        'title',
        'start',
        'end',
        'eventType',
        'media_id',
        'media_type'
      );

    const sharedEvents = await knex('calendar_events')
      .join('events', 'calendar_events.event_id', '=', 'events.id')
      .where({ friend_id: userIdentifier, isAccepted: true })
      .andWhere('events.title', 'like', `%${query}%`)
      .select(
        'events.*',
        'calendar_events.isShared',
        'events.media_id',
        'events.media_type'
      );

    const allEvents = [...events, ...sharedEvents];

    res.status(200).json(allEvents);
  } catch (error) {
    res.status(500).json({ message: 'Error searching events' });
  }
};

// Add a new event
exports.addEvent = async (req, res) => {
  const io = req.app.get('io');
  const { title, start, end, eventType, timezone, media_id, media_type } = req.body;

  if (!['movie', 'tv', 'unknown'].includes(eventType)) {
    return res.status(400).json({ message: 'Invalid eventType' });
  }

  try {
    // Convert start and end times to UTC before storing them
    const formattedStart = moment.tz(start, timezone).utc().format('YYYY-MM-DD HH:mm:ss');
    const formattedEnd = end ? moment.tz(end, timezone).utc().format('YYYY-MM-DD HH:mm:ss') : null;

    // Identify user type
    const userIdentifier = req.user && req.user.role === 'guest' ? 'guest' : req.params.userId;

    let mediaId = media_id;
    let mediaType = media_type;
    let duration, genres;

    // Fetch media details if mediaId and mediaType aren't provided
    if (!mediaId || !mediaType) {
      const mediaDetails = await getMediaDetailsByTitle(title, eventType === 'movie' ? 'movie' : 'tv');
      if (mediaDetails) {
        mediaId = mediaDetails.id;
        mediaType = eventType;
        duration = mediaDetails.duration;
        genres = mediaDetails.genres;
      } else {
        return res.status(400).json({ message: `Media not found for title: ${title}` });
      }
    }

    // Insert event into the events table with UTC times
    const [eventId] = await knex('events').insert({
      user_id: userIdentifier,
      title,
      start: formattedStart,
      end: formattedEnd,
      eventType,
      media_id: mediaId,
      media_type: mediaType,
    });

    // Update media statuses if applicable
    if (mediaId && mediaType) {
      const genreString = Array.isArray(genres) ? genres.join(', ') : genres || null;

      await knex('media_statuses')
        .insert({
          userId: userIdentifier,
          media_id: mediaId,
          media_type: mediaType,
          status: 'scheduled',
          title,
          duration,
          genre: genreString,
        })
        .onConflict(['userId', 'media_id'])
        .merge({ status: 'scheduled', title });

      await knex('interactions')
        .insert({
          userId: userIdentifier,
          media_id: mediaId,
          media_type: mediaType,
          interaction: 1,
        })
        .onConflict(['userId', 'media_id', 'media_type'])
        .merge({ interaction: 1 });
    }

    // Send push notifications for authenticated users
    if (userIdentifier !== 'guest') {
      const user = await knex('users').where({ id: userIdentifier }).first();
      const events = await knex('events')
        .where('user_id', userIdentifier)
        .andWhere('start', '>=', moment().toISOString())
        .andWhere(
          'start',
          '<',
          moment(formattedStart).add(user.notificationTime, 'minutes').toISOString()
        );

      await sendPushNotifications(user, events);
    }

    // Emit real-time event addition via Socket.IO
    io.to(userIdentifier).emit('new_event', {
      message: `New event '${title}' added`,
      eventId,
      title,
      start: formattedStart,
      end: formattedEnd,
      eventType,
    });

    res.status(201).json({
      eventId,
      title,
      start: formattedStart,
      end: formattedEnd,
      eventType,
      media_id: mediaId,
      media_type: mediaType,
      duration,
      genre: genres || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding event' });
  }
};

// Update an existing event
exports.updateEvent = async (req, res) => {
  const io = req.app.get('io');
  const { eventId } = req.params;
  const { title, start, end, eventType, timezone, media_id, media_type } = req.body;

  if (eventType && !['movie', 'tv', 'unknown'].includes(eventType)) {
    return res.status(400).json({ message: 'Invalid eventType' });
  }

  try {
    // Convert start and end times to UTC before storing them
    const formattedStart = moment
      .tz(start, timezone)
      .utc()
      .format('YYYY-MM-DD HH:mm:ss');
    
    const formattedEnd = end
      ? moment.tz(end, timezone).utc().format('YYYY-MM-DD HH:mm:ss')
      : null;

    // Differentiate between authenticated users and guests
    let userIdentifier;
    if (req.user && req.user.role === 'guest') {
      userIdentifier = 'guest';
    } else {
      userIdentifier = req.params.userId;
    }

    // Update the event in the `events` table with UTC times
    await knex('events')
      .where({ id: eventId, user_id: userIdentifier })
      .update({ title, start: formattedStart, end: formattedEnd, eventType });

    // Update media statuses if applicable
    if (media_id && media_type) {
      await knex('media_statuses')
        .where({ userId: userIdentifier, media_id, media_type })
        .update({ status: 'scheduled' });
    }

    // Send push notifications only for authenticated users
    if (userIdentifier !== 'guest') {
      const user = await knex('users').where({ id: userIdentifier }).first();
      const events = await knex('events')
        .where('user_id', userIdentifier)
        .andWhere('start', '>=', moment().toISOString())
        .andWhere(
          'start',
          '<',
          moment(formattedStart)
            .add(user.notificationTime, 'minutes')
            .toISOString()
        );

      await sendPushNotifications(user, events);
    }

    // Emit real-time event update via Socket.IO
    io.to(userIdentifier).emit('update_event', {
      message: `Event '${title}' updated`,
      eventId,
      title,
      start: formattedStart,
      end: formattedEnd,
      eventType,
    });

    res.status(200).json({ message: 'Event updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating event' });
  }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
  const { eventId } = req.params;
  const { userId } = req.user;

  try {
    // Check if the user is either the creator or an invitee of the event
    const isEventOwner = await knex('events')
      .where({ id: eventId, user_id: userId })
      .first();
    
    const isInvitee = await knex('calendar_events')
      .where({ event_id: eventId, friend_id: userId })
      .first();

    if (!isEventOwner && !isInvitee) {
      return res.status(403).json({
        message: "You are not authorized to delete this event.",
      });
    }

    // Delete the event and associated calendar events if user is authorized
    await knex('events').where({ id: eventId }).del();
    await knex('calendar_events').where({ event_id: eventId }).del();

    if (isEventOwner?.media_id && isEventOwner?.media_type) {
      await knex('media_statuses')
        .where({ userId: userId, media_id: isEventOwner.media_id, media_type: isEventOwner.media_type })
        .del();

      await knex('interactions')
        .where({ userId: userId, media_id: isEventOwner.media_id, media_type: isEventOwner.media_type })
        .update({ interaction: 0 });
    }

    res.status(200).json({ message: 'Event and associated media status removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event.' });
  }
};

// Get today's events
exports.getTodaysEvents = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const events = await knex('events')
      .whereRaw('DATE(start) = ?', [today])
      .select('title', 'start', 'end', 'eventType');

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Error fetching today's events" });
  }
};

// Fetch pending calendar invites for a user
exports.getPendingCalendarInvites = async (req, res) => {
  const { userId } = req.user;

  try {
    const pendingInvites = await knex('calendar_events')
      .join('events', 'calendar_events.event_id', '=', 'events.id')
      .join('users', 'calendar_events.user_id', '=', 'users.id')
      .where({
        'calendar_events.friend_id': userId,
        'calendar_events.isAccepted': false,
      })
      .select(
        'calendar_events.id as inviteId',
        'events.title as eventTitle',
        'events.start',
        'events.end',
        'events.eventType',
        'users.name as inviterName',
        'calendar_events.isAccepted'
      );

    if (pendingInvites.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(pendingInvites);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching pending calendar invites' });
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

    res
      .status(200)
      .json({ message: 'Event shared successfully with friends.' });
  } catch (error) {
    res.status(500).json({ message: 'Error sharing event with friends.' });
  }
};

// Fetch sent invites
exports.getSharedFriendsForEvent = async (req, res) => {
  const { eventId, userId } = req.params;

  try {
    const sharedFriends = await knex('calendar_events')
      .where({ event_id: eventId, user_id: userId, isShared: true })
      .select('friend_id');

    if (sharedFriends.length === 0) {
      return res.status(200).json({ sharedFriendIds: [] });
    }

    const sharedFriendIds = sharedFriends.map((friend) => friend.friend_id);
    res.status(200).json({ sharedFriendIds });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shared friends.' });
  }
};

// Get all shared events for a user
exports.getSharedEvents = async (req, res) => {
  const { userId } = req.params;

  try {
    const createdSharedEvents = await knex('calendar_events')
      .join('events', 'calendar_events.event_id', '=', 'events.id')
      .join('users', 'calendar_events.friend_id', '=', 'users.id')
      .where({
        'calendar_events.user_id': userId,
        'calendar_events.isAccepted': true,
      })
      .select(
        'calendar_events.id as inviteId',
        'events.title as eventTitle',
        'events.start',
        'events.end',
        'events.eventType',
        'events.media_id',
        'events.media_type',
        'users.name as invitedFriendName', 
        'calendar_events.isAccepted',
        'calendar_events.isShared'
      );

    const invitedSharedEvents = await knex('calendar_events')
      .join('events', 'calendar_events.event_id', '=', 'events.id')
      .join('users', 'calendar_events.user_id', '=', 'users.id') 
      .where({
        'calendar_events.friend_id': userId,
        'calendar_events.isAccepted': true,
      })
      .select(
        'calendar_events.id as inviteId',
        'events.title as eventTitle',
        'events.start',
        'events.end',
        'events.eventType',
        'events.media_id',
        'events.media_type',
        'users.name as inviterName', 
        'calendar_events.isAccepted',
        'calendar_events.isShared'
      );

    // Combine both created and invited events
    const sharedEvents = [...createdSharedEvents, ...invitedSharedEvents];

    if (sharedEvents.length === 0) {
      return res.status(200).json([]);
    }

    // Format dates and return the combined event list
    const formattedEvents = sharedEvents.map((event) => ({
      inviteId: event.inviteId,
      eventTitle: event.eventTitle,
      start: event.start ? moment(event.start).format('YYYY-MM-DD HH:mm:ss') : null,
      end: event.end ? moment(event.end).format('YYYY-MM-DD HH:mm:ss') : null,
      eventType: event.eventType,
      mediaId: event.media_id,
      mediaType: event.media_type,
      inviterOrInvitedFriend: event.inviterName || event.invitedFriendName, 
      isAccepted: event.isAccepted,
      isShared: event.isShared,
    }));

    res.status(200).json(formattedEvents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shared events' });
  }
};