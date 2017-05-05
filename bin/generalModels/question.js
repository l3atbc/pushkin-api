// require('./trial');
module.exports = db => {
  const Question = db.Model.extend({
    tableName: 'questions',
    trial() {
      return this.belongsTo('Trial', 'trialId');
    },
    choices() {
      return this.hasMany('Choice', 'questionId');
    }
  });
  return db.model('Question', Question);
};
