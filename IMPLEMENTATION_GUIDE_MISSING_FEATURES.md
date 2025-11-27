# Implementation Guide: Missing M1 Features

This guide provides step-by-step instructions for implementing the optional features identified in the audit.

---

## Feature 1: Mobile Verification Flow

**Priority:** 🟡 Important  
**Effort:** 2-3 hours  
**Spec Reference:** PDF Pages 22-25 (§3.0 Step 4)

### Why This Feature?
When the user's communication mobile number is different from their Aadhaar-linked mobile, ABDM requires separate verification of the new mobile number.

### Backend Implementation

**File:** `backend/routes/enrollment.js`

Add these two endpoints:

```javascript
// Send OTP to mobile for verification
router.post('/send-mobile-otp', validateSchema(schemas.sendMobileOTP), async (req, res, next) => {
  try {
    const { txnId, mobile } = req.body;
    
    // Validate inputs
    const txnValidation = validators.validateTxnId(txnId);
    if (!txnValidation.valid) {
      return res.status(400).json({ error: txnValidation.error });
    }
    
    const mobileValidation = validators.validateMobile(mobile);
    if (!mobileValidation.valid) {
      return res.status(400).json({ error: mobileValidation.error });
    }
    
    // Encrypt mobile number
    const encryptedMobile = encryption.encryptWithPublicKey(mobile);
    
    // Send OTP request with mobile-verify scope
    const response = await abdmClient.post(ENDPOINTS.SEND_OTP, {
      txnId: txnId,
      scope: SCOPES.MOBILE_VERIFY,  // ["abha-enrol", "mobile-verify"]
      loginHint: 'mobile',
      loginId: encryptedMobile,
      otpSystem: 'abdm'  // Note: 'abdm', not 'aadhaar'
    });
    
    res.json({
      success: true,
      message: 'Mobile OTP sent successfully',
      txnId: response.txnId,
      mobile: mobile
    });
  } catch (error) {
    next(error);
  }
});

// Verify mobile OTP
router.post('/verify-mobile-otp', validateSchema(schemas.verifyMobileOTP), async (req, res, next) => {
  try {
    const { txnId, otp } = req.body;
    
    // Validate inputs
    const txnValidation = validators.validateTxnId(txnId);
    if (!txnValidation.valid) {
      return res.status(400).json({ error: txnValidation.error });
    }
    
    const otpValidation = validators.validateOTP(otp);
    if (!otpValidation.valid) {
      return res.status(400).json({ error: otpValidation.error });
    }
    
    // Encrypt OTP
    const encryptedOTP = encryption.encryptOTP(otp);
    
    // Get current timestamp in required format
    const timeStamp = new Date().toISOString()
      .replace('T', ' ')
      .substring(0, 19); // "YYYY-MM-DD HH:mm:ss"
    
    // Verify mobile OTP - uses different endpoint!
    const response = await abdmClient.post('/abha/api/v3/enrollment/auth/byAbdm', {
      scope: SCOPES.MOBILE_VERIFY,
      authData: {
        authMethods: ['otp'],
        otp: {
          timeStamp: timeStamp,  // Required for mobile verification
          txnId: txnId,
          otpValue: encryptedOTP
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Mobile verified successfully',
      txnId: response.txnId,
      mobileVerified: true
    });
  } catch (error) {
    next(error);
  }
});
```

### Frontend Implementation

**File:** `frontend/js/enrollment.js`

Add mobile verification step after successful Aadhaar OTP verification:

```javascript
// Add to enrollmentState
const enrollmentState = {
  step: 'aadhaar',
  aadhaar: '',
  txnId: '',
  mobile: '',
  mobileVerified: false,  // New
  otpSentToMobile: false, // New
  abhaAddress: '',
  token: '',
  abhaNumber: ''
};

// Modify verifyOTP function to check if mobile verification needed
async function verifyOTP() {
  try {
    showLoading(true);
    
    const result = await apiRequest('/enrollment/verify-otp', 'POST', {
      txnId: enrollmentState.txnId,
      otp: document.getElementById('enrollOtpInput').value,
      mobile: enrollmentState.mobile
    });
    
    if (result.abhaExists) {
      // Existing ABHA logic...
    } else {
      // New ABHA - check if mobile verification needed
      const aadhaarMobile = result.ABHAProfile?.mobile;
      const enteredMobile = enrollmentState.mobile;
      
      if (aadhaarMobile && enteredMobile && aadhaarMobile !== enteredMobile) {
        // Mobile is different - need verification
        showMobileVerificationStep();
      } else {
        // Mobile same or not provided - continue to address
        enrollmentState.step = 'address';
        enrollmentState.txnId = result.txnId;
        showAddressStep();
      }
    }
  } catch (error) {
    showError('Failed to verify OTP');
  } finally {
    showLoading(false);
  }
}

// New function: Show mobile verification UI
function showMobileVerificationStep() {
  document.getElementById('otpVerificationSection').style.display = 'none';
  
  const mobileSection = document.createElement('div');
  mobileSection.id = 'mobileVerificationSection';
  mobileSection.innerHTML = `
    <h3>Verify Mobile Number</h3>
    <p>Your entered mobile (${enrollmentState.mobile}) is different from Aadhaar-linked mobile.</p>
    <p>Please verify your mobile to continue.</p>
    <button onclick="sendMobileOTP()" class="primary-button">Send OTP to Mobile</button>
    
    <div id="mobileOtpInput" style="display: none;">
      <input type="text" maxlength="6" placeholder="Enter OTP">
      <button onclick="verifyMobileOTP()">Verify Mobile</button>
    </div>
  `;
  
  document.getElementById('enrollmentForm').appendChild(mobileSection);
}

// New function: Send mobile OTP
async function sendMobileOTP() {
  try {
    showLoading(true);
    
    const result = await apiRequest('/enrollment/send-mobile-otp', 'POST', {
      txnId: enrollmentState.txnId,
      mobile: enrollmentState.mobile
    });
    
    enrollmentState.txnId = result.txnId;
    enrollmentState.otpSentToMobile = true;
    
    document.getElementById('mobileOtpInput').style.display = 'block';
    showToast('OTP sent to your mobile');
  } catch (error) {
    showError('Failed to send mobile OTP');
  } finally {
    showLoading(false);
  }
}

// New function: Verify mobile OTP
async function verifyMobileOTP() {
  try {
    showLoading(true);
    
    const otp = document.querySelector('#mobileOtpInput input').value;
    
    const result = await apiRequest('/enrollment/verify-mobile-otp', 'POST', {
      txnId: enrollmentState.txnId,
      otp: otp
    });
    
    enrollmentState.txnId = result.txnId;
    enrollmentState.mobileVerified = true;
    
    // Continue to address step
    enrollmentState.step = 'address';
    showAddressStep();
  } catch (error) {
    showError('Failed to verify mobile OTP');
  } finally {
    showLoading(false);
  }
}
```

### Testing

1. Create ABHA with Aadhaar-linked mobile: Should skip mobile verification
2. Create ABHA with different mobile: Should show mobile verification step
3. Verify OTP is received on the new mobile number
4. Complete verification and proceed to address creation

---

## Feature 2: ABHA Verification by OTP

**Priority:** 🟡 Important  
**Effort:** 2-3 hours  
**Spec Reference:** PDF Pages 213-228 (§14.0)

### Why This Feature?
Health facilities need to verify a patient's ABHA before providing services. This feature allows verification using OTP sent to the ABHA holder's mobile.

### Backend Implementation

**File:** Create `backend/routes/verification.js`

```javascript
const express = require('express');
const router = express.Router();
const { ABDMClient } = require('../utils/abdm');
const encryption = require('../utils/encryption');
const validators = require('../utils/validators');

const abdmClient = new ABDMClient();

// Step 1: Initiate ABHA verification
router.post('/init', async (req, res, next) => {
  try {
    const { abhaAddress } = req.body;
    
    // Validate ABHA Address
    const validation = validators.validateABHAAddress(abhaAddress);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    // Request OTP for verification (PDF Page 218)
    const response = await abdmClient.post('/abha/api/v3/profile/account/request/otp', {
      scope: ['abha-login'],
      loginHint: 'abha-address',
      loginId: abhaAddress,
      otpSystem: 'abdm'
    });
    
    res.json({
      success: true,
      message: 'OTP sent for ABHA verification',
      txnId: response.txnId,
      abhaAddress: abhaAddress
    });
  } catch (error) {
    next(error);
  }
});

// Step 2: Verify OTP and complete verification
router.post('/verify', async (req, res, next) => {
  try {
    const { txnId, otp, abhaAddress } = req.body;
    
    // Validate inputs
    const txnValidation = validators.validateTxnId(txnId);
    if (!txnValidation.valid) {
      return res.status(400).json({ error: txnValidation.error });
    }
    
    const otpValidation = validators.validateOTP(otp);
    if (!otpValidation.valid) {
      return res.status(400).json({ error: otpValidation.error });
    }
    
    // Encrypt OTP
    const encryptedOTP = encryption.encryptOTP(otp);
    
    // Verify OTP (PDF Page 223)
    const response = await abdmClient.post('/abha/api/v3/profile/login/request/otp', {
      scope: ['abha-login'],
      loginHint: 'abha-address',
      authData: {
        authMethods: ['otp'],
        otp: {
          txnId: txnId,
          otpValue: encryptedOTP
        }
      }
    });
    
    res.json({
      success: true,
      message: 'ABHA verified successfully',
      token: response.tokens.token,
      profile: response.ABHAProfile,
      verified: true
    });
  } catch (error) {
    next(error);
  }
});

// Step 3: Get profile after verification
router.get('/profile', async (req, res, next) => {
  try {
    const xToken = req.headers['x-token'];
    
    if (!xToken) {
      return res.status(401).json({ error: 'X-Token required' });
    }
    
    const response = await abdmClient.get(
      '/abha/api/v3/profile/account',
      { 'X-Token': xToken }
    );
    
    res.json({
      success: true,
      profile: response
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

**File:** `backend/server.js` - Add route

```javascript
const verificationRoutes = require('./routes/verification');
app.use('/api/verification', verificationRoutes);
```

### Frontend Implementation

**File:** Create `frontend/js/verification.js`

```javascript
const verificationState = {
  abhaAddress: '',
  txnId: '',
  verified: false,
  token: '',
  profile: null
};

// Initialize verification
async function initVerification() {
  const abhaAddress = document.getElementById('verifyAbhaAddress').value;
  
  if (!abhaAddress) {
    showError('Please enter ABHA Address');
    return;
  }
  
  try {
    showLoading(true);
    
    const result = await apiRequest('/verification/init', 'POST', {
      abhaAddress: abhaAddress
    });
    
    verificationState.abhaAddress = abhaAddress;
    verificationState.txnId = result.txnId;
    
    document.getElementById('verifyOtpSection').style.display = 'block';
    showToast('OTP sent to registered mobile');
  } catch (error) {
    showError('Failed to send OTP');
  } finally {
    showLoading(false);
  }
}

// Verify OTP
async function verifyAbhaOTP() {
  const otp = document.getElementById('verifyOtpInput').value;
  
  if (!otp) {
    showError('Please enter OTP');
    return;
  }
  
  try {
    showLoading(true);
    
    const result = await apiRequest('/verification/verify', 'POST', {
      txnId: verificationState.txnId,
      otp: otp,
      abhaAddress: verificationState.abhaAddress
    });
    
    verificationState.verified = true;
    verificationState.token = result.token;
    verificationState.profile = result.profile;
    
    displayVerifiedProfile(result.profile);
    showToast('ABHA verified successfully!');
  } catch (error) {
    showError('Failed to verify OTP');
  } finally {
    showLoading(false);
  }
}

// Display verified profile
function displayVerifiedProfile(profile) {
  const html = `
    <div class="verified-profile">
      <h3>✅ Verified ABHA Profile</h3>
      <div class="profile-details">
        <p><strong>Name:</strong> ${profile.firstName} ${profile.lastName || ''}</p>
        <p><strong>ABHA Number:</strong> ${profile.ABHANumber}</p>
        <p><strong>ABHA Address:</strong> ${profile.phrAddress[0]}</p>
        <p><strong>Mobile:</strong> ${profile.mobile}</p>
        <p><strong>DOB:</strong> ${profile.dayOfBirth}/${profile.monthOfBirth}/${profile.yearOfBirth}</p>
      </div>
    </div>
  `;
  
  document.getElementById('verificationResult').innerHTML = html;
}
```

**File:** `frontend/index.html` - Add verification tab

```html
<div class="tab" data-tab="verify">
  <h2>Verify ABHA</h2>
  
  <div id="verifyForm">
    <input type="text" 
           id="verifyAbhaAddress" 
           placeholder="Enter ABHA Address (e.g., john@abdm)">
    <button onclick="initVerification()">Send OTP</button>
  </div>
  
  <div id="verifyOtpSection" style="display: none;">
    <input type="text" 
           id="verifyOtpInput" 
           maxlength="6" 
           placeholder="Enter OTP">
    <button onclick="verifyAbhaOTP()">Verify</button>
  </div>
  
  <div id="verificationResult"></div>
</div>
```

---

## Feature 3: QR Code Generation

**Priority:** 🟢 Enhancement  
**Effort:** 3-4 hours  
**Spec Reference:** PDF Pages 149-150 (§10.0)

### Why This Feature?
Allows users to generate QR codes for their ABHA card, which can be scanned by health facilities for quick verification.

### Backend Implementation

**File:** `backend/routes/profile.js` - Add QR endpoint

```javascript
// Get QR Code
router.get('/qr-code', verifyToken, async (req, res, next) => {
  try {
    // PDF Page 149: Get QR Code
    const response = await abdmClient.get(
      '/abha/api/v3/profile/account/qr-code',
      { 'X-Token': `Bearer ${req.userToken}` }
    );
    
    // Response contains base64 PNG image
    res.json({
      success: true,
      qrCode: response  // Base64 PNG string
    });
  } catch (error) {
    next(error);
  }
});
```

### Frontend Implementation

**File:** `frontend/js/enrollment.js` or `frontend/js/login.js`

Add QR display after profile loads:

```javascript
// Add to displayProfile function
async function displayProfile() {
  // ... existing profile display code ...
  
  // Add QR code section
  try {
    const qrResult = await apiRequest('/profile/qr-code', 'GET', null, {
      'X-Token': `Bearer ${sessionStorage.getItem('userToken')}`
    });
    
    if (qrResult.qrCode) {
      const qrSection = document.createElement('div');
      qrSection.className = 'qr-section';
      qrSection.innerHTML = `
        <h3>ABHA QR Code</h3>
        <img src="data:image/png;base64,${qrResult.qrCode}" 
             alt="ABHA QR Code"
             style="max-width: 300px;">
        <p>Scan this QR code at health facilities</p>
      `;
      
      document.getElementById('profileView').appendChild(qrSection);
    }
  } catch (error) {
    console.error('Failed to load QR code:', error);
  }
}
```

---

## Testing Checklist

After implementing each feature:

### Mobile Verification
- [ ] Test with Aadhaar-linked mobile (should skip verification)
- [ ] Test with different mobile (should show verification step)
- [ ] Test OTP delivery to new mobile
- [ ] Test incorrect OTP
- [ ] Test OTP expiry

### ABHA Verification
- [ ] Test with valid ABHA Address
- [ ] Test with invalid ABHA Address
- [ ] Test OTP delivery
- [ ] Test successful verification
- [ ] Test profile display after verification

### QR Code
- [ ] Test QR generation after enrollment
- [ ] Test QR generation after login
- [ ] Test QR image display
- [ ] Test QR download (optional)
- [ ] Test QR scanning with mobile app (if available)

---

## Deployment Notes

1. **Environment Variables:** No new variables needed (uses existing ABDM credentials)
2. **Dependencies:** No new packages required
3. **Database:** No schema changes needed
4. **Backwards Compatible:** All features are additive, existing flows unchanged

---

## Support Documentation

For detailed API specs, refer to:
- **M1 Full guide.extracted.txt** - Complete API documentation
- **ABDM_M1_COMPLIANCE_AUDIT.md** - Current implementation audit
- **Official ABDM Portal:** https://sandbox.abdm.gov.in/docs
