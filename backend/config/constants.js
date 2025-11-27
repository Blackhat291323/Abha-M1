module.exports = {
  // ABDM API Endpoints
  ABDM_BASE_URL: process.env.ABDM_BASE_URL || 'https://dev.abdm.gov.in',
  ABHA_BASE_URL: process.env.ABHA_BASE_URL || 'https://abhasbx.abdm.gov.in',
  
  // API Paths
  ENDPOINTS: {
    SESSION: '/api/hiecm/gateway/v3/sessions',
    CERT: '/api/hiecm/gateway/v3/certs',
    SEND_OTP: '/abha/api/v3/enrollment/request/otp',
    VERIFY_OTP: '/abha/api/v3/enrollment/enrol/byAadhaar',
    ADDRESS_SUGGESTIONS: '/abha/api/v3/enrollment/enrol/suggestion',
    CREATE_ADDRESS: '/abha/api/v3/enrollment/enrol/abha-address',
    GET_PROFILE: '/abha/api/v3/profile/account',
    DOWNLOAD_CARD: '/abha/api/v3/profile/account/abha-card',
    SEARCH_BY_ADDRESS: '/abha/api/v3/search/searchByHealthId',
    VERIFY_ADDRESS: '/abha/api/v3/search/existsByHealthId',
  },

  // Headers
  X_CM_ID: 'sbx',
  
  // Scopes
  SCOPES: {
    ENROL: ['abha-enrol'],
    MOBILE_VERIFY: ['abha-enrol', 'mobile-verify'],
    PROFILE: ['abha-profile'],
  },

  // OTP Configuration
  OTP: {
    SYSTEM: 'aadhaar',
    LOGIN_HINT: 'aadhaar',
    MAX_ATTEMPTS: 3,
    EXPIRY_SECONDS: 300, // 5 minutes
  },

  // Consent
  CONSENT: {
    CODE: 'abha-enrollment',
    VERSION: '1.4',
  },

  // Response Messages
  MESSAGES: {
    OTP_SENT: 'OTP sent successfully',
    ABHA_CREATED: 'ABHA created successfully',
    ADDRESS_ASSIGNED: 'ABHA Address assigned successfully',
    INVALID_AADHAAR: 'Invalid Aadhaar number',
    INVALID_OTP: 'Invalid OTP',
    SESSION_EXPIRED: 'Session expired, please try again',
    SERVER_ERROR: 'Something went wrong, please try again later',
  }
};
