/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table('media_statuses', function(table) {
      table.json('tags').nullable();
      table.text('review').nullable();
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema.table('media_statuses', function(table) {
      table.dropColumn('tags');
      table.dropColumn('review');
    });
  };
  