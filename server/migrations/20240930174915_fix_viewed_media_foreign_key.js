/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // Check if the foreign key exists
    const hasForeignKey = await knex.raw(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'viewed_media' AND CONSTRAINT_NAME = 'viewed_media_userid_foreign';
    `);
  
    // Drop the foreign key if it exists
    if (hasForeignKey.length > 0) {
      await knex.schema.table('viewed_media', (table) => {
        table.dropForeign('userId');
      });
    }
  
    // Add the foreign key constraint again
    return knex.schema.table('viewed_media', (table) => {
      table.foreign('userId').references('id').inTable('users').onDelete('CASCADE');
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function (knex) {
    return knex.schema.table('viewed_media', (table) => {
      table.dropForeign('userId');
    });
  };
  