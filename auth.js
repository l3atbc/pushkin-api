const express = require('express');
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const jwtAuthz = require('express-jwt-authz');
require('dotenv').config();

module.exports = {
  verify: jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: process.env.JWKS_URI
    }),
    aud: process.env.AUDIENCE,
    issuer: process.env.ISSUER,
    algorithms: ['RS256']
  })
};
