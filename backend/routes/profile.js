const express = require('express');
const router = express.Router();
const abdmClient = require('../utils/abdm');
const { verifyToken } = require('../middleware/auth');
const { ENDPOINTS } = require('../config/constants');
const { validateABHAAddress, validateOTP } = require('../utils/validators');
const { encryptWithPublicKey } = require('../utils/encryption');

/**
 * GET /api/profile
 * Get user profile details (requires X-token)
 */
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const response = await abdmClient.get(
      ENDPOINTS.GET_PROFILE,
      { 'X-Token': `Bearer ${req.userToken}` }
    );

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/profile/card
 * Download ABHA card (requires X-token)
 */
router.get('/card', verifyToken, async (req, res, next) => {
  try {
    // Fetch binary and return as base64 so frontend can safely render/download
    const { buffer, contentType } = await abdmClient.getBinary(
      ENDPOINTS.DOWNLOAD_CARD,
      { 'X-Token': `Bearer ${req.userToken}` }
    );

    const base64 = buffer.toString('base64');

    res.json({
      success: true,
      data: {
        card: base64,
        mimeType: contentType,
        message: 'ABHA card fetched successfully'
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
