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
      table.integer('duration'); 
      table.timestamp('timestamp').defaultTo(knex.fn.now()); 
      
      // Add unique constraint
      table.unique(['userId', 'media_id'], 'unique_user_media');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('media_statuses');
};