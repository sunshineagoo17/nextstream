exports.up = function(knex) {
    return knex.schema.table('users', function(table) {
      table.string('avatar', 255).nullable();
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('users', function(table) {
      table.dropColumn('avatar');
    });
  };
  