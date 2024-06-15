/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('Ratings', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.integer('movie_id').unsigned().references('id').inTable('Movies').onDelete('CASCADE');
      table.integer('show_id').unsigned().references('id').inTable('Shows').onDelete('CASCADE');
      table.integer('rating').notNullable();
      table.timestamps(true, true);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('Ratings');
  };
  