const express = require('express');
const router = express.Router();
const abdmClient = require('../utils/abdm');
const { validateABHAAddress, validateOTP, validateABHANumber, validateMobile } = require('../utils/validators');
const { encryptWithPublicKey } = require('../utils/encryption');
/**
 * POST /api/search/verify/send-otp
 * Send OTP for ABHA verification by address (facility-side verification)
 */
router.post('/verify/send-otp', async (req, res, next) => {
  try {
    const { abhaAddress } = req.body;
    const validation = validateABHAAddress(abhaAddress);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: validation.message } });
    }

    const encryptedAddress = encryptWithPublicKey(validation.address);

    const response = await abdmClient.post('/abha/api/v3/profile/verify/request/otp', {
      scope: ['abha-verify'],
      loginHint: 'abha-address',
      loginId: encryptedAddress,
      otpSystem: 'abdm'
    });

    res.json({ success: true, data: { txnId: response.txnId, message: 'Verification OTP sent' } });
  } catch (error) { next(error); }
});

/**
 * POST /api/search/verify/confirm
 * Verify ABHA by OTP (facility-side) using txnId from send-otp
 */
router.post('/verify/confirm', async (req, res, next) => {
  try {
    const { txnId, otp } = req.body;
    if (!txnId) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Transaction ID is required' } });
    const otpValidation = validateOTP(otp);
    if (!otpValidation.valid) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: otpValidation.message } });
    }
    const encryptedOtp = encryptWithPublicKey(otpValidation.otp);

    const response = await abdmClient.post('/abha/api/v3/profile/verify/otp', {
      scope: ['abha-verify'],
      authData: {
        authMethods: ['otp'],
        otp: {
          txnId,
          otpValue: encryptedOtp
        }
      }
    });

    res.json({ success: true, data: { verified: true, message: 'ABHA verified successfully', details: response } });
  } catch (error) { next(error); }
});

/**
 * POST /api/search/by-address
 * Search ABHA by Health ID / ABHA Address
 */
router.post('/by-address', async (req, res, next) => {
  try {
    const { abhaAddress } = req.body;

    const validation = validateABHAAddress(abhaAddress);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validation.message }
      });
    }

    // Construct the endpoint with query parameter
    const endpoint = `${require('../config/constants').ENDPOINTS.SEARCH_BY_ADDRESS}?healthId=${validation.address}`;
    
    try {
      // Search endpoints need authentication but no user token
      const response = await abdmClient.get(endpoint, null, { useAccessToken: true });
      res.json({
        success: true,
        found: true,
        data: response
      });
    } catch (error) {
      // 404 means address not found - this is a valid response
      if (error.status === 404 || error.code === '404') {
        return res.json({
          success: true,
          found: false,
          message: 'No ABHA account found with this address'
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/search/by-number
 * Search ABHA by ABHA Number (14 digits)
 */
router.post('/by-number', async (req, res, next) => {
  try {
    const { abhaNumber } = req.body;

    const validation = validateABHANumber(abhaNumber);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validation.message }
      });
    }

    // For ABHA number search, we might need to use a different endpoint
    // Using the same search endpoint with healthIdNumber parameter
    const endpoint = `/abha/api/v3/search/searchByHealthIdNumber?healthIdNumber=${validation.number}`;
    
    try {
      const response = await abdmClient.get(endpoint);
      res.json({
        success: true,
        found: true,
        data: response
      });
    } catch (error) {
      // 404 means number not found - this is a valid response
      if (error.status === 404 || error.code === '404') {
        return res.json({
          success: true,
          found: false,
          message: 'No ABHA account found with this number'
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/search/by-mobile
 * Search ABHA accounts linked to mobile number
 */
router.post('/by-mobile', async (req, res, next) => {
  try {
    const { mobile } = req.body;

    const validation = validateMobile(mobile);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validation.message }
      });
    }

    // Mobile search endpoint
    const endpoint = `/abha/api/v3/search/searchByMobile?mobile=${validation.mobile}`;
    
    try {
      const response = await abdmClient.get(endpoint);
      res.json({
        success: true,
        found: true,
        data: response
      });
    } catch (error) {
      // 404 means no ABHA accounts linked to this mobile - this is a valid response
      if (error.status === 404 || error.code === '404') {
        return res.json({
          success: true,
          found: false,
          message: 'No ABHA accounts found for this mobile number'
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/search/verify-address
 * Check if ABHA Address exists/is available
 */
router.post('/verify-address', async (req, res, next) => {
  try {
    const { abhaAddress } = req.body;

    const validation = validateABHAAddress(abhaAddress);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validation.message }
      });
    }

    const endpoint = `${require('../config/constants').ENDPOINTS.VERIFY_ADDRESS}?healthId=${validation.address}`;
    
    const response = await abdmClient.get(endpoint);

    res.json({
      success: true,
      data: {
        exists: response.status === 'true' || response === true,
        message: response.status === 'true' ? 'ABHA Address exists' : 'ABHA Address is available'
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
