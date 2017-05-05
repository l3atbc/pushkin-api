// const knex = require('knex')(require('./knex.config.js'));

exports.up = function(knex, Promise) {
  return knex.schema.createTable('choices', table => {
    table.increments().primary;
    table.string('type');
    table.string('imageUrl');
    table.string('displayText');
    table.boolean('correct');
    table.integer('questionId').references('id').inTable('questions');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('choices');
};
