// returns a promise that resolves to the result of the RPC
const winston = require('./logger');
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
          arguments: {
            'x-expires': 3 * 60 * 1000
          }
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
                winston.info('received', content);
                if (msg.properties.correlationId === corr) {
                  // this is result of the RPC;
                  // winston.info('is a match')
                  ch.deleteQueue(q.queue);
                  ch.close();
                  resolve(content);
                  // conn.close();
                }
              }
            },
            {
              noAck: true
            }
          );
          return ch.sendToQueue(channelName, new Buffer(JSON.stringify(body)), {
            correlationId: corr,
            replyTo: q.queue
          });
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
