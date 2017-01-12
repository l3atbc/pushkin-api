const amqp = require('amqplib/callback_api');
const app = require('express')();
const PORT = 3000;

amqp.connect(process.env.AMPQ_ADDRESS, function(err, conn) {
  if (err) {
    return console.log('ERROR', err);
  }

  /* 
    Create and close a channel within the space of an http request
    all channels are created on the same persistent rabbit mq connection
  */
  app.get('/', (req, res) => {
    conn.createChannel(function(err, ch) {
      /*
      Task queue passes a buffer to the python worker
    */
      const channelName = 'task_queue';

      const msg = req.query.message;
      ch.assertQueue(channelName, { durable: true });
      ch.sendToQueue(channelName, new Buffer(msg), { persistent: true });
      console.log(' [x] Sent \'%s\'', msg);
      res.end(`Sent ${msg} to queue ${channelName} `);
      ch.close();
    });
  });
  app.get('/messages', (req, res) => {
    console.log('received request');
    const channelName = 'db_read';
    /*
      Created a RPC to db_read queue
      call with no data (for testing purposes)
      keep the http response open until receiving a message from the RPC via rabbitmq
    */
    conn.createChannel((err, ch) => {
      if (err) {
        return res.send(err);
      }
      ch.assertQueue('', { exclusive: true }, (err, q) => {
        if (err) {
          return res.send(err);
        }
        // Create a correlation id to use to verify the RPC
        var corr = generateUuid();
        ch.consume(
          q.queue,
          msg => {
            console.log('consumed from queue');
            if (msg.properties.correlationId == corr) {
              console.log(' [.] Got %s', msg.content.toString());
              res.json(JSON.parse(msg.content.toString()));
              ch.close();
            }
          },
          { noAck: true }
        );
        console.log('sent to queue');
        ch.sendToQueue(channelName, new Buffer('1'), {
          correlationId: corr,
          replyTo: q.queue
        });
      });
    });
  });
});

app.listen(PORT, function() {
  //Callback triggered when server is successfully listening. Hurray!
  console.log('Server listening on: http://localhost:%s', PORT);
});

function generateUuid() {
  return Math.random().toString() + Math.random().toString() +
    Math.random().toString();
}
