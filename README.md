# ABHA Enrollment System

Complete full-stack application for creating Ayushman Bharat Health Account (ABHA) using ABDM APIs.

## 🎯 Features

### Current Implementation (v1.0)
- ✅ **Aadhaar-based Enrollment** - 3-step enrollment process
- ✅ **OTP Verification** - Secure OTP with timer and resend
- ✅ **ABHA Address Creation** - Suggestions + custom address
- ✅ **Profile Display** - View user profile after enrollment
- ✅ **ABHA Card Download** - Download official ABHA card
- ✅ **Search & Verification** - Search by Address/Number/Mobile
- ✅ **Mobile Responsive** - Works on all devices
- ✅ **Real-time Validation** - Inline error messages
- ✅ **Loading States** - Spinners and progress indicators
- ✅ **Toast Notifications** - User-friendly feedback

## 🏗️ Project Structure

```
Abha M1/
├── backend/                    # Node.js/Express backend
│   ├── server.js              # Main server file
│   ├── package.json           # Dependencies
│   ├── .env.example           # Environment variables template
│   ├── config/
│   │   └── constants.js       # API endpoints and constants
│   ├── routes/
│   │   ├── session.js         # Session management
│   │   ├── enrollment.js      # Enrollment flow APIs
│   │   ├── profile.js         # Profile APIs
│   │   └── search.js          # Search APIs
│   ├── utils/
│   │   ├── abdm.js            # ABDM API client
│   │   ├── encryption.js      # RSA encryption
│   │   └── validators.js      # Input validation
│   └── middleware/
│       ├── auth.js            # Token verification
│       └── errorHandler.js    # Global error handler
├── frontend/                   # Static frontend
│   ├── index.html             # Main page
│   ├── css/
│   │   └── styles.css         # Responsive styles
│   └── js/
│       ├── main.js            # App initialization
│       ├── enrollment.js      # Enrollment logic
│       └── utils.js           # Helper functions
├── abha.json                  # Postman API collection
└── README.md
```

## 🚀 Setup & Installation

### Prerequisites
- Node.js 16+ and npm
- ABDM Developer Account ([Register here](https://sandbox.abdm.gov.in/))
- Client ID and Client Secret from ABDM
- RSA Public Key for encryption

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in:
   ```env
   CLIENT_ID=your_abdm_client_id
   CLIENT_SECRET=your_abdm_client_secret
   PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
   YOUR_RSA_PUBLIC_KEY_HERE
   -----END PUBLIC KEY-----"
   ABDM_BASE_URL=https://dev.abdm.gov.in
   ABHA_BASE_URL=https://abhasbx.abdm.gov.in
   PORT=5000
   ```

4. **Start the server**
   ```bash
   npm start          # Production
   npm run dev        # Development (auto-reload)
   ```

   Server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Serve the frontend**
   
   **Option 1: Using Python**
   ```bash
   python -m http.server 3000
   ```

   **Option 2: Using Node.js http-server**
   ```bash
   npx http-server -p 3000
   ```

   **Option 3: Using VS Code Live Server**
   - Install Live Server extension
   - Right-click `index.html` → "Open with Live Server"

3. **Access the application**
   - Open browser: `http://localhost:3000`

## 📖 Usage Guide

### Creating New ABHA Account

1. **Enter Aadhaar Number**
   - Enter your 12-digit Aadhaar number
   - Click "Send OTP"
   - OTP will be sent to Aadhaar-linked mobile

2. **Verify OTP**
   - Enter 6-digit OTP
   - Enter your mobile number (for ABHA linkage)
   - Click "Verify & Create ABHA"

3. **Choose ABHA Address**
   - Select from suggested addresses
   - OR create your own custom address
   - Click "Create ABHA Address"

4. **View Profile & Download Card**
   - Your ABHA profile will be displayed
   - Download your official ABHA card (PDF)

### Searching Existing ABHA

1. Go to "Already Have ABHA" tab
2. Choose search method:
   - By ABHA Address (e.g., `username@abdm`)
   - By ABHA Number (14 digits)
   - By Mobile Number
3. View the profile

## 🔒 Security

- **Encryption:** Aadhaar and OTP are RSA encrypted before transmission
- **Token-based Auth:** JWT tokens for profile access
- **HTTPS:** Backend should be deployed with SSL in production
- **CORS:** Configured for specific origins only
- **Environment Variables:** Sensitive data never exposed to frontend
- **Input Validation:** All inputs validated on both client and server

## 🛠️ API Endpoints

### Session
- `GET /api/session/token` - Get access token
- `GET /api/session/health` - Check API health

### Enrollment
- `POST /api/enrollment/send-otp` - Send OTP to Aadhaar mobile
- `POST /api/enrollment/verify-otp` - Verify OTP & create ABHA
- `GET /api/enrollment/address-suggestions` - Get address suggestions
- `POST /api/enrollment/create-address` - Create ABHA address

### Profile
- `GET /api/profile` - Get user profile (requires X-Token)
- `GET /api/profile/card` - Download ABHA card (requires X-Token)

### Search
- `POST /api/search/by-address` - Search by ABHA Address
- `POST /api/search/by-number` - Search by ABHA Number
- `POST /api/search/by-mobile` - Search by Mobile
- `POST /api/search/verify-address` - Check address availability

## 🐛 Troubleshooting

### Backend won't start
- Check if `.env` file exists and has correct values
- Verify CLIENT_ID and CLIENT_SECRET are valid
- Ensure PUBLIC_KEY is properly formatted

### OTP not received
- Verify Aadhaar number is correct
- Check if mobile is linked with Aadhaar
- Wait 1-2 minutes, OTP may be delayed

### "Backend API is not reachable" error
- Ensure backend server is running on port 5000
- Check CORS settings if frontend is on different port
- Verify `API_BASE_URL` in `frontend/js/utils.js`

### Encryption errors
- Ensure PUBLIC_KEY format is correct (PEM format)
- Check key includes BEGIN and END markers
- Verify key hasn't expired (3-month validity)

## 📦 Deployment

### Backend (Node.js)

**Option 1: Traditional Server (Railway, Render, AWS EC2)**
```bash
# Set environment variables in hosting platform
# Deploy using Git or Docker
npm start
```

**Option 2: Docker**
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./
EXPOSE 5000
CMD ["npm", "start"]
```

### Frontend (Static)

**Option 1: Netlify/Vercel**
- Connect GitHub repo
- Set build directory: `frontend`
- Deploy

**Option 2: AWS S3 + CloudFront**
- Upload `frontend/` contents to S3 bucket
- Enable static website hosting
- Add CloudFront for HTTPS

**Option 3: GitHub Pages**
```bash
# From frontend directory
git subtree push --prefix frontend origin gh-pages
```

### Environment Variables for Production
```env
NODE_ENV=production
ABDM_BASE_URL=https://abdm.gov.in
ABHA_BASE_URL=https://abha.abdm.gov.in
# Add production CLIENT_ID and CLIENT_SECRET
```

## 🧪 Testing

```bash
# Test backend endpoints
curl http://localhost:5000/health
curl http://localhost:5000/api/session/health

# Check logs
npm start  # Watch console output
```

## 📚 Documentation

- [Things We Skipped](./Things%20we%20skipped%20but%20later%20on%20we%20have%20to%20add.md) - Future features
- [Backend README](./backend/README.md) - Backend API docs
- [ABDM Documentation](https://sandbox.abdm.gov.in/docs)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/login-system`)
3. Commit changes (`git commit -m 'Add login system'`)
4. Push to branch (`git push origin feature/login-system`)
5. Open Pull Request

## 📝 License

MIT License - feel free to use this project for your applications.

## 🙏 Acknowledgments

- **ABDM Team** - For providing the APIs
- **National Health Authority** - For the Ayushman Bharat initiative

## 📞 Support

For issues or questions:
- Check [Troubleshooting](#-troubleshooting) section
- Review console logs for error details
- Refer to ABDM documentation

---

**Version:** 1.0  
**Last Updated:** November 24, 2025  
**Status:** Production Ready (MVP)
