// Vercel Serverless Function entry for Express app
// Export a handler that delegates to the Express app
const app = require('../server');

module.exports = (req, res) => app(req, res);
