/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Step 1: Query the interactions table for media with interaction value of 1
  const interactedMedia = await knex('interactions')
    .where('interaction', 1)
    .select('userId', 'media_id', 'media_type'); 

  // Step 2: Prepare the data for insertion into media_statuses
  for (const media of interactedMedia) {
    // Determine the correct endpoint based on media type
    const tmdbApiKey = process.env.TMDB_API_KEY;
    const mediaTypeEndpoint = media.media_type === 'movie' ? 'movie' : 'tv';
    
    const mediaDetails = await fetch(`https://api.themoviedb.org/3/${mediaTypeEndpoint}/${media.media_id}?api_key=${tmdbApiKey}`) 
      .then(response => response.json())
      .catch(error => {
        console.error(`Error fetching media details for ${media.media_type} with ID ${media.media_id}:`, error);
        return null;
      });

    if (mediaDetails) {
      // Safely handle the genres field
      const genres = mediaDetails.genres ? mediaDetails.genres.map(genre => genre.name).join(', ') : 'Unknown';

      // Check if the record already exists
      const existingRecord = await knex('media_statuses')
        .where('userId', media.userId)
        .andWhere('media_id', media.media_id)
        .first();

      // Insert only if the record does not exist
      if (!existingRecord) {
        await knex('media_statuses').insert({
          userId: media.userId,
          media_id: media.media_id, 
          status: 'to_watch',
          title: mediaDetails.title || mediaDetails.name || 'Untitled',
          poster_path: mediaDetails.poster_path || null,
          overview: mediaDetails.overview || 'No overview available.',
          media_type: media.media_type,
          release_date: mediaDetails.release_date || mediaDetails.first_air_date || null,
          genre: genres,
          timestamp: knex.fn.now(),
        });
      } else {
        console.log(`Record already exists for userId: ${media.userId}, media_id: ${media.media_id}`);
      }
    } else {
      console.warn(`Failed to fetch details for media item with ID ${media.media_id}.`);
    }
  }
};