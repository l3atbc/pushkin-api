let amqp = require('amqplib/callback_api');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const app = require('express')();
let rpc = require('./rpc');
const printer = require('./printer');
const logger = require('./logger.js');
const CONFIG = require('./config.js');
const checkJWT = require('./auth.js').verify;
const dbWrite = require('./dbWrite');
const PORT = 3000;
app.use(bodyParser.json());
app.use(cors());
amqp.connect(process.env.AMPQ_ADDRESS, function(err, conn) {
  if (err) {
    return logger.error(err);
  }
  app.use((req, res, next) => {
    logger.info(req.url);
    next();
  });
  const controllers = fs
    .readdirSync(path.resolve(__dirname, 'controllers'))
    .filter(file => path.parse(file).ext === '.js');
  controllers.forEach(controllerFile => {
    const short = controllerFile.replace('.js', '');
    const route = '/api/' + short;
    const controller = require('./controllers/' + short)(rpc, conn, dbWrite);
    app.use(route, controller);
  });
  if (CONFIG.forum) {
    const forumController = require('./forum')(rpc, conn, dbWrite, checkJWT);
    app.use('/api', forumController);
  }
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
    logger.error(err.message);
  });
  app.listen(PORT, function() {
    //Callback triggered when server is successfully listening. Hurray!
    console.log('Server listening on: http://localhost:%s', PORT);
  });
});
module.exports = app;
