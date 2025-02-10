exports.up = async function(knex) {
    await knex.schema.alterTable('users', function(table) {
        table.boolean('receiveReminders').defaultTo(false).alter();
        table.boolean('receiveNotifications').defaultTo(false).alter();
    });

    // Update existing users
    await knex('users').update({
        receiveReminders: false,
        receiveNotifications: false,
    });
};

exports.down = async function(knex) {
    await knex.schema.alterTable('users', function(table) {
        table.boolean('receiveReminders').defaultTo(true).alter();
        table.boolean('receiveNotifications').defaultTo(true).alter();
    });

    // Rollback for existing users
    await knex('users').update({
        receiveReminders: true,
        receiveNotifications: true,
    });
};