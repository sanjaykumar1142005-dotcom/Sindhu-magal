/**
 * Basic authentication middleware template.
 * Currently serves as a request pass-through but can be expanded for session/JWT verification.
 */
const authMiddleware = (req, res, next) => {
  next();
};

module.exports = authMiddleware;
