/**
 * Middleware to verify tokens for protected routes
 */
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers['x-token'] || req.headers['authorization'];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authentication token required'
        }
      });
    }

    // Extract Bearer token
    const bearerToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    
    // Attach token to request for further use
    req.userToken = bearerToken;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      }
    });
  }
};

module.exports = { verifyToken };
