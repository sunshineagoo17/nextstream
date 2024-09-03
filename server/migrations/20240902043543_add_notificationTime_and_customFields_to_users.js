/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table('users', function(table) {
      table.string('notificationTime').nullable(); 
      table.string('customHours').nullable(); 
      table.string('customMinutes').nullable(); 
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema.table('users', function(table) {
      table.dropColumn('notificationTime'); 
      table.dropColumn('customHours'); 
      table.dropColumn('customMinutes'); 
    });
  };
  