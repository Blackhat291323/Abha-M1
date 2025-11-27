// Login flow state
let loginState = {
  txnId: null,
  token: null,
  aadhaar: null
};

// Login OTP Timer
let loginOtpTimer = null;
let loginOtpTimeRemaining = 300;

/**
 * Initialize login flow
 */
function initializeLogin() {
  // Login Aadhaar form
  const loginAadhaarForm = document.getElementById('login-aadhaar-form');
  const loginAadhaarInput = document.getElementById('login-aadhaar-input');
  
  restrictToNumbers(loginAadhaarInput);
  
  // Clear error on input
  loginAadhaarInput.addEventListener('input', () => {
    clearError('login-aadhaar-error');
  });
  
  loginAadhaarForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError('login-aadhaar-error');
    
    const aadhaar = loginAadhaarInput.value.trim();
    const validation = validateAadhaar(aadhaar);
    
    if (!validation.valid) {
      showError('login-aadhaar-error', validation.message);
      return;
    }
    
    await sendLoginOTP(validation.aadhaar);
  });

  // Login OTP form
  const loginOtpForm = document.getElementById('login-otp-form');
  const loginOtpInput = document.getElementById('login-otp-input');
  
  restrictToNumbers(loginOtpInput);
  
  // Clear errors on input
  loginOtpInput.addEventListener('input', () => {
    clearError('login-otp-error');
  });
  
  loginOtpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError('login-otp-error');
    
    const otp = loginOtpInput.value.trim();
    
    const otpValidation = validateOTP(otp);
    if (!otpValidation.valid) {
      showError('login-otp-error', otpValidation.message);
      return;
    }
    
    await verifyLoginOTP(otpValidation.otp);
  });

  // Resend Login OTP
  document.getElementById('login-resend-otp').addEventListener('click', async (e) => {
    e.preventDefault();
    if (loginState.aadhaar) {
      await sendLoginOTP(loginState.aadhaar);
    }
  });
}

/**
 * Send OTP for login
 */
async function sendLoginOTP(aadhaar) {
  const button = document.getElementById('login-send-otp-btn');
  
  try {
    setButtonLoading(button, true);
    
    const data = await apiRequest('/login/send-otp', 'POST', { aadhaar });
    
    loginState.txnId = data.txnId;
    loginState.aadhaar = aadhaar;
    
    showToast('OTP sent to your Aadhaar-linked mobile', 'success');
    
    // Hide Aadhaar form, show OTP form
    hideElement('login-aadhaar-form');
    showElement('login-otp-form');
    
    // Start OTP timer
    startLoginOTPTimer();
    
    // Focus OTP input (guard if element missing)
    const otpInputEl = document.getElementById('login-otp-input');
    if (otpInputEl && typeof otpInputEl.focus === 'function') {
      otpInputEl.focus();
    }
    
  } catch (error) {
    const errorMsg = error.message || 'Failed to send OTP';
    showError('login-aadhaar-error', errorMsg);
    showToast(errorMsg, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

/**
 * Verify OTP and login
 */
async function verifyLoginOTP(otp) {
  const button = document.getElementById('login-verify-otp-btn');
  
  try {
    setButtonLoading(button, true);
    
    console.log('🔐 Verifying login OTP...');
    const data = await apiRequest('/login/verify-otp', 'POST', {
      txnId: loginState.txnId,
      otp
    });
    
    console.log('✅ Login OTP verified:', data);
    
    loginState.txnId = data.txnId;
    loginState.token = data.token;
    
    // Stop OTP timer
    stopLoginOTPTimer();
    
    // Check if ABHA exists
    if (data.abhaExists) {
      console.log('✅ ABHA exists, logging in...');
      showToast('Login successful!', 'success');
      
      // Store token for session persistence
      if (data.token) {
        sessionStorage.setItem('abhaToken', data.token);
        sessionStorage.setItem('abhaNumber', data.abhaNumber);
        sessionStorage.setItem('abhaAddress', data.abhaAddress);
        console.log('💾 Session saved:', { token: data.token.substring(0, 20) + '...', abhaNumber: data.abhaNumber });
      }
      
      // Hide login forms
      hideElement('login-aadhaar-form');
      hideElement('login-otp-form');
      
      // Load and show profile
      console.log('📋 Loading profile...');
      await loadProfile(data.token);
      console.log('✅ Profile loaded and displayed');
    } else {
      console.log('❌ No ABHA found for this Aadhaar');
      showToast('No ABHA found. Please create a new ABHA first.', 'info');
      showError('login-otp-error', 'No ABHA account found for this Aadhaar. Please create one first.');
    }
    
  } catch (error) {
    console.error('❌ Login error:', error);
    let errorMsg = error.message || 'Failed to verify OTP';
    // If server complains about mobile while we don't collect it, translate message
    if (typeof errorMsg === 'string' && /mobile/i.test(errorMsg)) {
      errorMsg = 'OTP is correct but mobile mismatch. Please ensure you used the Aadhaar linked to this mobile.';
    }
    showError('login-otp-error', errorMsg);
    showToast(errorMsg, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

/**
 * Load profile with token
 */
async function loadProfile(token) {
  try {
    console.log('📡 Fetching profile from API...');
    const profile = await apiRequest('/profile', 'GET', null, token || loginState.token);
    
    console.log('✅ Profile data received:', profile);
    displayProfile(profile);
    
    // Hide all tabs and show profile
    hideElement('login-tab');
    hideElement('enroll-tab');
    showElement('profile-view');
    
    console.log('✅ Profile view displayed');
    
  } catch (error) {
    console.error('❌ Failed to load profile:', error);
    // If token expired, clear session and show login tab
    if (typeof error.message === 'string' && /token expired|x-token expired/i.test(error.message)) {
      sessionStorage.removeItem('abhaToken');
      sessionStorage.removeItem('abhaNumber');
      sessionStorage.removeItem('abhaAddress');
      showToast('Session expired. Please login again.', 'info');
      showElement('login-tab');
      hideElement('profile-view');
    } else {
      showToast('Login successful but could not load profile. Please try again.', 'error');
    }
  }
}

/**
 * Login OTP Timer functions
 */
function startLoginOTPTimer() {
  loginOtpTimeRemaining = 300; // 5 minutes
  document.getElementById('login-timer-text').classList.remove('hidden');
  document.getElementById('login-resend-container').classList.add('hidden');
  
  updateLoginTimerDisplay();
  
  loginOtpTimer = setInterval(() => {
    loginOtpTimeRemaining--;
    updateLoginTimerDisplay();
    
    if (loginOtpTimeRemaining <= 0) {
      stopLoginOTPTimer();
      document.getElementById('login-timer-text').classList.add('hidden');
      document.getElementById('login-resend-container').classList.remove('hidden');
    }
  }, 1000);
}

function stopLoginOTPTimer() {
  if (loginOtpTimer) {
    clearInterval(loginOtpTimer);
    loginOtpTimer = null;
  }
}

function updateLoginTimerDisplay() {
  const minutes = Math.floor(loginOtpTimeRemaining / 60);
  const seconds = loginOtpTimeRemaining % 60;
  document.getElementById('login-timer').textContent = 
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Check for existing session on load
function checkExistingSession() {
  const token = sessionStorage.getItem('abhaToken');
  const abhaNumber = sessionStorage.getItem('abhaNumber');
  
  if (token && abhaNumber) {
    showToast('Restoring your session...', 'info');
    loadProfile(token);
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeLogin();
    checkExistingSession();
  });
} else {
  initializeLogin();
  checkExistingSession();
}
