const { errorResponse } = require("../utils/response");

/**
 * Centralized global Express error handler middleware
 */
const errorMiddleware = (err, req, res, next) => {
  console.error("Express App Error Handler ❌:", err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return errorResponse(res, message, err, status);
};

module.exports = errorMiddleware;
