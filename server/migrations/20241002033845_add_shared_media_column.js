/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table('media_statuses', function(table) {
      table.boolean('is_shared').defaultTo(false); 
      table.integer('shared_with_userId').unsigned().nullable();
      
      table.foreign('shared_with_userId').references('users.id');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.table('media_statuses', function(table) {
      table.dropColumn('is_shared');
      table.dropColumn('shared_with_userId');
    });
};
