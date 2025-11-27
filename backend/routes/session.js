const express = require('express');
const router = express.Router();
const abdmClient = require('../utils/abdm');

/**
 * GET /api/session/token
 * Get or refresh access token
 */
router.get('/token', async (req, res, next) => {
  try {
    const token = await abdmClient.getAccessToken();
    
    res.json({
      success: true,
      data: {
        accessToken: token,
        message: 'Access token obtained successfully'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/session/health
 * Check ABDM API connectivity
 */
router.get('/health', async (req, res, next) => {
  try {
    await abdmClient.getAccessToken();
    
    res.json({
      success: true,
      message: 'ABDM API is reachable'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
