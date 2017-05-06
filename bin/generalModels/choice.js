// // var bookshelf = require('../db');
// require('./question');
// require('./response');
module.exports = db => {
  var Choice = db.Model.extend({
    tableName: 'choices',
    question() {
      this.belongsTo('Question', 'questionId');
    },
    responses() {
      return this.hasMany('Response', 'choiceId');
    }
  });
  return db.model('Choice', Choice);
};
