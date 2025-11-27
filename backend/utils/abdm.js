const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { ABDM_BASE_URL, ABHA_BASE_URL, ENDPOINTS, X_CM_ID } = require('../config/constants');

/**
 * ABDM API Client with common functionality
 */
class ABDMClient {
  constructor() {
    this.abdmBaseUrl = ABDM_BASE_URL;
    this.abhaBaseUrl = ABHA_BASE_URL;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Generate common headers for ABDM API requests
   */
  getHeaders(includeAuth = true, additionalHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'REQUEST-ID': uuidv4(),
      'TIMESTAMP': new Date().toISOString(),
      ...additionalHeaders
    };

    if (includeAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  /**
   * Get or refresh access token
   */
  async getAccessToken() {
    try {
      // Check if token is still valid (with 5 min buffer)
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 300000) {
        return this.accessToken;
      }

      const clientId = process.env.ABDM_CLIENT_ID || process.env.CLIENT_ID;
      const clientSecret = process.env.ABDM_CLIENT_SECRET || process.env.CLIENT_SECRET;

      // Check if credentials are set
      if (!clientId || !clientSecret) {
        console.error('❌ Missing ABDM credentials. Please set ABDM_CLIENT_ID and ABDM_CLIENT_SECRET environment variables.');
        throw new Error('ABDM credentials not configured. Please contact administrator.');
      }

      console.log('🔑 Fetching new access token...');
      console.log(`📍 Using Client ID: ${clientId.substring(0, 8)}...`);

      const response = await axios.post(
        `${this.abdmBaseUrl}${ENDPOINTS.SESSION}`,
        {
          clientId: clientId,
          clientSecret: clientSecret,
          grantType: 'client_credentials'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'REQUEST-ID': uuidv4(),
            'TIMESTAMP': new Date().toISOString(),
            'X-CM-ID': X_CM_ID
          }
        }
      );

      this.accessToken = response.data.accessToken;
      // Set expiry (default 15 minutes if not provided)
      this.tokenExpiry = Date.now() + (response.data.expiresIn || 900) * 1000;

      console.log('✅ Access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Failed to get access token:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        throw new Error('Invalid ABDM credentials. Please check CLIENT_ID and CLIENT_SECRET.');
      }
      throw new Error('Failed to authenticate with ABDM: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Make a POST request to ABDM API
   */
  async post(endpoint, data, additionalHeaders = {}) {
    try {
      await this.getAccessToken();

      const url = `${this.abhaBaseUrl}${endpoint}`;
      const headers = this.getHeaders(true, additionalHeaders);

      console.log(`📤 POST ${endpoint}`);
      
      const response = await axios.post(url, data, { headers });
      return response.data;
    } catch (error) {
      console.error(`❌ POST ${endpoint} failed:`, error.response?.data || error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Make a GET request to ABDM API
   */
  async get(endpoint, additionalHeaders = {}) {
    try {
      await this.getAccessToken();

      const url = `${this.abhaBaseUrl}${endpoint}`;
      const headers = this.getHeaders(true, additionalHeaders);

      console.log(`📥 GET ${endpoint}`);
      
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      console.error(`❌ GET ${endpoint} failed:`, error.response?.data || error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Make a GET request expecting binary data (e.g., images, PDFs)
   */
  async getBinary(endpoint, additionalHeaders = {}) {
    try {
      await this.getAccessToken();

      const url = `${this.abhaBaseUrl}${endpoint}`;
      const headers = this.getHeaders(true, additionalHeaders);

      console.log(`📥 GET (binary) ${endpoint}`);

      const response = await axios.get(url, {
        headers,
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(response.data);
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      return { buffer, contentType };
    } catch (error) {
      console.error(`❌ GET (binary) ${endpoint} failed:`, error.response?.data || error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      // Extract error information from various ABDM response formats
      let errorCode = data.code || data.errorCode || 'API_ERROR';
      let errorMessage = data.message || data.error || 'API request failed';
      let errorDetails = data.details || null;
      
      // Handle nested error objects (common in ABDM responses)
      if (typeof data === 'object' && !data.message && !data.error) {
        // Check for field-specific errors (like loginId, loginHint, etc.)
        const fieldErrors = Object.keys(data).filter(key => 
          typeof data[key] === 'string' && key !== 'timestamp'
        );
        
        if (fieldErrors.length > 0) {
          errorCode = fieldErrors[0]; // Use field name as code
          errorMessage = data[fieldErrors[0]]; // Use field error message
        }
      }
      
      // Check if it's an ABHA exists error
      if (data.ABHANumber || data.healthIdNumber || 
          (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('already exists'))) {
        errorCode = 'ABDM-1008';
        errorMessage = 'ABHA already exists for this Aadhaar number.';
        errorDetails = {
          abhaNumber: data.ABHANumber || data.healthIdNumber,
          abhaAddress: data.preferredAbhaAddress || data.healthId
        };
      }

      return {
        status,
        code: errorCode,
        message: errorMessage,
        details: errorDetails
      };
    }

    return {
      status: 500,
      code: 'NETWORK_ERROR',
      message: 'Network error occurred. Please try again.',
      details: error.message
    };
  }
}

// Singleton instance
const abdmClient = new ABDMClient();

module.exports = abdmClient;
