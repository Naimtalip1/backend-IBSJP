const jwt = require('jsonwebtoken');
const constants = require('../constants.js');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: constants.MESSAGES.UNAUTHORIZED });
  }
  
  jwt.verify(token, constants.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: constants.MESSAGES.INVALID_TOKEN });
    }
    req.user = user;
    next();
  });
};

/**
 * Middleware to check if user has admin role
 */
const requireAdmin = (req, res, next) => {
  if (req.user.email !== constants.ADMIN_EMAIL) {
    return res.status(403).json({ error: constants.MESSAGES.ADMIN_REQUIRED });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin
};
