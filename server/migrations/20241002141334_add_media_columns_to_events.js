/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table('events', function(table) {
      table.string('media_id').nullable();
      table.enum('media_type', ['movie', 'tv']).nullable(); 
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema.table('events', function(table) {
      table.dropColumn('media_id'); 
      table.dropColumn('media_type');
    });
  };
  