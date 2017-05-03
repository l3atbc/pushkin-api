let amqp = require('amqplib/callback_api');
const bodyParser = require('body-parser');
let rpc = require('./rpc');
const dbWrite = require('./dbWrite');
const winston = require('winston');
const cors = require('cors');
const fs = require('fs');
const app = require('express')();
const PORT = 3000;
const path = require('path');

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
});
const controllers = fs.readdirSync(path.resolve(__dirname, 'controllers'));
controllers.forEach(controllerFile => {
  const short = controllerFile.replace('.js', '');
  const route = '/api/' + short;
  const controller = require('./controllers/' + short);
  app.use(route, controller);
});
app.listen(PORT, function() {
  //Callback triggered when server is successfully listening. Hurray!
  console.log('Server listening on: http://localhost:%s', PORT);
});

module.exports = app;
