const { hashPassword } = require('../src/utils/hashPasswords');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Hash the passwords before inserting them
  const hashedPassword1 = await hashPassword('HugoIsTheBestDog');
  const hashedPassword2 = await hashPassword('HugoIsTheBest');

  // Users data
  const usersData = [
    { id: 1, name: 'Sunshine', username: 'sunshine', email: 'sunshine.agoo@gmail.com', password: hashedPassword1 },
    { id: 2, name: 'Magda', username: 'magda', email: 'magdaandshine@gmail.com', password: hashedPassword2 }
  ];

  // Check and insert users data
  for (const user of usersData) {
    const existingUser = await knex('users').where('id', user.id).first();
    if (!existingUser) {
      await knex('users').insert(user);
    }
  }

  // Viewed media data
  const viewedMediaData = [
    { userId: 1, media_id: 101, media_type: 'movie' },
    { userId: 2, media_id: 102, media_type: 'tv' }
  ];

  // Check and insert viewed media data
  for (const media of viewedMediaData) {
    const existingMedia = await knex('viewed_media').where({
      userId: media.userId,
      media_id: media.media_id,
      media_type: media.media_type
    }).first();
    if (!existingMedia) {
      await knex('viewed_media').insert(media);
    }
  }

  // Interactions data
  const interactionsData = [
    { userId: 1, media_id: 101, interaction: true, media_type: 'movie' },
    { userId: 2, media_id: 102, interaction: false, media_type: 'tv' }
  ];

  // Check and insert interactions data
  for (const interaction of interactionsData) {
    const existingInteraction = await knex('interactions').where({
      userId: interaction.userId,
      media_id: interaction.media_id,
      media_type: interaction.media_type
    }).first();
    if (!existingInteraction) {
      await knex('interactions').insert(interaction);
    }
  }
};