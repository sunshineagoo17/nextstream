/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('messages', function(table) {
      table.increments('id').primary();
      table.integer('sender_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.integer('receiver_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.text('message').notNullable();
      table.boolean('is_read').defaultTo(false);
      table.timestamps(true, true);
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema.dropTable('messages');
  };  