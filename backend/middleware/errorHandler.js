/**
 * Map ABDM error codes to user-friendly messages
 */
const ABDM_ERROR_MESSAGES = {
  'ABDM-1017': 'Invalid transaction ID. Please start the process again.',
  'ABDM-1204': 'Invalid or expired OTP. Please try again.',
  'ABDM-1030': 'Invalid request ID. Please refresh and try again.',
  'ABDM-1008': 'ABHA already exists for this Aadhaar number.',
  'ABDM-1009': 'This ABHA Address is already taken. Please try another.',
  'ABDM-1401': 'Session expired. Please start again.',
  'ABDM-1005': 'Maximum OTP attempts reached. Please try after some time.',
  '900901': 'Authentication failed. Please check your credentials.',
  'HIS-400': 'Invalid data provided. Please check your input.',
  'HIS-401': 'Unauthorized access.',
  'HIS-422': 'ABHA Address already exists. Please create with unique ABHA address.',
  'HIS-1000': 'ABHA Number already exists for this Aadhaar.',
  'loginId': 'Invalid Aadhaar number format.',
  'loginHint': 'Invalid login method.',
  'authMethod': 'Invalid authentication method.',
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Handle ABDM API errors
  if (err.status && err.message) {
    const errorCode = err.code || 'API_ERROR';
    const userMessage = ABDM_ERROR_MESSAGES[errorCode] || err.message;
    
    return res.status(err.status).json({
      success: false,
      error: {
        code: errorCode,
        message: userMessage,
        details: err.details
      }
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message
      }
    });
  }

  // Handle generic errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message: message
    }
  });
};

module.exports = errorHandler;
