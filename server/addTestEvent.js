const knex = require('../server/src/config/db');

const addTestEvent = async () => {
  try {
    await knex('events').insert({
      user_id: 38,
      title: 'Test Event',
      start: new Date(),
      end: new Date(),
    });
    console.log('Test event added');
  } catch (error) {
    console.error('Error adding test event:', error);
  } finally {
    knex.destroy();
  }
};

addTestEvent();
