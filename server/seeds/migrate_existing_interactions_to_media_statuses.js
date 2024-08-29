/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Step 1: Query the interactions table for media with interaction value of 1
  const interactedMedia = await knex('interactions')
    .where('interaction', 1)
    .select('userId', 'media_id');

  // Step 2: Prepare the data for insertion into media_statuses
  for (const media of interactedMedia) {
    // Fetch the media details from TMDB API
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const mediaDetails = await fetch(`https://api.themoviedb.org/3/movie/${media.media_id}?api_key=${tmdbApiKey}`) 
      .then(response => response.json())
      .catch(error => {
        console.error('Error fetching media details:', error);
        return null;
      });

    if (mediaDetails) {
      // Safely handle the genres field
      const genres = mediaDetails.genres ? mediaDetails.genres.map(genre => genre.name).join(', ') : 'Unknown';

      // Insert into media_statuses table
      await knex('media_statuses').insert({
        userId: media.userId,
        mediaId: media.media_id,
        status: 'to_watch',
        title: mediaDetails.title || mediaDetails.name || 'Untitled', 
        poster_path: mediaDetails.poster_path || null,
        overview: mediaDetails.overview || 'No overview available.',
        media_type: mediaDetails.media_type || (mediaDetails.title ? 'movie' : 'tv'),
        release_date: mediaDetails.release_date || mediaDetails.first_air_date || null,
        genre: genres,
        timestamp: knex.fn.now(),
      });
    } else {
      console.warn(`Failed to fetch details for media item with ID ${media.media_id}.`);
    }
  }
};