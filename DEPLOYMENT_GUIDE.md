# 🚀 ABHA M1 Deployment Guide

## Overview
- **Frontend**: Netlify (Static hosting)
- **Backend**: Render.com or Railway.app (Node.js hosting)

---

## 📦 Backend Deployment (Render.com)

### Step 1: Prepare Repository
1. Push your code to GitHub
2. Make sure `backend/` folder has all files

### Step 2: Deploy on Render
1. Go to https://render.com
2. Sign up/Login with GitHub
3. Click **"New +" → "Web Service"**
4. Connect your GitHub repository
5. Configure:
   ```
   Name: abha-m1-backend
   Environment: Node
   Region: Singapore (closest to India)
   Branch: main
   Root Directory: backend
   Build Command: npm install
   Start Command: node server.js
   ```

### Step 3: Environment Variables
Add in Render dashboard (Environment tab):
```
NODE_ENV=production
PORT=10000
ABDM_CLIENT_ID=your_sandbox_client_id
ABDM_CLIENT_SECRET=your_sandbox_secret
```

### Step 4: Deploy
- Click "Create Web Service"
- Wait 2-3 minutes for deployment
- Copy the deployed URL (e.g., `https://abha-m1-backend.onrender.com`)

---

## 🌐 Frontend Deployment (Netlify)

### Step 1: Update API URL
1. Open `frontend/js/utils.js`
2. Replace this line:
   ```javascript
   : 'https://your-backend-url.onrender.com/api'
   ```
   With your actual Render backend URL

### Step 2: Deploy on Netlify
1. Go to https://netlify.com
2. Sign up/Login
3. Click **"Add new site" → "Import an existing project"**
4. Connect GitHub repository
5. Configure:
   ```
   Base directory: frontend
   Build command: (leave empty)
   Publish directory: . (dot)
   ```

### Step 3: Deploy
- Click "Deploy site"
- Wait 1-2 minutes
- Your site will be live at `https://random-name.netlify.app`

### Step 4: Custom Domain (Optional)
- Go to Site settings → Domain management
- Add custom domain

---

## 🔧 Update Backend CORS

After deploying frontend, update backend CORS:

1. Open `backend/server.js`
2. Update line with your Netlify URL:
   ```javascript
   'https://your-actual-site.netlify.app'
   ```
3. Commit and push to GitHub
4. Render will auto-redeploy

---

## ✅ Testing

1. Open your Netlify URL
2. Try creating ABHA account
3. Check browser console for any errors
4. If backend shows CORS error, update CORS configuration

---

## 🆓 Free Tier Limitations

### Render.com
- ✅ 750 hours/month free
- ⚠️ Spins down after 15 mins inactivity
- ⚠️ First request takes 30-60 seconds to wake up

### Netlify
- ✅ 100GB bandwidth/month
- ✅ Instant global CDN
- ✅ No sleep/spin-down

---

## 🔐 Security Checklist

- [ ] Never commit `.env` files
- [ ] Use sandbox credentials only
- [ ] Update CORS to allow only your frontend domain
- [ ] Keep ABDM credentials secret
- [ ] Enable HTTPS (automatic on Netlify & Render)

---

## 🐛 Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Verify environment variables
- Check `package.json` has all dependencies

### Frontend can't connect to backend
- Check API_BASE_URL in `utils.js`
- Verify backend is running (visit `/health` endpoint)
- Check CORS configuration

### 502 Bad Gateway
- Backend is spinning down (wait 30 seconds)
- Or backend crashed (check Render logs)

---

## 📝 Post-Deployment Tasks

1. Test all flows:
   - ✅ Create new ABHA
   - ✅ Login with existing ABHA
   - ✅ Download ABHA card

2. Update README with live URLs

3. Monitor Render logs for errors

---

## 💡 Alternative Hosting Options

### Backend:
- **Railway.app** - Similar to Render, also free tier
- **Vercel** - Serverless (needs code modification)
- **Heroku** - No free tier anymore

### Frontend:
- **Vercel** - Great alternative to Netlify
- **GitHub Pages** - Free but needs custom domain for HTTPS
- **Cloudflare Pages** - Fast CDN

---

Need help? Check:
- Render Docs: https://render.com/docs
- Netlify Docs: https://docs.netlify.com
