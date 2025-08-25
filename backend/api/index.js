const serverless = require('serverless-http');
const app = require('../server');

module.exports = (req, res) => {
  const handler = serverless(app);
  return handler(req, res);
};
