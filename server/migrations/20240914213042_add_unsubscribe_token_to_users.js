/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table('users', function(table) {
      table.string('unsubscribeToken').nullable();
      table.bigint('unsubscribeExpires').nullable();
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema.table('users', function(table) {
      table.dropColumn('unsubscribeToken');
      table.dropColumn('unsubscribeExpires');
    });
  };  