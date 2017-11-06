const express = require('express');
const channelName = 'forum_rpc_worker';
const CONFIG = require('./config.js');

module.exports = (rpc, conn, dbwrite) => {
  const router = new express.Router();
  router.get('/forumPosts', (req, res, next) => {
    var rpcInput = {
      method: 'allForumPosts',
      params: []
    };
    return rpc(conn, channelName, rpcInput)
      .then(data => {
        res.json(data);
      })
      .catch(next);
  });
  router.get('/userForumPosts/:auth0Id', (req, res, next) => {
    var postRpcInput = {
      method: 'queryForumPost',
      params: [[['where', 'auth0_id', '=', req.params.auth0Id]]]
    };
    var commentRpcInput = {
      method: 'queryForumComment',
      params: [[['where', 'auth0_id', '=', req.params.auth0Id]]]
    };
    return rpc(conn, channelName, postRpcInput)
      .then(posts => {
        return rpc(conn, channelName, commentRpcInput).then(comments => {
          const postIds = posts.map(post => {
            return post.id;
          });
          const commentPostIds = comments
            .map(comment => {
              return comment.post_id;
            })
            .filter(Boolean);
          const combine = [...postIds, ...commentPostIds]
            .filter((id, index, self) => {
              return index === self.indexOf(id);
            })
            .sort();
          const combineRpcInput = {
            method: 'queryForumPost',
            params: [[['where', 'id', 'in', combine]]]
          };
          return rpc(conn, channelName, postRpcInput).then(data => {
            res.json(data);
          });
        });
        res.json(data);
      })
      .catch(next);
  });
  router.get('/forumPosts/:id', (req, res, next) => {
    var rpcInput = {
      method: 'findForumPost',
      params: [req.params.id, ['forumComments']]
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
            stim: req.body.stim,
            quiz: req.body.quiz,
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
