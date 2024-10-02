/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.alterTable('media_statuses', function (table) {
      table.enum('status', ['to_watch', 'scheduled', 'shared_streams', 'watched']).notNullable().defaultTo('to_watch').alter();
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema.alterTable('media_statuses', function (table) {
      table.enum('status', ['to_watch', 'scheduled', 'shared_streams']).notNullable().defaultTo('to_watch').alter();
    });
  };  