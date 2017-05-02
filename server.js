let amqp = require('amqplib/callback_api');
const bodyParser = require('body-parser');
let rpc = require('./rpc');
const dbWrite = require('./dbWrite');
const winston = require('winston');
const cors = require('cors');
const fs = require('fs');
const app = require('express')();
const PORT = 3000;

const basicAuth = require('basic-auth');

if (process.env.NODE_ENV === 'test') {
  rpc = function(a, b, c) {
    return Promise.resolve('asdasd');
  };
  amqp = {
    connect: function(string, callback) {
      callback();
    }
  };
}
app.use(bodyParser.json());
app.use(cors());

amqp.connect(process.env.AMPQ_ADDRESS, function(err, conn) {
  if (err) {
    return winston.error(err);
  }
  app.use((req, res, next) => {
    winston.info('URL', req.url);
    next();
  });
  const whichEnglishController = require('./controllers/whichEnglish')(
    rpc,
    conn,
    dbWrite
  );
  app.use('/', whichEnglishController);
  /*
    Create and close a channel within the space of an http request
    all channels are created on the same persistent rabbit mq connection
    */

  // Send a post with question id and choice id
  // app

  app.post('/users', (req, res, next) => {
    const { user, choiceId, questionId } = req.body;
    var rpcInput = {
      method: 'createUser',
      arguments: [{ name: 'rob' }]
    };
    const channelName = 'db_rpc_worker';
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  app.get('/api/admincsv', (req, res, next) => {
    const output = fs.readFileSync('./admin.txt', 'utf-8');
    const outputArray = output.split('\n');
    const users = outputArray.map(currentEl => {
      return {
        userName: currentEl.split(':')[0],
        passWord: currentEl.split(':')[1]
      };
    });
    const user = basicAuth(req);
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
          res.send(data);
        })
        .catch(next);
    } else {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      res.sendStatus(401);
      return;
    }
  });
  app.get('/api/languages', (req, res, next) => {
    var rpcInput = {
      method: 'allLanguages'
    };
    const channelName = 'db_rpc_worker';
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  app.get('/api/users/:id', (req, res, next) => {
    var rpcInput = {
      method: 'findUser',
      arguments: [req.params.id, ['userLanguages.languages']]
    };
    const channelName = 'db_rpc_worker';
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  app.get('/api/results/:userId', (req, res, next) => {
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
  app.get('/api/users', (req, res, next) => {
    var rpcInput = {
      method: 'allUsers'
    };
    const channelName = 'db_rpc_worker';
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  app.post('/api/comments', (req, res, next) => {
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
    const channelName = 'db_rpc_worker';
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
});

app.listen(PORT, function() {
  //Callback triggered when server is successfully listening. Hurray!
  console.log('Server listening on: http://localhost:%s', PORT);
});

module.exports = app;
