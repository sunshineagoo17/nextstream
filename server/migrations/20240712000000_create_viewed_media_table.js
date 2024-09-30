/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    const tableExists = await knex.schema.hasTable('viewed_media');
    if (!tableExists) {
      return knex.schema.createTable('viewed_media', (table) => {
        table.increments('id').primary();
        table.integer('userId').unsigned().notNullable();
        table.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
        table.integer('media_id').notNullable();
        table.varchar('media_type', 50).notNullable();
        table.timestamp('viewed_at').defaultTo(knex.fn.now());
      });
    }
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('viewed_media');
  };  