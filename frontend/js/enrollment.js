// Enrollment flow state
let enrollmentState = {
  currentStep: 1,
  txnId: null,
  token: null,
  refreshToken: null,
  selectedAddress: null,
  aadhaar: null,
  mobileVerified: false,
  abhaNumber: null,
  abhaAddress: null
};

// OTP Timer
let otpTimer = null;
let otpTimeRemaining = 300; // 5 minutes

/**
 * Initialize enrollment flow
 */
function initializeEnrollment() {
  // Aadhaar form
  const aadhaarForm = document.getElementById('aadhaar-form');
  const aadhaarInput = document.getElementById('aadhaar-input');
  
  if (aadhaarInput) restrictToNumbers(aadhaarInput);
  
  if (aadhaarForm) aadhaarForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError('aadhaar-error');
    
    const aadhaar = aadhaarInput.value.trim();
    const validation = validateAadhaar(aadhaar);
    
    if (!validation.valid) {
      showError('aadhaar-error', validation.message);
      return;
    }
    
    await sendOTP(validation.aadhaar);
  });

  // OTP form
  const otpForm = document.getElementById('otp-form');
  const otpDigits = document.querySelectorAll('.otp-digit');
  const primaryMobileInput = document.getElementById('primary-mobile-input');
  if (primaryMobileInput) restrictToNumbers(primaryMobileInput);
  
  // Step 2b elements
  const commMobileInput = document.getElementById('comm-mobile-input');
  const sendCommOtpBtn = document.getElementById('send-comm-otp-btn');
  const commOtpInput = document.getElementById('comm-otp-input');
  const verifyCommOtpBtn = document.getElementById('verify-comm-otp-btn');
  if (commMobileInput) restrictToNumbers(commMobileInput);
  if (commOtpInput) restrictToNumbers(commOtpInput);
  
  // OTP input handling (guard forEach for null elements)
  if (otpDigits && otpDigits.length > 0) {
    otpDigits.forEach((digit, index) => {
      if (digit) {
        restrictToNumbers(digit);
        
        digit.addEventListener('input', (e) => {
          if (e.target.value.length === 1 && index < otpDigits.length - 1) {
            otpDigits[index + 1].focus();
          }
        });
        
        digit.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace' && !e.target.value && index > 0) {
            otpDigits[index - 1].focus();
          }
        });
      }
    });
  }
  
  if (otpForm) {
    otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError('otp-error');
    clearError('mobile-error');
    
    const mobile = primaryMobileInput?.value.trim() || '';
    const mobileValidation = validateMobile(mobile);
    if (!mobileValidation.valid) {
      showError('mobile-error', mobileValidation.message);
      return;
    }
    
    const otp = Array.from(otpDigits).map(d => d.value).join('');
    const otpValidation = validateOTP(otp);
    if (!otpValidation.valid) {
      showError('otp-error', otpValidation.message);
      return;
    }
    
    await verifyOTP(otpValidation.otp, mobileValidation.mobile);
    });
  }

  // Resend Aadhaar OTP
  const resendOtpBtn = document.getElementById('resend-otp');
  if (resendOtpBtn) {
    resendOtpBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (enrollmentState.aadhaar) {
        await sendOTP(enrollmentState.aadhaar);
      }
    });
  }

  // Send communication mobile OTP
  if (sendCommOtpBtn) {
    sendCommOtpBtn.addEventListener('click', async () => {
      clearError('comm-mobile-error');
      const mobile = (commMobileInput?.value || '').trim();
      const validation = validateMobile(mobile);
      if (!validation.valid) {
        showError('comm-mobile-error', validation.message);
        return;
      }
      await sendCommMobileOTP(validation.mobile);
    });
  }

  // Verify communication mobile OTP
  if (verifyCommOtpBtn) {
    verifyCommOtpBtn.addEventListener('click', async () => {
      clearError('comm-mobile-error');
      const otp = (commOtpInput?.value || '').trim();
      const validation = validateOTP(otp);
      if (!validation.valid) {
        showError('comm-mobile-error', validation.message);
        return;
      }
      await verifyCommMobileOTP(validation.otp);
    });
  }

  // ABHA Address creation
  const customAddressInput = document.getElementById('custom-address-input');
  if (customAddressInput) {
    restrictToAlphanumeric(customAddressInput);
  
  // Real-time address availability check
  let addressCheckTimeout;
  const addressFeedback = document.createElement('div');
  addressFeedback.className = 'address-feedback';
  addressFeedback.style.marginTop = '8px';
  addressFeedback.style.fontSize = '14px';
  addressFeedback.style.fontWeight = '500';
  customAddressInput.parentNode.appendChild(addressFeedback);
  
  customAddressInput.addEventListener('input', (e) => {
    const address = e.target.value.trim();
    
    // Clear previous timeout
    clearTimeout(addressCheckTimeout);
    
    // When user types custom address, clear suggestion selection
    if (address) {
      document.querySelectorAll('.suggestion-item').forEach(item => {
        item.classList.remove('selected');
        const radio = item.querySelector('input[type="radio"]');
        if (radio) radio.checked = false;
      });
      enrollmentState.selectedAddress = null;
      
      // Add visual indicator that custom input is active
      customAddressInput.style.borderColor = '#4a90e2';
      customAddressInput.style.borderWidth = '2px';
    } else {
      // Reset border when empty
      customAddressInput.style.borderColor = '';
      customAddressInput.style.borderWidth = '';
    }
    
    // Clear feedback if empty
    if (!address) {
      addressFeedback.textContent = '';
      addressFeedback.className = 'address-feedback';
      return;
    }
    
    // Show checking state
    addressFeedback.textContent = 'Checking availability...';
    addressFeedback.className = 'address-feedback checking';
    addressFeedback.style.color = '#666';
    
    // Debounce address check (500ms)
    addressCheckTimeout = setTimeout(async () => {
      const validation = validateABHAAddress(address);
      
      if (!validation.valid) {
        addressFeedback.textContent = `❌ ${validation.message}`;
        addressFeedback.className = 'address-feedback invalid';
        addressFeedback.style.color = '#dc3545';
        return;
      }
      
      try {
        const response = await apiRequest(`/enrollment/check-address-availability?address=${encodeURIComponent(validation.address)}`, 'GET');
        
        // Handle response - check if available property exists
        const isAvailable = response && response.available === true;
        const isTaken = response && response.available === false;
        
        if (isAvailable) {
          addressFeedback.textContent = '✅ Available';
          addressFeedback.className = 'address-feedback available';
          addressFeedback.style.color = '#28a745';
        } else if (isTaken) {
          addressFeedback.textContent = '❌ Already taken';
          addressFeedback.className = 'address-feedback taken';
          addressFeedback.style.color = '#dc3545';
        } else {
          // Unexpected response format
          addressFeedback.textContent = '⚠️ Could not verify availability';
          addressFeedback.className = 'address-feedback error';
          addressFeedback.style.color = '#ffc107';
        }
      } catch (error) {
        // Show user-friendly error instead of technical message
        const errorMsg = error.message || 'Could not check availability';
        addressFeedback.textContent = `⚠️ ${errorMsg}`;
        addressFeedback.className = 'address-feedback error';
        addressFeedback.style.color = '#ffc107';
      }
    }, 500);
  });
  
  customAddressInput.addEventListener('focus', () => {
    // Clear suggestions when focusing on custom input
    if (customAddressInput.value.trim()) {
      document.querySelectorAll('.suggestion-item').forEach(item => {
        item.classList.remove('selected');
        const radio = item.querySelector('input[type="radio"]');
        if (radio) radio.checked = false;
      });
      enrollmentState.selectedAddress = null;
    }
  });
  
  const createAddressBtn = document.getElementById('create-address-btn');
  if (createAddressBtn) {
    createAddressBtn.addEventListener('click', async () => {
    const customAddress = customAddressInput.value.trim();
    
    clearError('address-error');
    
    // Check if user has entered something or selected something
    if (!customAddress && !enrollmentState.selectedAddress) {
      showError('address-error', 'Please select a suggested address OR type a custom address above.');
      return;
    }
    
    // If custom address is entered, validate it thoroughly
    if (customAddress) {
      const feedback = addressFeedback;
      
      // Check validation status
      if (feedback.classList.contains('taken')) {
        showError('address-error', 'This address is already taken. Please try another one.');
        return;
      }
      if (feedback.classList.contains('invalid')) {
        showError('address-error', 'Please fix the address format errors above.');
        return;
      }
      if (feedback.classList.contains('checking')) {
        showError('address-error', 'Please wait while we check address availability...');
        return;
      }
      if (!feedback.classList.contains('available')) {
        // If no validation has run yet, run it now
        const validation = validateABHAAddress(customAddress);
        if (!validation.valid) {
          showError('address-error', validation.message);
          return;
        }
      }
    }
    
    await createABHAAddress();
    });
  }
  }
}

/**
 * Send OTP to Aadhaar-linked mobile
 */
async function sendOTP(aadhaar) {
  const button = document.getElementById('send-otp-btn');
  
  try {
    setButtonLoading(button, true);
    
    const data = await apiRequest('/enrollment/send-otp', 'POST', { aadhaar });
    
    enrollmentState.txnId = data.txnId;
    enrollmentState.aadhaar = aadhaar;
    
    // We no longer show mobile on Aadhaar OTP page; Step 2b handles mobile verification
    enrollmentState.mobileVerified = !!(data.mobileVerified || data.mobile);
    
    showToast('OTP sent to your Aadhaar-linked mobile', 'success');
    
    // Move to step 2
    hideElement('step-1');
    showElement('step-2');
    updateStepIndicator(2);
    enrollmentState.currentStep = 2;
    
    // Start OTP timer
    startOTPTimer();
    
    // Focus first OTP digit (guard if absent)
    const firstOtp = document.querySelector('.otp-digit');
    if (firstOtp && typeof firstOtp.focus === 'function') firstOtp.focus();
    
  } catch (error) {
    const errorMsg = error.message || 'Failed to send OTP';
    showError('aadhaar-error', errorMsg);
    showToast(errorMsg, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

/**
 * Verify OTP and create ABHA
 */
async function verifyOTP(otp, mobile) {
  const button = document.getElementById('verify-otp-btn');
  
  try {
    setButtonLoading(button, true);
    
    const data = await apiRequest('/enrollment/verify-otp', 'POST', {
      txnId: enrollmentState.txnId,
      otp,
      mobile
    });
    
    enrollmentState.txnId = data.txnId;
    enrollmentState.token = data.token;
    enrollmentState.refreshToken = data.refreshToken;
    
    // Stop OTP timer
    stopOTPTimer();
    
    // Check if ABHA already exists
    if (data.abhaExists) {
      showToast('ABHA already exists for this Aadhaar!', 'info');
      
      // Store ABHA details
      enrollmentState.abhaNumber = data.abhaNumber;
      enrollmentState.abhaAddress = data.abhaAddress;
      enrollmentState.token = data.token;
      
      // Save to session storage for persistence
      if (data.token) {
        sessionStorage.setItem('abhaToken', data.token);
        sessionStorage.setItem('abhaNumber', data.abhaNumber);
        sessionStorage.setItem('abhaAddress', data.abhaAddress);
      }
      
      // Switch to login tab and load profile
      const loginTab = document.querySelector('.tab[data-tab="login"]');
      if (loginTab) loginTab.click();
      
      // Small delay to let tab switch complete
      setTimeout(async () => {
        await loadProfile(enrollmentState.token);
      }, 100);
      
      return;
    }
    
    showToast('OTP verified! ABHA account created.', 'success');
    
    // Check if mobile verification is needed
    const needsMobileVerification = data.mobileVerified === false;
    
    if (needsMobileVerification) {
      // Show mobile verification step
      hideElement('step-2');
      showElement('step-2b');
      showToast('Please verify your mobile number to continue', 'info');
    } else {
      // Mobile already verified, skip to address creation
      hideElement('step-2');
      showElement('step-3');
      updateStepIndicator(3);
      enrollmentState.currentStep = 3;
      
      // Load address suggestions
      await loadAddressSuggestions();
    }
    
  } catch (error) {
    const errorMsg = error.message || 'Failed to verify OTP';
    showError('otp-error', errorMsg);
    showToast(errorMsg, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

/**
 * Load ABHA address suggestions
 */
async function loadAddressSuggestions() {
  try {
    const data = await apiRequest(`/enrollment/address-suggestions?txnId=${enrollmentState.txnId}`);
    
    const suggestionList = document.getElementById('suggestion-list');
    suggestionList.innerHTML = '';
    
    if (data.suggestions && data.suggestions.length > 0) {
      data.suggestions.forEach((address, index) => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        if (index === 0) {
          item.classList.add('selected');
          enrollmentState.selectedAddress = address;
        }
        
        item.innerHTML = `
          <input type="radio" name="abha-address" value="${address}" class="suggestion-radio" ${index === 0 ? 'checked' : ''}>
          <span>${address}</span>
        `;
        
        item.addEventListener('click', () => {
          document.querySelectorAll('.suggestion-item').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
          item.querySelector('input').checked = true;
          enrollmentState.selectedAddress = address;
          
          // Clear custom input when selecting suggestion
          const customInput = document.getElementById('custom-address-input');
          if (customInput) {
            customInput.value = '';
            customInput.style.borderColor = '';
            customInput.style.borderWidth = '';
            
            // Clear validation feedback
            const feedback = customInput.parentNode.querySelector('.address-feedback');
            if (feedback) {
              feedback.textContent = '';
              feedback.className = 'address-feedback';
            }
          }
          
          // Clear any errors
          clearError('address-error');
        });
        
        suggestionList.appendChild(item);
      });
    } else {
      suggestionList.innerHTML = '<p style="padding: 15px; text-align: center; color: #999;">No suggestions available</p>';
    }
  } catch (error) {
    console.error('Failed to load suggestions:', error);
    showToast('Could not load address suggestions', 'error');
  }
}

/**
 * Create ABHA Address
 */
async function createABHAAddress() {
  const button = document.getElementById('create-address-btn');
  const customAddress = document.getElementById('custom-address-input').value.trim();
  
  clearError('address-error');
  
  // Determine which address to use - priority to custom input if filled
  let addressToCreate = customAddress || enrollmentState.selectedAddress;
  
  if (!addressToCreate) {
    showError('address-error', 'Please select a suggestion or enter a custom address');
    return;
  }
  
  // If custom address is entered, validate it thoroughly
  if (customAddress) {
    const validation = validateABHAAddress(customAddress);
    if (!validation.valid) {
      showError('address-error', validation.message);
      return;
    }
    addressToCreate = validation.address;
  } else {
    // Using suggested address
    const validation = validateABHAAddress(addressToCreate);
    if (!validation.valid) {
      showError('address-error', validation.message);
      return;
    }
    addressToCreate = validation.address;
  }
  
  try {
    setButtonLoading(button, true);
    
    const data = await apiRequest('/enrollment/create-address', 'POST', {
      txnId: enrollmentState.txnId,
      abhaAddress: addressToCreate,
      preferred: 1
    });
    
    if (data.token) {
      enrollmentState.token = data.token;
      
      // Save to session storage
      sessionStorage.setItem('abhaToken', data.token);
      sessionStorage.setItem('abhaAddress', addressToCreate);
    }
    
    showToast(`ABHA Address "${addressToCreate}" created successfully!`, 'success');
    
    // ABHA enrollment complete - switch to login tab and show profile
    const loginTab = document.querySelector('.tab[data-tab="login"]');
    if (loginTab) loginTab.click();
    
    // Small delay to let tab switch complete
    setTimeout(async () => {
      await loadProfile(enrollmentState.token);
    }, 100);
    
  } catch (error) {
    const errorMsg = error.message || 'Failed to create ABHA address';
    
    // If we get a 409 conflict, it means ABHA already exists
    // Fetch the profile instead of showing error
    if (error.message && error.message.includes('409') || errorMsg.includes('API_ERROR')) {
      showToast('ABHA already exists! Loading your profile...', 'info');
      
      // Ensure token is saved to sessionStorage
      if (enrollmentState.token) {
        sessionStorage.setItem('abhaToken', enrollmentState.token);
      }
      
      // Switch to login tab and load profile
      const loginTab = document.querySelector('.tab[data-tab="login"]');
      if (loginTab) loginTab.click();
      
      // Small delay to let tab switch complete
      setTimeout(async () => {
        await loadProfile(enrollmentState.token);
      }, 100);
      
      return;
    }
    
    showError('address-error', errorMsg);
    showToast(errorMsg, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

/**
 * Load user profile
 */
async function loadProfile() {
  try {
    const profile = await apiRequest('/profile', 'GET', null, enrollmentState.token);
    
    displayProfile(profile);
    showElement('profile-view');
    
  } catch (error) {
    console.error('Failed to load profile:', error);
    showToast('Profile created but could not fetch details', 'info');
  }
}

/**
 * Send communication mobile OTP
 */
async function sendCommMobileOTP(mobile) {
  const btn = document.getElementById('send-comm-otp-btn');
  try {
    setButtonLoading(btn, true);
    await apiRequest('/enrollment/mobile/send-otp', 'POST', { txnId: enrollmentState.txnId, mobile });
    showToast('Mobile OTP sent', 'success');
  } catch (e) {
    showToast(e.message || 'Failed to send mobile OTP', 'error');
  } finally { setButtonLoading(btn, false); }
}

/**
 * Verify communication mobile OTP
 */
async function verifyCommMobileOTP(otp) {
  const btn = document.getElementById('verify-comm-otp-btn');
  try {
    setButtonLoading(btn, true);
    await apiRequest('/enrollment/mobile/verify-otp', 'POST', { txnId: enrollmentState.txnId, otp });
    showToast('Mobile verified successfully', 'success');
    enrollmentState.mobileVerified = true;
    
    // Move to step 3 to create ABHA address
    hideElement('step-2b');
    showElement('step-3');
    updateStepIndicator(3);
    enrollmentState.currentStep = 3;
    
    // Load address suggestions
    await loadAddressSuggestions();
  } catch (e) {
    showToast(e.message || 'Failed to verify mobile', 'error');
  } finally { setButtonLoading(btn, false); }
}

/**
 * Display profile information
 */
function displayProfile(profile) {
  // Set name and ABHA
  document.getElementById('profile-name').textContent = 
    profile.name || profile.firstName + ' ' + (profile.lastName || '');
  
  document.getElementById('profile-abha').textContent = 
    profile.ABHANumber || profile.healthIdNumber || profile.preferredAbhaAddress || '';
  
  // Set details
  document.getElementById('profile-dob').textContent = formatDate(profile.dateOfBirth || profile.dob);
  document.getElementById('profile-gender').textContent = profile.gender || '--';
  document.getElementById('profile-mobile').textContent = formatMobileDisplay(profile.mobile);
  document.getElementById('profile-email').textContent = profile.email || 'Not added';
  
  // Set avatar initial
  const name = profile.firstName || profile.name || 'U';
  document.getElementById('profile-avatar').textContent = name.charAt(0).toUpperCase();
}

/**
 * Download ABHA Card
 */
async function downloadABHACard() {
  const button = document.getElementById('download-card-btn');
  
  try {
    setButtonLoading(button, true);
    
    const data = await apiRequest('/profile/card', 'GET', null, enrollmentState.token);
    
    // Handle card download (typically returns PDF base64 or URL)
    if (data.card) {
      showToast('ABHA Card downloaded successfully!', 'success');
      // You can implement actual download logic here
      console.log('ABHA Card data:', data.card);
    }
    
  } catch (error) {
    showToast('Failed to download ABHA card', 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

/**
 * OTP Timer functions
 */
function startOTPTimer() {
  otpTimeRemaining = 300; // 5 minutes
  document.getElementById('timer-text').classList.remove('hidden');
  document.getElementById('resend-container').classList.add('hidden');
  
  updateTimerDisplay();
  
  otpTimer = setInterval(() => {
    otpTimeRemaining--;
    updateTimerDisplay();
    
    if (otpTimeRemaining <= 0) {
      stopOTPTimer();
      document.getElementById('timer-text').classList.add('hidden');
      document.getElementById('resend-container').classList.remove('hidden');
    }
  }, 1000);
}

function stopOTPTimer() {
  if (otpTimer) {
    clearInterval(otpTimer);
    otpTimer = null;
  }
}

function updateTimerDisplay() {
  const minutes = Math.floor(otpTimeRemaining / 60);
  const seconds = otpTimeRemaining % 60;
  document.getElementById('timer').textContent = 
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEnrollment);
} else {
  initializeEnrollment();
}
