/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.raw(`
      ALTER TABLE messages 
      MODIFY message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    `);
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.raw(`
      ALTER TABLE messages 
      MODIFY message TEXT CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci;
    `);
  };  