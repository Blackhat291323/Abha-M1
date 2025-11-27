/**
 * Main application controller
 */

// Initialize tabs
function initializeTabs() {
  const tabs = document.querySelectorAll('.tabs .tab');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      const searchType = tab.dataset.search;
      
      // Handle main tabs (enroll vs login)
      if (tabName) {
        // Ensure profile view is hidden when switching tabs
        hideElement('profile-view');

        // Remove active class from all tabs
        document.querySelectorAll('.tabs .tab').forEach(t => {
          if (t.dataset.tab) t.classList.remove('active');
        });
        tab.classList.add('active');
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        
        // Show selected tab content
        const tabContent = document.getElementById(`${tabName}-tab`);
        if (tabContent) tabContent.classList.add('active');
      }
      
      // Handle search tabs
      if (searchType) {
        // Remove active class from search tabs
        document.querySelectorAll('[data-search]').forEach(t => {
          t.classList.remove('active');
          t.style.borderBottom = 'none';
        });
        tab.classList.add('active');
        tab.style.borderBottom = '2px solid var(--primary-blue)';
        
        // Hide all search forms
        document.querySelectorAll('.search-form').forEach(form => {
          form.classList.add('hidden');
        });
        
        // Show selected search form
        const searchForm = document.getElementById(`search-${searchType}-form`);
        if (searchForm) searchForm.classList.remove('hidden');
      }
    });
  });
}

// Initialize search functionality
function initializeSearch() {
  // Search by Address
  const searchAddressForm = document.getElementById('search-address-form');
  if (searchAddressForm) {
    searchAddressForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError('search-address-error');
      
      const addressInput = document.getElementById('search-address-input');
      const address = addressInput ? addressInput.value.trim() : '';
      const validation = validateABHAAddress(address);
      
      if (!validation.valid) {
        showError('search-address-error', validation.message);
        return;
      }
      
      await searchByAddress(validation.address);
    });
  }

  // Search by Number
  const searchNumberForm = document.getElementById('search-number-form');
  const searchNumberInput = document.getElementById('search-number-input');
  if (searchNumberInput) restrictToNumbers(searchNumberInput);
  
  if (searchNumberForm) {
    searchNumberForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError('search-number-error');
      
      const number = (searchNumberInput ? searchNumberInput.value : '').trim().replace(/[\s-]/g, '');
      
      if (!number) {
        showError('search-number-error', 'ABHA Number is required');
        return;
      }
      
      if (!/^\d{14}$/.test(number)) {
        showError('search-number-error', 'ABHA Number must be 14 digits');
        return;
      }
      
      await searchByNumber(number);
    });
  }

  // Search by Mobile
  const searchMobileForm = document.getElementById('search-mobile-form');
  const searchMobileInput = document.getElementById('search-mobile-input');
  if (searchMobileInput) restrictToNumbers(searchMobileInput);
  
  if (searchMobileForm) {
    searchMobileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError('search-mobile-error');
      
      const mobile = searchMobileInput ? searchMobileInput.value.trim() : '';
      const validation = validateMobile(mobile);
      
      if (!validation.valid) {
        showError('search-mobile-error', validation.message);
        return;
      }
      
      await searchByMobile(validation.mobile);
    });
  }
}

/**
 * Search ABHA by Address
 */
async function searchByAddress(address) {
  const button = document.getElementById('search-address-btn');
  
  try {
    setButtonLoading(button, true);
    
    const response = await apiRequest('/search/by-address', 'POST', { abhaAddress: address });
    
    if (!response.found) {
      showError('search-address-error', response.message || 'No ABHA account found with this address');
      showToast('ABHA address not found', 'info');
      return;
    }
    
    showToast('ABHA found!', 'success');
    
    // Display profile
    displayProfile(response.data);
    hideElement('verify-tab');
    showElement('profile-view');
    
  } catch (error) {
    showError('search-address-error', error.message);
    showToast(error.message, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

/**
 * Search ABHA by Number
 */
async function searchByNumber(number) {
  const button = document.getElementById('search-number-btn');
  
  try {
    setButtonLoading(button, true);
    
    const response = await apiRequest('/search/by-number', 'POST', { abhaNumber: number });
    
    if (!response.found) {
      showError('search-number-error', response.message || 'No ABHA account found with this number');
      showToast('ABHA number not found', 'info');
      return;
    }
    
    showToast('ABHA found!', 'success');
    
    // Display profile
    displayProfile(response.data);
    hideElement('verify-tab');
    showElement('profile-view');
    
  } catch (error) {
    showError('search-number-error', error.message);
    showToast(error.message, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

/**
 * Search ABHA by Mobile
 */
async function searchByMobile(mobile) {
  const button = document.getElementById('search-mobile-btn');
  
  try {
    setButtonLoading(button, true);
    
    const response = await apiRequest('/search/by-mobile', 'POST', { mobile });
    
    if (!response.found) {
      showError('search-mobile-error', response.message || 'No ABHA accounts found for this mobile number');
      showToast('No ABHA accounts found', 'info');
      return;
    }
    
    showToast('ABHA found!', 'success');
    
    // If multiple results, show first one
    const profile = Array.isArray(response.data) ? response.data[0] : response.data;
    
    // Display profile
    displayProfile(profile);
    hideElement('verify-tab');
    showElement('profile-view');
    
  } catch (error) {
    showError('search-mobile-error', error.message);
    showToast(error.message, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

/**
 * Initialize profile actions
 */
function initializeProfileActions() {
  // Download ABHA Card
  const downloadBtn = document.getElementById('download-card-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', fetchAndDownloadABHACard);
  }

  // Create Another ABHA
  const createAnotherBtn = document.getElementById('create-another-btn');
  if (createAnotherBtn) {
    createAnotherBtn.addEventListener('click', () => {
      logoutAndReset();
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logoutAndReset();
    });
  }
}

// Clear session and reset UI so user can continue
function logoutAndReset() {
  try {
    sessionStorage.removeItem('abhaToken');
    sessionStorage.removeItem('abhaNumber');
    sessionStorage.removeItem('abhaAddress');

    // Hide profile view
    hideElement('profile-view');

    // Reset tabs to Enroll by default
    const enrollTabBtn = Array.from(document.querySelectorAll('.tabs .tab'))
      .find(t => t.dataset.tab === 'enroll');
    document.querySelectorAll('.tabs .tab').forEach(t => {
      if (t.dataset.tab) t.classList.remove('active');
    });
    if (enrollTabBtn) enrollTabBtn.classList.add('active');

    // Show enroll tab content, hide others
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    const enrollTab = document.getElementById('enroll-tab');
    if (enrollTab) enrollTab.classList.add('active');

    // Reset login forms visibility
    const loginAadhaarForm = document.getElementById('login-aadhaar-form');
    const loginOtpForm = document.getElementById('login-otp-form');
    if (loginAadhaarForm) loginAadhaarForm.classList.remove('hidden');
    if (loginOtpForm) loginOtpForm.classList.add('hidden');

    // Clear ABHA card preview
    const qr = document.getElementById('abha-qr');
    if (qr) {
      qr.innerHTML = '<span style="color: #999;">QR Code will appear here</span>';
    }

    // Stop any running login OTP timers if available
    if (typeof stopLoginOTPTimer === 'function') {
      try { stopLoginOTPTimer(); } catch {}
    }

    showToast('You have been logged out', 'info');
  } catch (e) {
    // Fallback: ensure no stale session remains
    sessionStorage.clear();
  }
}

/**
 * Initialize application
 */
function initializeApp() {
  console.log('🚀 ABHA Application initialized');
  
  initializeTabs();
  initializeSearch();
  initializeProfileActions();
  initializeVerification();
  
  // Check API health
  checkAPIHealth();
}

/**
 * Check API connectivity
 */
async function checkAPIHealth() {
  try {
    await apiRequest('/session/health');
    console.log('✅ Backend API is connected');
  } catch (error) {
    console.error('❌ Backend API is not reachable:', error);
    showToast('Warning: Backend server may not be running', 'error');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Initialize verification flows (send/confirm OTP)
function initializeVerification() {
  const abhaInput = document.getElementById('verify-abha-input');
  const sendBtn = document.getElementById('verify-send-otp-btn');
  const otpInput = document.getElementById('verify-otp-input');
  const confirmBtn = document.getElementById('verify-confirm-otp-btn');
  const openQrBtn = document.getElementById('open-qr-btn');
  const closeQrBtn = document.getElementById('close-qr-btn');
  const qrReaderEl = document.getElementById('qr-reader');
  const qrHelpText = document.getElementById('qr-help-text');
  let qrScanner = null;

  if (abhaInput) restrictToAlphanumeric(abhaInput);
  if (otpInput) restrictToNumbers(otpInput);

  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      clearError('verify-abha-error');
      const address = (abhaInput?.value || '').trim();
      const validation = validateABHAAddress(address);
      if (!validation.valid) {
        showError('verify-abha-error', validation.message);
        return;
      }
      try {
        setButtonLoading(sendBtn, true);
        const resp = await apiRequest('/search/verify/send-otp', 'POST', { abhaAddress: validation.address });
        showToast('Verification OTP sent', 'success');
        // Store txnId for confirm step
        sendBtn.dataset.txnId = resp.txnId;
      } catch (e) {
        showToast(e.message || 'Failed to send verification OTP', 'error');
      } finally { setButtonLoading(sendBtn, false); }
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      const txnId = sendBtn?.dataset?.txnId;
      const otp = (otpInput?.value || '').trim();
      const otpVal = validateOTP(otp);
      if (!txnId) { showToast('Send OTP first', 'info'); return; }
      if (!otpVal.valid) { showError('verify-abha-error', otpVal.message); return; }
      try {
        setButtonLoading(confirmBtn, true);
        await apiRequest('/search/verify/confirm', 'POST', { txnId, otp: otpVal.otp });
        showToast('ABHA verified successfully', 'success');
      } catch (e) {
        showToast(e.message || 'Verification failed', 'error');
      } finally { setButtonLoading(confirmBtn, false); }
    });
  }

  // QR scanner controls
  const canUseCamera = ['http:', 'https:'].includes(window.location.protocol);
  if (!canUseCamera && qrHelpText) {
    qrHelpText.textContent = 'Open this page via http(s) or localhost to use camera.';
  }

  async function startScanner() {
    if (!canUseCamera || !window.Html5Qrcode || !qrReaderEl) {
      showToast('Camera not available here; use manual entry.', 'info');
      return;
    }
    try {
      qrReaderEl.style.display = 'block';
      openQrBtn.style.display = 'none';
      closeQrBtn.style.display = 'inline-block';
      qrScanner = new Html5Qrcode('qr-reader');
      await qrScanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          // Parse ABHA address or number from QR payload
          const addrMatch = decodedText.match(/[a-z0-9._]+@sbx/i);
          const numMatch = decodedText.match(/\b\d{2}-\d{4}-\d{4}-\d{4}\b/);
          if (addrMatch && abhaInput) {
            abhaInput.value = addrMatch[0].toLowerCase();
            showToast('ABHA address captured from QR', 'success');
          } else if (numMatch && abhaInput) {
            // Convert number to address is not possible; keep as is for OTP flow if backend supports
            abhaInput.value = numMatch[0];
            showToast('ABHA number captured from QR', 'success');
          } else {
            showToast('QR scanned but no ABHA found', 'info');
          }
          stopScanner();
        },
        (err) => { /* ignore scan errors */ }
      );
    } catch (e) {
      showToast('Failed to start scanner', 'error');
      stopScanner();
    }
  }

  async function stopScanner() {
    try {
      if (qrScanner) {
        await qrScanner.stop();
        await qrScanner.clear();
      }
    } catch (_) { /* noop */ }
    qrScanner = null;
    if (qrReaderEl) qrReaderEl.style.display = 'none';
    if (openQrBtn) openQrBtn.style.display = 'inline-block';
    if (closeQrBtn) closeQrBtn.style.display = 'none';
  }

  if (openQrBtn) openQrBtn.addEventListener('click', startScanner);
  if (closeQrBtn) closeQrBtn.addEventListener('click', stopScanner);
}
