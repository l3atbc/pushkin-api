const express = require('express');
function initialQuestions(rpc, conn, dbWrite) {
  const router = new express.Router();
  router.get('/api/initialQuestions', (req, res, next) => {
    var rpcInput = {
      method: 'getInitialQuestions'
    };
    const channelName = 'db_rpc_worker';
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
    // create a channel
  });
  router.get('/api/responses', (req, res, next) => {
    const { user, choiceId, questionId } = req.body;
    var rpcInput = {
      method: 'allResponses',
      arguments: []
    };
    const channelName = 'db_rpc_worker';
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  router.post('/api/response', (req, res, next) => {
    const { user, choiceId, questionId } = req.body;
    // save in db
    // ask for next
    // respond
    var rpcInput = {
      method: 'createResponse',
      arguments: [{ userId: user.id, choiceId }]
    };
    return dbWrite(conn, 'db_write', rpcInput)
      .then(() => {
        var workerInput = {
          method: 'getQuestion',
          payload: {
            userId: user.id,
            questionId,
            choiceId
          }
        };
        return rpc(conn, 'task_queue', workerInput);
      })
      .then(data => {
        res.json(data);
      });
  });
  return router;
}

module.exports = initialQuestions;
