/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('media_statuses', function(table) {
      table.increments('id').primary(); 
      table.integer('userId').unsigned().notNullable(); 
      table.integer('media_id').unsigned().notNullable();  
      table.string('status').notNullable(); 
      table.string('title').notNullable();
      table.string('poster_path');
      table.text('overview'); 
      table.string('media_type').notNullable(); 
      table.date('release_date'); 
      table.string('genre'); 
      table.timestamp('timestamp').defaultTo(knex.fn.now()); 
  
      // Optional: Add foreign key constraints if needed
      // table.foreign('userId').references('id').inTable('users');
      // table.foreign('media_id').references('id').inTable('media');
    });
  };

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('media_statuses');
  };