const amqp = require('amqplib/callback_api');
const bodyParser = require('body-parser')
const rpc = require('./rpc');
const dbWrite = require('./dbWrite')
const winston = require('winston');
const cors = require('cors');

const app = require('express')();
const PORT = 3000;
app.use(bodyParser.json());
app.use(cors());

amqp.connect(process.env.AMPQ_ADDRESS, function(err, conn) {
  if (err) {
    return winston.error(err)
  }

  /* 
    Create and close a channel within the space of an http request
    all channels are created on the same persistent rabbit mq connection
  */
  // Send a post with question id and choice id
  app.post('/users', (req, res, next) => {
    const { user, choiceId, questionId } = req.body;
    var rpcInput = {
      method: 'createUser',
      arguments: [
        { name: 'rob' }
      ]
    }
    const channelName = 'db_rpc_worker';
    return rpc(conn, channelName, rpcInput)
    .then(data => {
      res.json(data)
    })
    .catch(next)
  })
  app.get('/api/responses', (req, res, next) => {
    const { user, choiceId, questionId } = req.body;
    var rpcInput = {
      method: 'allResponses',
      arguments: []
    }
    const channelName = 'db_rpc_worker';
    return rpc(conn, channelName, rpcInput)
    .then(data => {
      res.json(data)
    })
    .catch(next)
  })

  app.post('/api/response', (req, res, next) => {
    const { user, choiceId, questionId } = req.body;
    // save in db
    // ask for next
    // respond
    var rpcInput = {
      method: 'createResponse',
      arguments: [
        {userId: user.id, choiceId }
      ]
    }
    return dbWrite(conn, 'db_write', rpcInput)
    .then(() => {
      var workerInput = {
        method: 'getQuestion',
        payload: {
          userId: user.id, 
          questionId, 
          choiceId
        } 
      }
      return rpc(conn, 'task_queue', workerInput);
    }).then(data => {
      res.json(data);
    })
  })
  app.put('/api/users/:id', (req, res, next) => {
    var rpcInput = {
      method: 'updateUser',
      arguments:[req.params.id, req.body]
    }
    const channelName = 'db_rpc_worker';
    return rpc(conn, channelName, rpcInput).then(data => {
      res.json(data)
    }).catch(next)

  })
  app.get('/api/trials', (req, res, next) => {
      var rpcInput = {
        method: 'allTrials',
      }
      const channelName = 'db_rpc_worker';
      return rpc(conn, channelName, rpcInput).then(data => {
        res.json(data)
      }).catch(next)
  })
  app.get('/api/initialQuestions', (req, res, next) => {
      var rpcInput = {
        method: 'getInitialQuestions',
      }
      const channelName = 'db_rpc_worker';
      return rpc(conn, channelName, rpcInput).then(data => {
        res.json(data);
      }).catch(next)
      // create a channel
  });
  app.get('/api/languages', (req, res, next) => {
      var rpcInput = {
        method: 'allLanguages'
      }
      const channelName = 'db_rpc_worker';
      return rpc(conn, channelName, rpcInput).then(data => {
        res.json(data);
      }).catch(next)

  })
  app.get('/api/users/:id', (req, res, next) => {
      var rpcInput = {
        method: 'findUser',
        arguments: [
          req.params.id,
          ['userLanguages.languages']

        ]
      }
      const channelName = 'db_rpc_worker';
      return rpc(conn, channelName, rpcInput).then(data => {
        res.json(data);
      }).catch(next)
  })
  app.get('/api/results/:userId', (req, res, next) => {
      var workerInput = {
        method: 'getResults',
        payload: {
          userId: req.params.userId, 
        } 
      }
      return rpc(conn, 'task_queue', workerInput)
      .then(data => {
        res.json({ results: data });
      })
  })
  app.get('/api/users', (req, res, next) => {
    var rpcInput = {
      method: 'allUsers',
    }
    const channelName = 'db_rpc_worker';
    return rpc(conn, channelName, rpcInput).then(data => {
      res.json(data);
    }).catch(next)
  })
  app.post('/api/comments', (req, res, next) => {
    var rpcInput = {
      method: 'setUserLanguages',
      arguments: [req.body.userId, { 
        nativeLanguages: req.body.nativeLanguages,
        primaryLanguages: req.body.primaryLanguages,
      }]
    }
    const channelName = 'db_rpc_worker';
    return rpc(conn, channelName, rpcInput).then(data => {
        var rpc2 = {
          method: 'updateUser',
          arguments: [req.body.userId, {
            countriesOfResidence: req.body.countryOfResidence ? req.body.countryOfResidence.join(',') : null,
            englishYears: req.body.englishYears || null,
            householdEnglish: req.body.householdEnglish || null,
            learnAge: req.body.learnAge || null,
          }
          ],
        }
        return rpc(conn, channelName, rpc2).then((data2) => {
          return res.json(Object.assign({}, data, data2));
        });
      }).catch(next)

  })
});

app.listen(PORT, function() {
  //Callback triggered when server is successfully listening. Hurray!
  console.log('Server listening on: http://localhost:%s', PORT);
});