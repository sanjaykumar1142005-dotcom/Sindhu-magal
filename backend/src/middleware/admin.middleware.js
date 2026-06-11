const { errorResponse } = require("../utils/response");

/**
 * Middleware to protect administrative routes by checking the Authorization header token.
 */
const adminMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  const expectedToken = process.env.ADMIN_TOKEN || "abc123";

  if (token !== expectedToken) {
    return errorResponse(res, "Unauthorized", null, 403);
  }

  next();
};

module.exports = adminMiddleware;
