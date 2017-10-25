const request = require('request');
const express = require('express');
require('dotenv').config();

module.exports = () => {
  const router = new express.Router();
  router.get('/getAuth0User', (req, res, next) => {
    const options = {
      url: `https://gww.auth0.com/api/v2/users/${req.query.auth0_id}`,
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + process.env.SECRET
      }
    };
    return new Promise((resolve, reject) => {
      request(options, function(err, result, body) {
        let json = JSON.parse(body);
        resolve(json);
      });
    })
      .then(data => {
        res.json(data.user_metadata);
      })
      .catch(next);
  });
  return router;
};
