/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    // Step 1: Add the 'deleted_at' column
    await knex.schema.table('users', function(table) {
      table.timestamp('deleted_at').nullable();
    });
  
    // Step 2: Permanently delete all users who were soft deleted
    await knex('users')
      .whereNotNull('deleted_at')  // Find users marked as deleted
      .del();  // Permanently delete those users
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function(knex) {
    // Step 1: Remove the 'deleted_at' column
    await knex.schema.table('users', function(table) {
      table.dropColumn('deleted_at');
    });
  };