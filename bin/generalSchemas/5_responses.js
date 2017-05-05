// const knex = require('knex')(require('./knex.config.js'));

exports.up = function(knex, Promise) {
  return knex.schema.createTable('responses', table => {
    table.increments().primary();
    table.timestamps();
    table.integer('userId').references('id').inTable('users');
    table.integer('choiceId').references('id').inTable('choices').onDelete('CASCADE');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('responses');
};
