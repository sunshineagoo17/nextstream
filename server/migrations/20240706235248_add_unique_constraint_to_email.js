/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
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
    await knex.schema.alterTable('users', function(table) {
      table.dropUnique('email');
      table.string('email').nullable().alter();
    });
  };
  