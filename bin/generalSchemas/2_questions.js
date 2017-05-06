exports.up = function(knex, Promise) {
  return knex.schema.createTable('questions', table => {
    table.increments('id').primary();
    table.string('type');
    table.string('prompt');
    table.integer('trialId').references('id').inTable('trials');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('questions');
};
