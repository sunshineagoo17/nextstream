/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('calendar_events', function(table) {
      table.increments('id').primary();
      table.integer('event_id').unsigned().notNullable().references('id').inTable('events').onDelete('CASCADE');
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.integer('friend_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.boolean('isAccepted').defaultTo(false); 
      table.boolean('isShared').defaultTo(false);  
      table.timestamps(true, true);  
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema.dropTable('calendar_events');
  };
  