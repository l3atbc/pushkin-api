const express = require('express');
const fs = require('fs');
const basicAuth = require('basic-auth');
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
  router.put('/api/users/:id', (req, res, next) => {
    var rpcInput = {
      method: 'updateUser',
      arguments: [req.params.id, req.body]
    };
    const channelName = 'db_rpc_worker';
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  router.get('/api/trials', (req, res, next) => {
    var rpcInput = {
      method: 'allTrials'
    };
    const channelName = 'db_rpc_worker';
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  router.get('/api/admincsv', (req, res, next) => {
    // TODO: refactor this to be set on contruction of the controller
    // possibly
    const output = fs.readFileSync('./admin.txt', 'utf-8');
    const outputArray = output.split('\n');
    const users = outputArray.map(currentEl => {
      return {
        userName: currentEl.split(':')[0],
        passWord: currentEl.split(':')[1]
      };
    });
    const user = basicAuth(req);
    console.log(user);
    let flag;
    if (!user || !user.name || !user.pass) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      res.sendStatus(401);
      return;
    }
    for (var i = 0; i < users.length; i++) {
      const admin = users[i];
      if (admin.userName === user.name && admin.passWord === user.pass) {
        flag = true;
        break;
      } else {
        flag = false;
      }
    }
    if (flag) {
      const rpcInput = {
        method: 'getResponseCsv'
      };
      const channelName = 'db_rpc_worker';
      return rpc(conn, channelName, rpcInput)
        .then(data => {
          res.set('Content-Type', 'text/csv');
          res.send(data);
        })
        .catch(next);
    } else {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      res.sendStatus(401);
      return;
    }
  });
  return router;
}

module.exports = initialQuestions;
