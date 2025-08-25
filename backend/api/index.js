// Vercel Serverless Function entry for Express app
// Ensure dependencies installed under backend/ are resolvable in serverless
const path = require('path');
const Module = require('module');
process.env.NODE_PATH = path.join(__dirname, '..', 'node_modules');
Module._initPaths();

// Export a handler that delegates to the Express app
const app = require('../server');
module.exports = (req, res) => app(req, res);
