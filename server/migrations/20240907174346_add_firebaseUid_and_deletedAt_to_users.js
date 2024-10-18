/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Check if the 'firebaseUid' column already exists before adding it
  const hasColumn = await knex.schema.hasColumn('users', 'firebaseUid');
  if (!hasColumn) {
      // Step 1: Add the firebaseUid column if it doesn't exist
      await knex.schema.alterTable('users', function(table) {
          table.string('firebaseUid').nullable();  // Add firebaseUid column
      });
  }

  // Step 2: Fetch all users from Firebase and ensure no duplicates
  const usersToDelete = await knex('users').select('firebaseUid').whereNotNull('firebaseUid');

  const admin = require('firebase-admin');
  if (!admin.apps.length) {
      admin.initializeApp({
          credential: admin.credential.cert(require('../src/config/nextstream-firebaseServiceAccountKey.json')),
      });
  }

  // Step 3: Delete users from Firebase 
  for (const user of usersToDelete) {
      try {
          await admin.auth().deleteUser(user.firebaseUid);
          console.log(`Deleted Firebase user with UID: ${user.firebaseUid}`);
      } catch (error) {
          console.error(`Error deleting Firebase user with UID: ${user.firebaseUid}: `, error);
      }
  }

  // Step 4: Permanently delete all users from MySQL
  await knex('users').whereNotNull('firebaseUid').del();
};

/**
* @param { import("knex").Knex } knex
* @returns { Promise<void> }
*/
exports.down = async function(knex) {
  // Drop the 'firebaseUid' column if it exists
  const hasColumn = await knex.schema.hasColumn('users', 'firebaseUid');
  if (hasColumn) {
      await knex.schema.alterTable('users', function(table) {
          table.dropColumn('firebaseUid'); 
      });
  }
};