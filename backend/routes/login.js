const express = require('express');
const router = express.Router();
const abdmClient = require('../utils/abdm');
const { validateAadhaar, validateOTP, validateMobile } = require('../utils/validators');
const { encryptWithPublicKey } = require('../utils/encryption');

/**
 * POST /api/login/send-otp
 * Send OTP to existing ABHA holder's Aadhaar-linked mobile
 */
router.post('/send-otp', async (req, res, next) => {
  try {
    const { aadhaar } = req.body;

    const validation = validateAadhaar(aadhaar);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validation.message }
      });
    }

    const encryptedAadhaar = await encryptWithPublicKey(validation.aadhaar);

    // Use Profile Login OTP request for login flows - using Aadhaar
    const response = await abdmClient.post('/abha/api/v3/profile/login/request/otp', {
      scope: ['abha-login', 'aadhaar-verify'],
      loginHint: 'aadhaar',
      loginId: encryptedAadhaar,
      otpSystem: 'aadhaar'
    });

    res.json({
      success: true,
      data: {
        txnId: response.txnId,
        message: 'OTP sent to your Aadhaar-linked mobile'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/login/verify-otp
 * Verify OTP and login existing ABHA user
 */
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { txnId, otp } = req.body;

    if (!txnId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Transaction ID is required' }
      });
    }

    const otpValidation = validateOTP(otp);
    if (!otpValidation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: otpValidation.message }
      });
    }

    const encryptedOtp = await encryptWithPublicKey(otpValidation.otp);
    
    // Use ABHA profile login endpoint for existing users
    const requestBody = {
      scope: ['abha-login', 'aadhaar-verify'],
      authData: {
        authMethods: ['otp'],
        otp: {
          txnId: txnId,
          otpValue: encryptedOtp
        }
      }
    };

    const response = await abdmClient.post('/abha/api/v3/profile/login/verify', requestBody);

    // For login, tokens indicate success; profile fields may be present
    const hasAbhaNumber = !!(response.ABHANumber || response.healthIdNumber);
    const hasAbhaAddress = !!(response.preferredAbhaAddress || response.healthId);
    const token = response.token || response.tokens?.token;
    const refreshToken = response.refreshToken || response.tokens?.refreshToken;
    const abhaExists = hasAbhaNumber || hasAbhaAddress || !!token;

    res.json({
      success: true,
      data: {
        txnId: response.txnId,
        token,
        refreshToken,
        abhaExists,
        abhaNumber: response.ABHANumber || response.healthIdNumber,
        abhaAddress: response.preferredAbhaAddress || response.healthId,
        message: abhaExists ? 'Login successful!' : 'ABHA not found. Please enroll first.'
      }
    });
  } catch (error) {
    console.error('❌ Login verify-otp error:', error);
    next(error);
  }
});

module.exports = router;
