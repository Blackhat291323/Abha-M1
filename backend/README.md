# ABHA Backend API

Backend server for ABHA (Ayushman Bharat Health Account) enrollment and management.

## Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Fill in your ABDM credentials:
     ```
     CLIENT_ID=your_client_id
     CLIENT_SECRET=your_client_secret
     PUBLIC_KEY="your_public_key_here"
     ```

3. **Run the Server**
   ```bash
   npm start        # Production
   npm run dev      # Development (with nodemon)
   ```

## API Endpoints

### Session Management
- `GET /api/session/token` - Get access token
- `GET /api/session/health` - Check API connectivity

### Enrollment (Phase 1)
- `POST /api/enrollment/send-otp` - Send OTP to Aadhaar mobile
- `POST /api/enrollment/verify-otp` - Verify OTP & create ABHA
- `GET /api/enrollment/address-suggestions` - Get ABHA address suggestions
- `POST /api/enrollment/create-address` - Create ABHA address

### Profile (Phase 2 - Partial)
- `GET /api/profile` - Get user profile (requires X-token)
- `GET /api/profile/card` - Download ABHA card (requires X-token)

### Search & Verification (Phase 4)
- `POST /api/search/by-address` - Search by ABHA Address
- `POST /api/search/by-number` - Search by ABHA Number
- `POST /api/search/by-mobile` - Search by Mobile
- `POST /api/search/verify-address` - Check address availability

## Environment Variables

```env
CLIENT_ID=<your_abdm_client_id>
CLIENT_SECRET=<your_abdm_client_secret>
PUBLIC_KEY=<rsa_public_key_for_encryption>
ABDM_BASE_URL=https://dev.abdm.gov.in
ABHA_BASE_URL=https://abhasbx.abdm.gov.in
PORT=5000
NODE_ENV=development
```

## Security

- All sensitive data (Aadhaar, OTP) is RSA encrypted before sending to ABDM APIs
- Public key loaded from `.env` or `public-key.pem` file
- Client credentials never exposed to frontend
- Token-based authentication for profile access

## Error Handling

- Validation errors return 400 with clear messages
- API errors mapped from ABDM responses
- Network errors handled gracefully
- All errors logged to console

## Development

```bash
npm run dev  # Auto-restart on file changes
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use process manager (PM2, systemd)
3. Set up reverse proxy (nginx)
4. Configure HTTPS
5. Set secure CORS origins
