const express = require('express');
const channelName = 'forum_rpc_worker';

module.exports = (rpc, conn, dbwrite, checkJWT) => {
  const router = new express.Router();
  router.get('/getAllForumPost', (req, res, next) => {
    var rpcInput = {
      method: 'allForumPost',
      params: []
    };
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });

  router.post('/createForumPost', checkJWT, (req, res, next) => {
    var rpcInput = {
      method: 'createForumPost',
      params: [
        {
          auth0_id: req.body.auth0_id,
          post_content: req.body.post_content,
          stim_id: req.body.stim_id,
          post_subject: req.body.post_subject,
          created_at: req.body.created_at
        }
      ]
    };
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  return router;
};
