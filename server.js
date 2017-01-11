var amqp = require('amqplib/callback_api');
var app = require('express')();
const PORT = 3000;

amqp.connect(process.env.AMPQ_ADDRESS, function (err, conn) {
  if (err) {
    return console.log("ERROR", err);
  }

  app.get('/', (req, res) => {
    conn.createChannel(function (err, ch) {
      var q = 'task_queue';
      var msg = req.query.message
      ch.assertQueue(q, {
        durable: true
      });
      ch.sendToQueue(q, new Buffer(msg), {
        persistent: true
      });
      console.log(" [x] Sent '%s'", msg);
      res.end(`Sent ${msg} to queue ${q} `);
    });
  })
  app.get('/messages', (req, res) => {
    console.log('received request')
    conn.createChannel((err, ch) => {
      if(err) {
        return res.send(err);
      }
      ch.assertQueue('', {
        exclusive: true
      }, (err, q) => {
        if(err) {
          return res.send(err);
        }
        var corr = generateUuid();
        ch.consume(q.queue, (msg) => {
          console.log('consumed from queue');
          if (msg.properties.correlationId == corr) {
            console.log(' [.] Got %s', msg.content.toString());
            res.json(JSON.parse(msg.content.toString()))
          }
        }, {
          noAck: true
        });

        console.log('sent to queue');
        ch.sendToQueue('db_read',
          new Buffer('1'), {
            correlationId: corr,
            replyTo: q.queue
          });
      });
    });
  });
});

//Lets define a port we want to listen to

//Create a server

//Lets start our server
app.listen(PORT, function () {
  //Callback triggered when server is successfully listening. Hurray!
  console.log("Server listening on: http://localhost:%s", PORT);
});

function generateUuid() {
  return Math.random().toString() +
    Math.random().toString() +
    Math.random().toString();
}