const amqp = require('amqplib/callback_api');
const bodyParser = require('body-parser')
const rpc = require('./rpc');
const dbWrite = require('./dbWrite')
const winston = require('winston');

const app = require('express')();
const PORT = 3000;
app.use(bodyParser.json());

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
  app.get('/responses', (req, res, next) => {
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

  app.post('/response', (req, res, next) => {
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
      return rpc(conn, 'task_queue', { userId: user.id, questionId });
    }).then(data => {
      res.json(data);
    })
  })
  app.get('/trials', (req, res, next) => {
      var rpcInput = {
        method: 'allTrials',
      }
      const channelName = 'db_rpc_worker';
      return rpc(conn, channelName, rpcInput).then(data => {
        res.json(data)
      }).catch(next)
  })
  app.get('/initialQuestions', (req, res, next) => {
      var rpcInput = {
        method: 'getInitialQuestions',
      }
      const channelName = 'db_rpc_worker';
      return rpc(conn, channelName, rpcInput).then(data => {
        res.json(data);
      }).catch(next)
      // create a channel
  });
  app.get('/languages', (req, res, next) => {
      var rpcInput = {
        method: 'allLanguages'
      }
      const channelName = 'db_rpc_worker';
      return rpc(conn, channelName, rpcInput).then(data => {
        res.json(data);
      }).catch(next)

  })
  app.get('/users/:id', (req, res, next) => {
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
  app.post('/comments', (req, res, next) => {
    var rpcInput = {
      method: 'setUserLanguages',
      arguments: [req.body.userId, { 
        nativeLanguages: req.body.nativeLanguages,
        primaryLanguages: req.body.primaryLanguages,
      }]
    }
    const channelName = 'db_rpc_worker';
    return rpc(conn, channelName, rpcInput).then(data => {
        res.json(data);
      }).catch(next)

  })
});

app.listen(PORT, function() {
  //Callback triggered when server is successfully listening. Hurray!
  console.log('Server listening on: http://localhost:%s', PORT);
});