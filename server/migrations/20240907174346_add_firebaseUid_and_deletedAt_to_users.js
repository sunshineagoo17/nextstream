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

  // Step 2: Fetch all users with firebaseUid from MySQL and ensure no duplicates
  const usersToDelete = await knex('users').select('firebaseUid').whereNotNull('firebaseUid');

  // Step 3: Initialize Firebase Admin using environment variables
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), 
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      }),
    });
  }

  // Step 4: Delete users from Firebase using their firebaseUid
  for (const user of usersToDelete) {
    try {
      await admin.auth().deleteUser(user.firebaseUid);
      console.log(`Deleted Firebase user with UID: ${user.firebaseUid}`);
    } catch (error) {
      console.error(`Error deleting Firebase user with UID: ${user.firebaseUid}: `, error);
    }
  }

  // Step 5: Permanently delete all users from MySQL that have a firebaseUid
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