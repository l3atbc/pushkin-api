module.exports = function(conn, questionId, userId) {
  const channelName = 'task_queue';
  return new Promise((resolve, reject) => {
    return conn.createChannel((err, ch) => {
      if (err) {
        return reject(err);
      }
      // create a unique queue
      console.log('sent to que');
      ch.sendToQueue(task_queue, new Buffer(JSON.stringify({ userId, questionId})))
      ch.close();
      return resolve(null)
    });


  });
}