// returns a promise that resolves to the result of the RPC
const logger = require('./logger.js');

module.exports = function(conn, channelName, body) {
  return new Promise((resolve, reject) => {
    return conn.createChannel((err, ch) => {
      if (err) {
        return reject(err);
      }
      // create a unique queue
      return ch.assertQueue(
        '',
        {
          exclusive: true,
          autoDelete: true,
          durable: false
        },
        (err, q) => {
          if (err) {
            return reject(err);
          }
          // generate a unique id to  listen for unique responses
          var corr = generateUuid();
          ch.consume(
            q.queue,
            msg => {
              // When the connection is closed it sends a blank message
              // check to make sure this isnt that
              if (msg) {
                const content = JSON.parse(msg.content.toString('utf8'));
                logger.info('received', content);
                if (msg.properties.correlationId === corr) {
                  // this is result of the RPC;
                  // winston.log('is a match')
                  ch.ack(msg);
                  resolve(content);
                  // conn.close();
                }
              }
            },
            {
              ack: true,
              exclusive: true
            },
            (err, ok) => {
              if (err) {
                return reject(err);
              }
              return ch.sendToQueue(
                channelName,
                new Buffer(JSON.stringify(body)),
                {
                  correlationId: corr,
                  replyTo: q.queue
                }
              );
            }
          );
        }
      );
    });
  });
};

function generateUuid() {
  return (
    Math.random().toString() +
    Math.random().toString() +
    Math.random().toString()
  );
}
