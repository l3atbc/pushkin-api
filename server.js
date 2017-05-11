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
  const controllers = fs.readdirSync(path.resolve(__dirname, 'controllers'));
  controllers.forEach(controllerFile => {
    const short = controllerFile.toLowerCase().replace('.js', '');
    const route = '/api/' + short;
    const controller = require('./controllers/' + short)(rpc, conn, dbWrite);
    app.use(route, controller);
  });
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
  app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found' });
  });
});
app.get('/api/routes', (req, res, next) => {
  res.json({
    routes: app._router.stack.filter(stack => stack.route).map(stack => ({
      methods: Object.keys(stack.route.methods).map(method =>
        method.toUpperCase()
      ),
      path: stack.route.path
    }))
  });
});
app.use((err, req, res, next) => {
  res.status(500);
  res.json({ message: err.message });
});

app.listen(PORT, function() {
  //Callback triggered when server is successfully listening. Hurray!
  console.log('Server listening on: http://localhost:%s', PORT);
});

module.exports = app;
