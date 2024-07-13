/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.alterTable('viewed_media', (table) => {
      table.integer('userId').unsigned().notNullable().alter();
      table.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema.alterTable('viewed_media', (table) => {
      table.dropForeign('userId');
      table.integer('userId').notNullable().alter();
    });
  };
  