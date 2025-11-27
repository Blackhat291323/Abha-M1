const express = require('express');
const router = express.Router();
const abdmClient = require('../utils/abdm');
const { encryptAadhaar, encryptOTP } = require('../utils/encryption');
const { validateAadhaar, validateOTP, validateMobile, validateTxnId, validateABHAAddress } = require('../utils/validators');
const { ENDPOINTS, SCOPES, OTP, CONSENT } = require('../config/constants');

/**
 * POST /api/enrollment/send-otp
 * Send OTP to Aadhaar-linked mobile number
 */
router.post('/send-otp', async (req, res, next) => {
  try {
    const { aadhaar } = req.body;

    // Validate Aadhaar
    const validation = validateAadhaar(aadhaar);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.message
        }
      });
    }

    // Encrypt Aadhaar
    const encryptedAadhaar = encryptAadhaar(validation.aadhaar);

    // Send OTP request
    const response = await abdmClient.post(ENDPOINTS.SEND_OTP, {
      txnId: '',
      scope: SCOPES.ENROL,
      loginHint: OTP.LOGIN_HINT,
      loginId: encryptedAadhaar,
      otpSystem: OTP.SYSTEM
    });

    res.json({
      success: true,
      data: {
        txnId: response.txnId,
        message: 'OTP sent to your Aadhaar-linked mobile number'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/enrollment/verify-otp
 * Verify OTP and create ABHA account
 */
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { txnId, otp, mobile } = req.body;

    // Validate inputs
    const txnValidation = validateTxnId(txnId);
    if (!txnValidation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: txnValidation.message }
      });
    }

    const otpValidation = validateOTP(otp);
    if (!otpValidation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: otpValidation.message }
      });
    }

    // Mobile should NOT be mandatory at this step per spec; verify later if needed
    let mobileValidation = { valid: false, mobile: null };
    if (mobile) {
      mobileValidation = validateMobile(mobile);
      if (!mobileValidation.valid) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: mobileValidation.message }
        });
      }
    }

    // Encrypt OTP
    const encryptedOTP = encryptOTP(otpValidation.otp);

    // Verify OTP and create ABHA
    const response = await abdmClient.post(ENDPOINTS.VERIFY_OTP, {
      authData: {
        authMethods: ['otp'],
        otp: {
          txnId: txnValidation.txnId,
          otpValue: encryptedOTP,
          // Do not send mobile unless provided and valid
          ...(mobileValidation.valid ? { mobile: mobileValidation.mobile } : {})
        }
      },
      consent: {
        code: CONSENT.CODE,
        version: CONSENT.VERSION
      }
    });

    // Log the full response for debugging
    console.log('🔍 ABDM enrol/byAadhaar response:', JSON.stringify(response, null, 2));

    // Check if ABHA already exists in the response
    // ABDM returns existing ABHA details - check both root and ABHAProfile
    const hasToken = !!(response.tokens?.token);
    const hasAbhaNumber = !!(
      response.ABHANumber || 
      response.healthIdNumber || 
      response.ABHAProfile?.ABHANumber ||
      response.ABHAProfile?.healthIdNumber
    );
    const hasAbhaAddress = !!(
      response.preferredAbhaAddress || 
      response.healthId ||
      response.ABHAProfile?.preferredAddress ||
      response.ABHAProfile?.phrAddress?.[0]
    );
    const abhaExists = (response.isNew === false) || (hasToken && (hasAbhaNumber || hasAbhaAddress));
    
    console.log('🔍 ABHA exists check:', {
      hasToken,
      hasAbhaNumber,
      hasAbhaAddress,
      isNew: response.isNew,
      abhaExists,
      rootABHANumber: response.ABHANumber,
      profileABHANumber: response.ABHAProfile?.ABHANumber,
      rootAddress: response.preferredAbhaAddress,
      profileAddress: response.ABHAProfile?.preferredAddress
    });
    
    res.json({
      success: true,
      data: {
        txnId: response.txnId,
        token: response.tokens?.token,
        refreshToken: response.tokens?.refreshToken,
        expiresIn: response.tokens?.expiresIn,
        abhaExists: abhaExists,
        abhaNumber: response.ABHANumber || response.healthIdNumber || response.ABHAProfile?.ABHANumber,
        abhaAddress: response.preferredAbhaAddress || response.healthId || response.ABHAProfile?.preferredAddress || response.ABHAProfile?.phrAddress?.[0],
        mobile: response.mobile || response.ABHAProfile?.mobile,
        mobileVerified: response.mobileVerified || response.ABHAProfile?.mobileVerified,
        new: response.new || response.isNew,
        message: abhaExists 
          ? 'ABHA already exists for this Aadhaar. Showing your existing profile.' 
          : 'OTP verified successfully. ABHA account created.'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/enrollment/mobile/send-otp
 * Send OTP to communication mobile (post Aadhaar verification)
 */
router.post('/mobile/send-otp', async (req, res, next) => {
  try {
    const { txnId, mobile } = req.body;

    const txnValidation = validateTxnId(txnId);
    if (!txnValidation.valid) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: txnValidation.message } });
    }

    const mobileValidation = validateMobile(mobile);
    if (!mobileValidation.valid) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: mobileValidation.message } });
    }

    // Encrypt mobile via Aadhaar public key path (same RSA-OAEP util)
    const { encryptAadhaar } = require('../utils/encryption');
    const encryptedMobile = encryptAadhaar(mobileValidation.mobile);

    const response = await abdmClient.post(ENDPOINTS.SEND_OTP, {
      txnId: txnValidation.txnId,
      scope: SCOPES.MOBILE_VERIFY,
      loginHint: 'mobile',
      loginId: encryptedMobile,
      otpSystem: 'abdm'
    });

    res.json({ success: true, data: { txnId: response.txnId, message: 'Mobile OTP sent successfully' } });
  } catch (error) { next(error); }
});

/**
 * POST /api/enrollment/mobile/verify-otp
 * Verify communication mobile via `/v3/enrollment/auth/byAbdm`
 */
router.post('/mobile/verify-otp', async (req, res, next) => {
  try {
    const { txnId, otp } = req.body;

    const txnValidation = validateTxnId(txnId);
    if (!txnValidation.valid) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: txnValidation.message } });
    }

    const otpValidation = validateOTP(otp);
    if (!otpValidation.valid) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: otpValidation.message } });
    }

    const encryptedOTP = encryptOTP(otpValidation.otp);

    const response = await abdmClient.post('/abha/api/v3/enrollment/auth/byAbdm', {
      scope: SCOPES.MOBILE_VERIFY,
      authData: {
        authMethods: ['otp'],
        otp: {
          timeStamp: new Date().toISOString(),
          txnId: txnValidation.txnId,
          otpValue: encryptedOTP
        }
      }
    });

    res.json({ success: true, data: { txnId: response.txnId, message: 'Mobile verified successfully' } });
  } catch (error) { next(error); }
});

/**
 * GET /api/enrollment/address-suggestions
 * Get ABHA address suggestions
 */
router.get('/address-suggestions', async (req, res, next) => {
  try {
    const { txnId } = req.query;

    const validation = validateTxnId(txnId);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validation.message }
      });
    }

    const response = await abdmClient.get(
      ENDPOINTS.ADDRESS_SUGGESTIONS,
      { 'Transaction_Id': validation.txnId }
    );

    res.json({
      success: true,
      data: {
        suggestions: response.abhaAddressList || [],
        message: 'Address suggestions fetched successfully'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/enrollment/create-address
 * Create and assign ABHA address
 */
router.post('/create-address', async (req, res, next) => {
  try {
    const { txnId, abhaAddress, preferred = 1 } = req.body;

    const txnValidation = validateTxnId(txnId);
    if (!txnValidation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: txnValidation.message }
      });
    }

    const addressValidation = validateABHAAddress(abhaAddress);
    if (!addressValidation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: addressValidation.message }
      });
    }

    const response = await abdmClient.post(ENDPOINTS.CREATE_ADDRESS, {
      txnId: txnValidation.txnId,
      abhaAddress: addressValidation.address,
      preferred: preferred
    });

    res.json({
      success: true,
      data: {
        abhaAddress: response.healthIdNumber || response.ABHANumber,
        abhaNumber: response.healthId || response.preferredAbhaAddress,
        txnId: response.txnId,
        token: response.tokens?.token,
        message: 'ABHA address created successfully'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/enrollment/check-address-availability
 * Check if ABHA address is available (real-time validation)
 */
router.get('/check-address-availability', async (req, res, next) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Address parameter required' }
      });
    }

    const validation = validateABHAAddress(address);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        available: false,
        error: { code: 'VALIDATION_ERROR', message: validation.message }
      });
    }

    // Check if address exists using ABDM API
    const endpoint = `${ENDPOINTS.VERIFY_ADDRESS}?healthId=${validation.address}`;
    
    try {
      const response = await abdmClient.get(endpoint);
      const exists = response.status === 'true' || response.status === true || response === true;
      
      res.json({
        success: true,
        available: !exists,
        message: exists ? 'This ABHA Address is already taken.' : 'ABHA Address is available!'
      });
    } catch (error) {
      // If error is 404 or "not found", address is available
      if (error.status === 404 || error.code === '404') {
        return res.json({
          success: true,
          available: true,
          message: 'ABHA Address is available!'
        });
      }
      
      // For other errors, return a generic message instead of exposing technical details
      return res.status(500).json({
        success: false,
        available: null,
        error: { 
          code: 'CHECK_FAILED', 
          message: 'Could not verify address availability. Please try again.' 
        }
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
