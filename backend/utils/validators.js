/**
 * Validate Aadhaar number
 */
function validateAadhaar(aadhaar) {
  if (!aadhaar) {
    return { valid: false, message: 'Aadhaar number is required' };
  }

  // Remove spaces and hyphens
  const cleanAadhaar = aadhaar.replace(/[\s-]/g, '');

  if (!/^\d{12}$/.test(cleanAadhaar)) {
    return { valid: false, message: 'Aadhaar must be 12 digits' };
  }

  // Basic Verhoeff algorithm check (optional)
  // For now, just check format
  return { valid: true, aadhaar: cleanAadhaar };
}

/**
 * Validate mobile number
 */
function validateMobile(mobile) {
  if (!mobile) {
    return { valid: false, message: 'Mobile number is required' };
  }

  // Remove spaces, hyphens, and + symbol
  const cleanMobile = mobile.replace(/[\s-+]/g, '');

  // Indian mobile: 10 digits starting with 6-9
  if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
    return { valid: false, message: 'Invalid mobile number format' };
  }

  return { valid: true, mobile: cleanMobile };
}

/**
 * Validate OTP
 */
function validateOTP(otp) {
  if (!otp) {
    return { valid: false, message: 'OTP is required' };
  }

  const cleanOTP = otp.replace(/\s/g, '');

  if (!/^\d{6}$/.test(cleanOTP)) {
    return { valid: false, message: 'OTP must be 6 digits' };
  }

  return { valid: true, otp: cleanOTP };
}

/**
 * Validate email
 */
function validateEmail(email) {
  if (!email) {
    return { valid: false, message: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Invalid email format' };
  }

  return { valid: true, email: email.toLowerCase() };
}

/**
 * Validate ABHA Address
 */
function validateABHAAddress(address) {
  if (!address) {
    return { valid: false, message: 'ABHA Address is required' };
  }

  // ABHA address format: alphanumeric, dots, underscores
  // Length: typically 8-18 characters
  const cleanAddress = address.toLowerCase().trim();

  if (cleanAddress.length < 8 || cleanAddress.length > 18) {
    return { valid: false, message: 'ABHA Address must be 8-18 characters' };
  }

  if (!/^[a-z0-9._]+$/.test(cleanAddress)) {
    return { valid: false, message: 'ABHA Address can only contain letters, numbers, dots, and underscores' };
  }

  return { valid: true, address: cleanAddress };
}

/**
 * Validate ABHA Number
 */
function validateABHANumber(number) {
  if (!number) {
    return { valid: false, message: 'ABHA Number is required' };
  }

  // ABHA number: 14 digits
  const cleanNumber = number.replace(/[\s-]/g, '');

  if (!/^\d{14}$/.test(cleanNumber)) {
    return { valid: false, message: 'ABHA Number must be 14 digits' };
  }

  return { valid: true, number: cleanNumber };
}

/**
 * Validate transaction ID
 */
function validateTxnId(txnId) {
  if (!txnId || typeof txnId !== 'string' || txnId.trim().length === 0) {
    return { valid: false, message: 'Transaction ID is required' };
  }

  return { valid: true, txnId };
}

module.exports = {
  validateAadhaar,
  validateMobile,
  validateOTP,
  validateEmail,
  validateABHAAddress,
  validateABHANumber,
  validateTxnId
};
