const express = require('express');
const router = express.Router();
const knexConfig = require('../../knexfile');
const db = require('knex')(knexConfig.development);

// GET /media-status/:status
router.get('/:status', async (req, res) => {
  const { status } = req.params;

  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = req.user.userId;

    // Fetch the user's own media items with the given status
    const userMediaItems = await db('media_statuses')
      .where('status', status)
      .andWhere('userId', userId);

    // Fetch shared events that are scheduled
    const sharedEvents = await db('calendar_events')
      .join('events', 'calendar_events.event_id', '=', 'events.id')
      .where('calendar_events.friend_id', userId)
      .andWhere('calendar_events.isAccepted', true)
      .select('events.media_id', 'events.title', 'events.media_type', 'events.start', 'calendar_events.isShared');

    // Check if any of the shared events are not yet in `media_statuses`
    for (const event of sharedEvents) {
      if (event.media_id && event.media_type) {
        const mediaStatusExists = await db('media_statuses')
          .where('media_id', event.media_id)
          .andWhere('userId', userId)
          .first();

        if (!mediaStatusExists) {
          await db('media_statuses').insert({
            userId,
            media_id: event.media_id,
            title: event.title,
            media_type: event.media_type,
            status: 'scheduled',
            season: event.media_type === 'tv' ? 1 : null, 
            episode: event.media_type === 'tv' ? 1 : null,
            timestamp: db.fn.now(),
          });
        }
      } else {
        console.warn(`Skipping event with null media_id or media_type: ${event.title}`);
      }
    }

    // Fetch updated media items
    const updatedMediaItems = await db('media_statuses')
      .where('status', status)
      .andWhere('userId', userId)
      .select('*'); 

    // Add isShared flag to the media items
    const finalMediaItems = updatedMediaItems.map(item => {
      const sharedEvent = sharedEvents.find(event => event.media_id === item.media_id);
      return { ...item, isShared: !!sharedEvent };  
    });

    // Return the combined result of user's own media items and shared items
    res.json(finalMediaItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch media by status' });
  }
});

// PUT /media-status/:media_id
router.put('/:media_id', async (req, res) => {
  const { media_id } = req.params;
  const { status, season, episode, tags, review } = req.body;

  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const updateData = {
      status,
      season: season || null,
      episode: episode || null,
    };

    if (tags) {
      updateData.tags = tags.join(', ');
    }

    if (review !== undefined) {
      updateData.review = review;
    }

    await db('media_statuses')
      .where('media_id', media_id)
      .andWhere('userId', req.user.userId)
      .update(updateData);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update media status' });
  }
});

// PUT /media-status/:media_id/reset
router.put('/:media_id/reset', async (req, res) => {
  const { media_id } = req.params;

  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await db('media_statuses')
      .where('media_id', media_id)
      .andWhere('userId', req.user.userId)
      .update({
        season: 1,
        episode: 1,
      });

    res.json({ success: true, message: 'Season and episode reset successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset season and episode' });
  }
});

// POST /media-status
router.post('/', async (req, res) => {
  const { media_id, status, title, poster_path, overview, media_type, release_date, genre, season, episode } = req.body; 

  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await db('media_statuses').insert({
      userId: req.user.userId,
      media_id,
      status,
      title,
      poster_path,
      overview,
      media_type,
      release_date,
      genre,
      season: season || null, 
      episode: episode || null, 
      timestamp: db.fn.now(),
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add media' });
  }
});

// DELETE /media-status/:media_id
router.delete('/:media_id', async (req, res) => {
  const { media_id } = req.params;

  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = req.user.userId;

    await db('media_statuses')
      .where('media_id', media_id)
      .andWhere('userId', userId)
      .del();

    await db('interactions')
      .where({ media_id, userId })
      .update({ interaction: 0 });
      
    await db('calendar_events')
      .whereIn('event_id', function () {
        this.select('id').from('events')
          .where('media_id', media_id)
          .andWhere('user_id', userId);
      })
      .del();

    await db('events')
      .where('media_id', media_id)
      .andWhere('user_id', userId)
      .del();

    res.json({ success: true, message: 'Media item, interaction, and associated events deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete media item, interaction, and associated events' });
  }
});

// PUT /media-status/:media_id/tags
router.put('/:media_id/tags', async (req, res) => {
  const { media_id } = req.params;
  const { tags } = req.body;

  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await db('media_statuses')
    .where('media_id', media_id)
    .andWhere('userId', req.user.userId)
    .update({
      tags: JSON.stringify(tags)
    });

    res.json({ success: true, message: 'Tags updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tags' });
  }
});


// PUT /media-status/:media_id/review
router.put('/:media_id/review', async (req, res) => {
  const { media_id } = req.params;
  const { review } = req.body;

  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await db('media_statuses')
      .where('media_id', media_id)
      .andWhere('userId', req.user.userId)
      .update({
        review
      });

    res.json({ success: true, message: 'Review updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// DELETE /media-status/:media_id/tags
router.delete('/:media_id/tags', async (req, res) => {
  const { media_id } = req.params;

  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await db('media_statuses')
      .where('media_id', media_id)
      .andWhere('userId', req.user.userId)
      .update({ tags: null });

    res.json({ success: true, message: 'Tags deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tags' });
  }
});

// DELETE /media-status/:media_id/review
router.delete('/:media_id/review', async (req, res) => {
  const { media_id } = req.params;

  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await db('media_statuses')
      .where('media_id', media_id)
      .andWhere('userId', req.user.userId)
      .update({ review: null });

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;