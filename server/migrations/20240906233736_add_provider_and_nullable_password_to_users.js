/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.alterTable('users', function(table) {
      table.string('provider').nullable();
      table.string('password').nullable().alter(); 
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema.alterTable('users', function(table) {
      table.dropColumn('provider'); 
      table.string('password').notNullable().alter(); 
    });
  };
  