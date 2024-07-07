exports.up = function(knex) {
    return knex.schema.table('users', function(table) {
      table.boolean('isActive').defaultTo(true);
      table.boolean('isSubscribed').defaultTo(true);
      table.boolean('receiveReminders').defaultTo(false);
      table.boolean('receiveNotifications').defaultTo(false);
      table.string('region').defaultTo('');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('users', function(table) {
      table.dropColumn('isActive');
      table.dropColumn('isSubscribed');
      table.dropColumn('receiveReminders');
      table.dropColumn('receiveNotifications');
      table.dropColumn('region');
    });
  };
  