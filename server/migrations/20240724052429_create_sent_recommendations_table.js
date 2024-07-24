/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('sent_recommendations', (table) => {
      table.increments('id').primary();
      table.integer('userId').unsigned().notNullable();
      table.integer('recommendationId').unsigned().notNullable();
      table.timestamp('sent_at').defaultTo(knex.fn.now());
  
      table.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
      // table.foreign('recommendationId').references('id').inTable('recommendations').onDelete('CASCADE'); // Uncomment if recommendations table exists
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema.dropTable('sent_recommendations');
  };  