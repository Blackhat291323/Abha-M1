// API Configuration - Using relative path for same-domain deployment
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api' 
  : '/api'; // Relative path - works on same domain

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
  toast.innerHTML = `
    <span style="font-size: 20px;">${icon}</span>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Show/hide loading state on button
 */
function setButtonLoading(button, loading) {
  if (loading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}

/**
 * Show/hide error message
 */
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    // Ensure message is always a string - handle all edge cases
    let errorMessage = 'An error occurred';
    
    if (typeof message === 'string') {
      errorMessage = message;
    } else if (message instanceof Error) {
      errorMessage = message.message || message.toString();
    } else if (message && typeof message === 'object') {
      // Handle error objects
      errorMessage = message.message || message.error || message.toString();
    }
    
    errorElement.textContent = errorMessage;
    errorElement.classList.add('show');
    
    // Add error class to input
    const input = errorElement.previousElementSibling;
    if (input && input.classList.contains('form-input')) {
      input.classList.add('error');
    }
  }
}

/**
 * Clear error message
 */
function clearError(elementId) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.classList.remove('show');
    
    // Remove error class from input
    const input = errorElement.previousElementSibling;
    if (input && input.classList.contains('form-input')) {
      input.classList.remove('error');
    }
  }
}

/**
 * Validate Aadhaar number
 */
function validateAadhaar(aadhaar) {
  if (!aadhaar || typeof aadhaar !== 'string') {
    return { valid: false, message: 'Aadhaar number is required' };
  }
  
  const cleaned = aadhaar.replace(/\s/g, '');
  if (!cleaned) return { valid: false, message: 'Aadhaar number is required' };
  if (!/^\d{12}$/.test(cleaned)) return { valid: false, message: 'Aadhaar must be 12 digits' };
  return { valid: true, aadhaar: cleaned };
}

/**
 * Validate mobile number
 */
function validateMobile(mobile) {
  if (!mobile || typeof mobile !== 'string') {
    return { valid: false, message: 'Mobile number is required' };
  }
  
  const cleaned = mobile.replace(/\s/g, '');
  if (!cleaned) return { valid: false, message: 'Mobile number is required' };
  if (!/^[6-9]\d{9}$/.test(cleaned)) return { valid: false, message: 'Invalid mobile number' };
  return { valid: true, mobile: cleaned };
}

/**
 * Validate OTP
 */
function validateOTP(otp) {
  if (!otp) return { valid: false, message: 'OTP is required' };
  if (!/^\d{6}$/.test(otp)) return { valid: false, message: 'OTP must be 6 digits' };
  return { valid: true, otp };
}

/**
 * Validate ABHA Address
 */
function validateABHAAddress(address) {
  // Handle null, undefined, or non-string values
  if (!address || typeof address !== 'string') {
    return { valid: false, message: 'ABHA Address is required' };
  }
  
  const cleaned = address.toLowerCase().trim();
  if (!cleaned) return { valid: false, message: 'ABHA Address is required' };
  if (cleaned.length < 8 || cleaned.length > 18) {
    return { valid: false, message: 'ABHA Address must be 8-18 characters' };
  }
  if (!/^[a-z0-9._]+$/.test(cleaned)) {
    return { valid: false, message: 'Only lowercase letters, numbers, dots, and underscores allowed' };
  }
  return { valid: true, address: cleaned };
}

/**
 * Make API request
 */
async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['X-Token'] = `Bearer ${token}`;
    }

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    console.log(`🔄 ${method} ${url}`, data);
    
    const response = await fetch(url, options);
    const result = await response.json();

    console.log(`✅ Response (${response.status}):`, result);

    if (!response.ok || !result.success) {
      console.log('🔍 Error details:', {
        'result.error': result.error,
        'result.error type': typeof result.error,
        'result.message': result.message
      });
      
      // Extract error message properly - ensure it's always a string
      let errorMessage = 'Request failed';
      
      if (result.error) {
        if (typeof result.error === 'string') {
          errorMessage = result.error;
        } else if (typeof result.error === 'object') {
          // Try to get message from error object
          if (result.error.message && typeof result.error.message === 'string') {
            errorMessage = result.error.message;
          } else {
            // Extract first meaningful string value from error object
            const errorValues = Object.values(result.error).filter(v => v && typeof v === 'string');
            errorMessage = errorValues.length > 0 ? errorValues[0] : 'Request failed';
          }
        }
      } else if (result.message && typeof result.message === 'string') {
        errorMessage = result.message;
      }
      
      // Final safety check - ensure errorMessage is always a string
      if (typeof errorMessage !== 'string') {
        errorMessage = 'Request failed. Please try again.';
      }
      
      const error = new Error(errorMessage);
      error.code = result.error?.code;
      error.details = result.error?.details;
      throw error;
    }

    // Return result.data if it exists, otherwise return the whole result
    // (some endpoints return data in result.data, others return it at root level)
    return result.data !== undefined ? result.data : result;
  } catch (error) {
    console.error('❌ API Error:', error);
    // Ensure we always throw an Error object with a message string
    if (error.message) {
      throw error;
    } else {
      throw new Error('Network error. Please try again.');
    }
  }
}

/**
 * Format date
 */
function formatDate(dateString) {
  if (!dateString) return '--';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateString;
  }
}

/**
 * Format mobile number
 */
function formatMobileDisplay(mobile) {
  if (!mobile) return '--';
  return mobile.replace(/(\d{5})(\d{5})/, '$1-$2');
}

/**
 * Show/hide elements
 */
function showElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) element.classList.remove('hidden');
}

function hideElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) element.classList.add('hidden');
}

/**
 * Update step indicator
 */
function updateStepIndicator(currentStep) {
  document.querySelectorAll('.step').forEach((step, index) => {
    const stepNum = index + 1;
    step.classList.remove('active', 'completed');
    
    if (stepNum < currentStep) {
      step.classList.add('completed');
    } else if (stepNum === currentStep) {
      step.classList.add('active');
    }
  });
}

/**
 * Only allow numbers in input
 */
function restrictToNumbers(input) {
  if (!input || typeof input.addEventListener !== 'function') return;
  input.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });
}

/**
 * Only allow alphanumeric with dots and underscores
 */
function restrictToAlphanumeric(input) {
  if (!input || typeof input.addEventListener !== 'function') return;
  input.addEventListener('input', (e) => {
    if (e.target.value && typeof e.target.value === 'string') {
      e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '');
    }
  });
}

/**
 * Convert base64 string to Blob
 */
function base64ToBlob(base64, mime = 'application/octet-stream') {
  try {
    // Support data URLs directly: data:<mime>;base64,<payload>
    if (typeof base64 === 'string' && base64.startsWith('data:')) {
      const comma = base64.indexOf(',');
      const header = base64.substring(5, comma); // e.g., image/png;base64
      const payload = base64.substring(comma + 1);
      const type = header.split(';')[0] || mime;
      const binaryString = atob(payload);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
      return new Blob([bytes], { type });
    }

    // Normal base64 decode path
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch (e) {
    // Fallback: treat input as a binary (latin1) string and pack bytes
    try {
      const str = String(base64);
      const len = str.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = str.charCodeAt(i) & 0xff;
      return new Blob([bytes], { type: mime });
    } catch (fallbackErr) {
      console.error('Failed to convert base64/binary string to Blob', fallbackErr);
      return null;
    }
  }
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
 * Handle ABHA card download + preview
 */
async function fetchAndDownloadABHACard() {
  const button = document.getElementById('download-card-btn');
  try {
    setButtonLoading(button, true);
    const token = sessionStorage.getItem('abhaToken');
    const result = await apiRequest('/profile/card', 'GET', null, token);

    // Expect result.card to be base64 content
    const base64 = result.card || result; // tolerate different shapes
    const serverMime = result.mimeType;
    if (!base64 || typeof base64 !== 'string') {
      throw new Error('ABHA card unavailable right now');
    }

    // Detect type by magic header
    let mime = serverMime || 'application/pdf';
    let ext = 'pdf';
    if (serverMime) {
      if (serverMime.includes('png')) ext = 'png';
      else if (serverMime.includes('jpeg') || serverMime.includes('jpg')) ext = 'jpg';
      else if (serverMime.includes('pdf')) ext = 'pdf';
    }
    if (base64.startsWith('iVBORw0KGgo')) { mime = 'image/png'; ext = 'png'; }
    else if (base64.startsWith('/9j/')) { mime = 'image/jpeg'; ext = 'jpg'; }

    const blob = base64ToBlob(base64, mime);
    if (!blob) throw new Error('Could not prepare ABHA card file');

    const url = URL.createObjectURL(blob);

    // Preview if image
    if (mime.startsWith('image/')) {
      const preview = document.getElementById('abha-qr');
      if (preview) {
        preview.innerHTML = '';
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'ABHA Card';
        img.style.maxWidth = '260px';
        img.style.borderRadius = '8px';
        preview.appendChild(img);
      }
    }

    // Download file
    const a = document.createElement('a');
    a.href = url;
    a.download = `abha-card.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    showToast('ABHA card downloaded', 'success');
  } catch (error) {
    console.error('Failed to download ABHA card', error);
    showToast(error.message || 'Failed to download ABHA card', 'error');
  } finally {
    setButtonLoading(button, false);
  }
}
