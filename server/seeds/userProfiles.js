const { hashPassword } = require('../src/utils/hashPasswords');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Check if there are existing entries in the users table
  const existingUsers = await knex('users').select('*');
  if (existingUsers.length === 0) {
    // Hash the passwords before inserting them
    const hashedPassword1 = await hashPassword('HugoIsTheBestDog');
    const hashedPassword2 = await hashPassword('HugoIsTheBest');

    // Inserts seed entries
    await knex('users').insert([
      { id: 1, name: 'Sunshine', username: 'sunshine', email: 'sunshine.agoo@gmail.com', password: hashedPassword1 },
      { id: 2, name: 'Magda', username: 'magda', email: 'magdaandshine@gmail.com', password: hashedPassword2 }
      // Add more users as needed
    ]);
  }

  // Check if there are existing entries in the viewed_media table
  const existingViewedMedia = await knex('viewed_media').select('*');
  if (existingViewedMedia.length === 0) {
    await knex('viewed_media').insert([
      { userId: 1, media_id: 101, media_type: 'movie' },
      { userId: 2, media_id: 102, media_type: 'tv' }
      // Add more viewed media entries as needed
    ]);
  }

  // Check if there are existing entries in the interactions table
  const existingInteractions = await knex('interactions').select('*');
  if (existingInteractions.length === 0) {
    await knex('interactions').insert([
      { userId: 1, media_id: 101, interaction: true, media_type: 'movie' },
      { userId: 2, media_id: 102, interaction: false, media_type: 'tv' }
      // Add more interactions as needed
    ]);
  }
};