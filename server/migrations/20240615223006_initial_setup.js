/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.schema.createTable('users', table => {
        table.increments('id').primary();
        table.string('username').notNullable();
        table.string('email').notNullable().unique();
        table.string('password').notNullable();
        table.timestamps(true, true);
    });
  
    await knex.schema.createTable('movies', table => {
        table.increments('id').primary();
        table.string('title').notNullable();
        table.string('description').notNullable();
        table.date('release_date').notNullable();
        table.string('streaming_platforms').notNullable();
        table.string('image').notNullable();
        table.decimal('rating', 2, 1).notNullable();
        table.timestamps(true, true);
    });
  
    await knex.schema.createTable('shows', table => {
        table.increments('id').primary();
        table.string('title').notNullable();
        table.string('description').notNullable();
        table.date('release_date').notNullable();
        table.string('streaming_platforms').notNullable();
        table.string('image').notNullable();
        table.decimal('rating', 2, 1).notNullable();
        table.timestamps(true, true);
    });
  
    await knex.schema.createTable('ratings', table => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.integer('movie_id').unsigned().references('id').inTable('movies').onDelete('CASCADE');
        table.integer('show_id').unsigned().references('id').inTable('shows').onDelete('CASCADE');
        table.decimal('rating', 2, 1).notNullable();
        table.timestamps(true, true);
    });
  
    await knex.schema.createTable('schedules', table => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.integer('movie_id').unsigned().references('id').inTable('movies').onDelete('CASCADE');
        table.integer('show_id').unsigned().references('id').inTable('shows').onDelete('CASCADE');
        table.timestamp('scheduled_time').notNullable();
        table.timestamps(true, true);
    });
};
  
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('schedules');
    await knex.schema.dropTableIfExists('ratings');
    await knex.schema.dropTableIfExists('shows');
    await knex.schema.dropTableIfExists('movies');
    await knex.schema.dropTableIfExists('users');
};