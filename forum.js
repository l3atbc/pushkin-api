const express = require('express');
const channelName = 'forum_rpc_worker';
const CONFIG = require('./config.js');

module.exports = (rpc, conn, dbwrite) => {
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
  router.get('/forumPosts/:id', (req, res, next) => {
    var rpcInput = {
      method: 'findForumPost',
      params: [req.params.id]
    };
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  if (CONFIG.auth) {
    const checkJWT = require('./authMiddleware').verify;
    router.post('/forumPosts', checkJWT, (req, res, next) => {
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
    router.post('/forumComments', checkJWT, (req, res, next) => {
      var rpcInput = {
        method: 'createForumComment',
        params: [
          {
            auth0_id: req.body.auth0_id,
            responses: req.body.responses,
            created_at: req.body.created_at,
            post_id: req.body.post_id
          }
        ]
      };
      return rpc(conn, channelName, rpcInput)
        .then(data => {
          res.json(data);
        })
        .catch(next);
    });
  }
  return router;
};
