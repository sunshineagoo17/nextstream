/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('Shows', function(table) {
        table.increments('id').primary();
        table.string('title', 255).notNullable();
        table.string('description', 1024);
        table.date('release_date');
        table.timestamps(true, true);
    });
};
  
exports.down = function(knex) {
    return knex.schema.dropTable('Shows');
};
  
