// var bookshelf = require('../db');
// require('./choice');
// require('./user');
module.exports = db => {
  const Response = db.Model.extend({
    tableName: 'responses',
    question() {
      return this.belongsTo('Choice', 'choiceId');
    },
    user() {
      return this.belongsTo('User', 'userId');
    }
  });
  return db.model('Response', Response);
};
