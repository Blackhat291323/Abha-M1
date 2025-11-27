const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

/**
 * Get public key from .env or file
 */
function getPublicKey() {
  try {
    // Try to get from .env first
    if (process.env.PUBLIC_KEY) {
      return process.env.PUBLIC_KEY;
    }
    
    // Try to read from public-key.pem file
    const keyPath = process.env.PUBLIC_KEY_PATH || path.join(__dirname, '../public-key.pem');
    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath, 'utf8');
    }
    
    throw new Error('Public key not found. Please set PUBLIC_KEY in .env or create public-key.pem');
  } catch (error) {
    console.error('❌ Error loading public key:', error.message);
    throw error;
  }
}

/**
 * Encrypt data using RSA public key
 * @param {string} data - Plain text to encrypt
 * @returns {string} - Base64 encoded encrypted data
 */
function encryptWithPublicKey(data) {
  try {
    const publicKeyPem = getPublicKey();
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    
    // Encrypt the data using RSA-OAEP with SHA-1 (ABDM requirement)
    const encrypted = publicKey.encrypt(data, 'RSA-OAEP', {
      md: forge.md.sha1.create(),
      mgf1: {
        md: forge.md.sha1.create()
      }
    });
    
    // Convert to base64
    return forge.util.encode64(encrypted);
  } catch (error) {
    console.error('❌ Encryption error:', error.message);
    console.error('❌ Failed to encrypt:', data.substring(0, 4) + '...');
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Encrypt Aadhaar number
 * @param {string} aadhaar - 12 digit Aadhaar number
 * @returns {string} - Encrypted Aadhaar
 */
function encryptAadhaar(aadhaar) {
  if (!aadhaar || aadhaar.length !== 12) {
    throw new Error('Invalid Aadhaar number. Must be 12 digits.');
  }
  return encryptWithPublicKey(aadhaar);
}

/**
 * Encrypt OTP
 * @param {string} otp - OTP value
 * @returns {string} - Encrypted OTP
 */
function encryptOTP(otp) {
  if (!otp || otp.length !== 6) {
    throw new Error('Invalid OTP. Must be 6 digits.');
  }
  return encryptWithPublicKey(otp);
}

/**
 * Encrypt email
 * @param {string} email - Email address
 * @returns {string} - Encrypted email
 */
function encryptEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new Error('Invalid email address');
  }
  return encryptWithPublicKey(email);
}

module.exports = {
  encryptAadhaar,
  encryptOTP,
  encryptEmail,
  encryptWithPublicKey
};
