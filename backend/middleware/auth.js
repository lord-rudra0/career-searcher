const jwt = require('jsonwebtoken');

// Accept tokens signed either as { id, username } (server.js)
// or as { user: { id } } (routes/auth.js)
const verifyToken = (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Align secret fallback with server.js to avoid invalid signature during local dev
    const secret = process.env.JWT_SECRET || 'your_default_jwt_secret';
    const decoded = jwt.verify(token, secret);

    const userId = decoded?.user?.id || decoded?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Token payload missing user id' });
    }

    req.user = { id: userId };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = { verifyToken };