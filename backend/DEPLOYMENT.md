# ABHA M1 Backend - Render.com Deployment Guide

## Quick Deploy to Render.com

### 1. Create Render Account
- Go to https://render.com
- Sign up with GitHub

### 2. Create New Web Service
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Select the `backend` folder or root folder

### 3. Configure Service
```
Name: abha-m1-backend
Environment: Node
Region: Choose closest to India (Singapore recommended)
Branch: main
Root Directory: backend (if deploying from root)
Build Command: npm install
Start Command: node server.js
```

### 4. Environment Variables
Add these in Render dashboard:
```
NODE_ENV=production
PORT=5000
ABDM_CLIENT_ID=your_client_id
ABDM_CLIENT_SECRET=your_client_secret
```

### 5. After Deployment
- Copy the deployed URL (e.g., https://abha-m1-backend.onrender.com)
- Update frontend `utils.js` with this URL
- Redeploy frontend on Netlify

## Free Tier Limitations
- Service spins down after 15 mins of inactivity
- First request after spin-down takes 30-60 seconds
- 750 hours/month free

## Alternative: Railway.app
Similar process, also has free tier.
