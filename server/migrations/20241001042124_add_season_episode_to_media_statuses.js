/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table('media_statuses', function(table) {
      table.integer('season').defaultTo(1); 
      table.integer('episode').defaultTo(1); 
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema.table('media_statuses', function(table) {
      table.dropColumn('season');
      table.dropColumn('episode'); 
    });
  };
  