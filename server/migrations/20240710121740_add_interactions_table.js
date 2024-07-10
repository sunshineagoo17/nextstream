/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('interactions', function(table) {
      table.increments('id').primary();
      table.string('user_id').notNullable();
      table.integer('media_id').notNullable();
      table.boolean('interaction').notNullable(); // 1 for like, 0 for dislike
      table.string('media_type').notNullable();
      table.timestamp('timestamp').defaultTo(knex.fn.now());
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema.dropTable('interactions');
  };  