/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = function(knex) {
  return knex('users').del()
    .then(function () {
      return knex('users').insert([
        { id: 1, name: 'Sunshine', username: 'sunshine', email: 'sunshine.agoo@gmail.com', password: 'HugoIsTheBestDog' },
        { id: 2, name: 'Magda', username: 'magda', email: 'magdaandshine@gmail.com', password: 'HugoIsTheBest' }
        // Add more users as needed
      ]);
    });
};
