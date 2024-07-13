const { hashPassword } = require('../src/utils/hashPasswords');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries in viewed_media related to users
  await knex('viewed_media').del();

  // Deletes ALL existing entries in users
  await knex('users').del();

  // Hash the passwords before inserting them
  const hashedPassword1 = await hashPassword('HugoIsTheBestDog');
  const hashedPassword2 = await hashPassword('HugoIsTheBest');

  // Inserts seed entries
  await knex('users').insert([
    { id: 1, name: 'Sunshine', username: 'sunshine', email: 'sunshine.agoo@gmail.com', password: hashedPassword1 },
    { id: 2, name: 'Magda', username: 'magda', email: 'magdaandshine@gmail.com', password: hashedPassword2 }
    // Add more users as needed
  ]);
};