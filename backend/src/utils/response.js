/**
 * Sends a successful JSON response
 * @param {Object} res - Express response object
 * @param {String} message - Custom message
 * @param {Object} [data={}] - Additional key-values to include in the payload
 * @param {Number} [status=200] - HTTP status code
 */
const successResponse = (res, message, data = {}, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    ...data
  });
};

/**
 * Sends an error JSON response
 * @param {Object} res - Express response object
 * @param {String} message - Error message summary
 * @param {Error|String} [error=null] - Detailed error details
 * @param {Number} [status=500] - HTTP status code
 */
const errorResponse = (res, message, error = null, status = 500) => {
  const responsePayload = {
    success: false,
    message
  };

  if (error) {
    responsePayload.error = typeof error === 'object' ? error.message || String(error) : error;
  }

  return res.status(status).json(responsePayload);
};

module.exports = {
  successResponse,
  errorResponse
};
