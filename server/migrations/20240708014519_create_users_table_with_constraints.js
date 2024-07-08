/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    // Create the users table
    await knex.schema.createTable('users', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('username').notNullable();
      table.string('email').notNullable().unique();
      table.string('password').notNullable();
      table.boolean('isActive').defaultTo(true);
      table.boolean('isSubscribed').defaultTo(true);
      table.boolean('receiveReminders').defaultTo(true);
      table.boolean('receiveNotifications').defaultTo(true);
      table.string('region').defaultTo('');
      table.string('resetPasswordToken').nullable();
      table.bigint('resetPasswordExpires').nullable();
      table.timestamps(true, true);
    });
  
    // Check and add unique constraint on email if not present
    const hasUniqueConstraint = await knex.schema.hasTable('users').then(exists => {
      if (exists) {
        return knex.raw(`
          SELECT COUNT(*)
          FROM information_schema.statistics
          WHERE table_schema = ? AND table_name = ? AND index_name = ?
        `, [knex.client.database(), 'users', 'users_email_unique']).then(result => result[0][0]['COUNT(*)'] > 0);
      }
      return false;
    });
  
    if (!hasUniqueConstraint) {
      await knex.schema.alterTable('users', function(table) {
        table.string('email').notNullable().unique().alter();
      });
    }
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function(knex) {
    // Remove unique constraint from email and drop the table
    await knex.schema.alterTable('users', function(table) {
      table.dropUnique('email');
      table.string('email').nullable().alter();
    });
  
    await knex.schema.dropTable('users');
  };
  