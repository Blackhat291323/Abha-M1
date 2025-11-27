# Quick Start Guide

Get your ABHA Enrollment System up and running in 5 minutes!

## 📋 Prerequisites Checklist

- [ ] Node.js 16+ installed
- [ ] ABDM Client ID & Client Secret
- [ ] RSA Public Key for encryption
- [ ] Text editor (VS Code recommended)

## 🚀 5-Minute Setup

### Step 1: Backend Setup (2 minutes)

```powershell
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
copy .env.example .env
```

**Edit `.env` file:**
```env
CLIENT_ID=your_client_id_here
CLIENT_SECRET=your_client_secret_here
PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"
```

```powershell
# Start backend server
npm start
```

✅ Backend running on http://localhost:5000

### Step 2: Frontend Setup (1 minute)

```powershell
# Open new terminal, navigate to frontend
cd frontend

# Serve frontend (choose one)
# Option A - Python
python -m http.server 3000

# Option B - Node.js
npx http-server -p 3000

# Option C - VS Code Live Server
# Right-click index.html → "Open with Live Server"
```

✅ Frontend running on http://localhost:3000

### Step 3: Test the Application (2 minutes)

1. Open browser: http://localhost:3000
2. Click "Get Started"
3. Enter test Aadhaar: `123456789012` (sandbox)
4. Complete OTP flow
5. Create ABHA address

## 🧪 Testing with Sandbox

ABDM Sandbox test credentials:
- **Aadhaar:** Use any 12-digit number
- **OTP:** Check ABDM console or use `123456`
- **Mobile:** Any 10-digit number starting with 6-9

## ⚠️ Common Issues

### ❌ "Cannot find module" error
```powershell
cd backend
npm install
```

### ❌ "Backend API not reachable"
- Check backend is running on port 5000
- Verify `API_BASE_URL` in `frontend/js/utils.js`

### ❌ "Invalid credentials" error
- Double-check CLIENT_ID and CLIENT_SECRET in `.env`
- Ensure no extra spaces or quotes

### ❌ "Encryption failed"
- Verify PUBLIC_KEY format (must include BEGIN/END markers)
- Check for line breaks in key

## 🎯 Next Steps

1. **Get Real Credentials:**
   - Register at https://sandbox.abdm.gov.in/
   - Request production access

2. **Customize:**
   - Update branding in `frontend/css/styles.css`
   - Modify text content in `frontend/index.html`

3. **Deploy:**
   - See README.md deployment section
   - Set environment to production

## 📚 Resources

- Main README: `README.md`
- Backend API Docs: `backend/README.md`
- Feature Roadmap: `Things we skipped but later on we have to add.md`
- ABDM Docs: https://sandbox.abdm.gov.in/docs

## 🆘 Need Help?

1. Check browser console (F12) for errors
2. Check backend terminal logs
3. Verify .env configuration
4. Review ABDM API status

---

**Ready?** Open http://localhost:3000 and start creating ABHA accounts! 🎉
