// Vercel Serverless Function entry for Express app
// Exports the Express app; @vercel/node will treat this as the handler.
const app = require('../server');

module.exports = app;
