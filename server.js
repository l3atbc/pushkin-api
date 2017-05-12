let amqp = require('amqplib/callback_api');
const bodyParser = require('body-parser');
let rpc = require('./rpc');
const dbWrite = require('./dbWrite');
const winston = require('winston');
const cors = require('cors');
const fs = require('fs');
const app = require('express')();
const PORT = 3000;
const printer = require('./printer');
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
  app.get('/api/routes', (req, res, next) => {
    const routes = printer(app);
    res.send(routes);
  });
  app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found' });
  });
  app.use((err, req, res, next) => {
    res.status(500);
    res.json({ message: err.message });
  });
  app.listen(PORT, function() {
    //Callback triggered when server is successfully listening. Hurray!
    console.log('Server listening on: http://localhost:%s', PORT);
  });
});
module.exports = app;
