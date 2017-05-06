const express = require('express');
const fs = require('fs');
const basicAuth = require('basic-auth');

const checkUser = (username, password) => {
  const output = fs.readFileSync('./admin.txt', 'utf-8');
  const outputArray = output.split('\n');
  const users = outputArray.map(currentEl => {
    return {
      username: currentEl.split(':')[0],
      password: currentEl.split(':')[1]
    };
  });
  return users.some(
    admin => admin.username === username && admin.password === password
  );
};
const getFileName = () => {
  const fullPath = __filename;
  const fileName = fullPath.replace(/^.*[\\\/]/, '');
  return fileName.replace('.js', '').toLowerCase();
};
module.exports = (rpc, conn, dbWrite) => {
  const fileName = getFileName();
  const router = new express.Router();
  router.get('/initialQuestions', (req, res, next) => {
    var rpcInput = {
      method: 'getInitialQuestions'
    };
    const channelName = fileName + '_rpc_worker';
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
    // create a channel
  });
  router.get('/responses', (req, res, next) => {
    const { user, choiceId, questionId } = req.body;
    var rpcInput = {
      method: 'allResponses',
      arguments: []
    };
    const channelName = fileName + '_rpc_worker';
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  router.post('/response', (req, res, next) => {
    const { user, choiceId, questionId } = req.body;
    // save in db
    // ask for next
    // respond
    var rpcInput = {
      method: 'createResponse',
      arguments: [{ userId: user.id, choiceId }]
    };
    return dbWrite(conn, fileName + '_db_write', rpcInput)
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
  router.put('/users/:id', (req, res, next) => {
    var rpcInput = {
      method: 'updateUser',
      arguments: [req.params.id, req.body]
    };
    const channelName = fileName + '_rpc_worker';
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  router.get('/trials', (req, res, next) => {
    var rpcInput = {
      method: 'allTrials'
    };
    const channelName = fileName + '_rpc_worker';
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  router.get('/admincsv', (req, res, next) => {
    // TODO: refactor this to be set on contruction of the controller
    // possibly
    const user = basicAuth(req);
    if (!user || !user.name || !user.pass) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      return res.sendStatus(401);
    }
    if (checkUser(user.name, user.pass)) {
      const rpcInput = {
        method: 'getResponseCsv'
      };
      const channelName = fileName + '_rpc_worker';
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
  router.get('/languages', (req, res, next) => {
    var rpcInput = {
      method: 'allLanguages'
    };
    const channelName = fileName + '_rpc_worker';
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  router.get('/users/:id', (req, res, next) => {
    var rpcInput = {
      method: 'findUser',
      arguments: [req.params.id, ['userLanguages.languages']]
    };
    const channelName = fileName + '_rpc_worker';
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  router.get('/results/:userId', (req, res, next) => {
    var workerInput = {
      method: 'getResults',
      payload: {
        userId: req.params.userId
      }
    };
    return rpc(conn, 'task_queue', workerInput).then(data => {
      res.json({ results: data });
    });
  });
  router.post('/comments', (req, res, next) => {
    var rpcInput = {
      method: 'setUserLanguages',
      arguments: [
        req.body.userId,
        {
          nativeLanguages: req.body.nativeLanguages,
          primaryLanguages: req.body.primaryLanguages
        }
      ]
    };
    const channelName = fileName + '_rpc_worker';
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        var rpc2 = {
          method: 'updateUser',
          arguments: [
            req.body.userId,
            {
              countriesOfResidence: req.body.countryOfResidence
                ? req.body.countryOfResidence.join(',')
                : null,
              englishYears: req.body.englishYears || null,
              householdEnglish: req.body.householdEnglish || null,
              learnAge: req.body.learnAge || null
            }
          ]
        };
        return rpc(conn, channelName, rpc2).then(data2 => {
          return res.json(Object.assign({}, data, data2));
        });
      })
      .catch(next);
  });
  return router;
};
