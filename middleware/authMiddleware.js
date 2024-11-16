const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responseUtils');

/**
 * Verify the Authorization token from the request headers.
 * If the token is valid, decoded user payload will be attached to the request object as req.user.
 * If the token is invalid, expired, or missing, an appropriate error response will be sent.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {function} next - The next middleware function.
 */
exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json(errorResponse('Authorization token is required'));
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json(errorResponse('Token must be prefixed with "Bearer"'));
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json(errorResponse('Invalid or expired token'));
    }
    req.user = decoded;
    next();
  });
};
