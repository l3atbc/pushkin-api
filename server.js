var amqp = require('amqplib/callback_api');
var app  = require('express')();
const PORT = 3000;

amqp.connect(process.env.AMPQ_ADDRESS, function (err, conn) {
  if (err) {
    return console.log("ERROR", err);
  }

  app.get('/', (req, res) => {
    conn.createChannel(function (err, ch) {
      var q = 'task_queue';
      var msg = req.query.message
      ch.assertQueue(q, { durable: true });
      ch.sendToQueue(q, new Buffer(msg), { persistent: true });
      console.log(" [x] Sent '%s'", msg);
      res.end(`Sent ${msg} to queue ${q} `);
    });
  })
})

//Lets define a port we want to listen to

//Create a server

//Lets start our server
app.listen(PORT, function () {
  //Callback triggered when server is successfully listening. Hurray!
  console.log("Server listening on: http://localhost:%s", PORT);
});