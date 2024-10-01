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
    const mediaItems = await db('media_statuses')
      .where('status', status)
      .andWhere('userId', req.user.userId);

    console.log('Fetched media items:', mediaItems); 
    res.json(mediaItems);
  } catch (error) {
    console.error('Error fetching media by status:', error);
    res.status(500).json({ error: 'Failed to fetch media by status' });
  }
});

// PUT /media-status/:media_id
router.put('/:media_id', async (req, res) => {
  const { media_id } = req.params;
  const { status, season, episode } = req.body;

  // Log to verify that req.user is available
  console.log('Inside media status update, req.user:', req.user);

  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await db('media_statuses')
      .where('media_id', media_id)
      .andWhere('userId', req.user.userId)
      .update({
        status,
        season: season || null, 
        episode: episode || null, 
      });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating media status:', error);
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
    // Reset season and episode to 1
    await db('media_statuses')
      .where('media_id', media_id)
      .andWhere('userId', req.user.userId)
      .update({
        season: 1,
        episode: 1,
      });

    res.json({ success: true, message: 'Season and episode reset successfully!' });
  } catch (error) {
    console.error('Error resetting season and episode:', error);
    res.status(500).json({ error: 'Failed to reset season and episode' });
  }
});

// POST /media-status
router.post('/', async (req, res) => {
  const { media_id, status, title, poster_path, overview, media_type, release_date, genre, season, episode } = req.body; 

  // Log to verify that req.user is available
  console.log('Inside media status creation, req.user:', req.user);

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
    console.error('Error adding media:', error);
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
    await db('media_statuses')
      .where('media_id', media_id)
      .andWhere('userId', req.user.userId)
      .del();

    res.json({ success: true, message: 'Media item deleted successfully' });
  } catch (error) {
    console.error('Error deleting media item:', error);
    res.status(500).json({ error: 'Failed to delete media item' });
  }
});

module.exports = router;