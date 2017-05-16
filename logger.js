const winston = require('winston');
require('winston-loggly');

const transport = new winston.transports.Loggly({
  token: process.env.LOGGLY_TOKEN,
  subdomain: 'l3atbc',
  tags: ['Winston-NodeJS', 'api'],
  json: true
});
const logger = new winston.Logger({
  transports: [transport]
});
module.exports = logger;
