const serverless = require('serverless-http');
const app = require('../server');

// Catch-all to route all /api/* requests to Express
module.exports = serverless(app);
