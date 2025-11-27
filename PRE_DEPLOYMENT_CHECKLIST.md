# 🎯 Pre-Deployment Checklist

## ✅ Code Ready
- [x] Verification tab removed
- [x] API URL configured for production
- [x] CORS configured for Netlify
- [x] Environment variable examples created
- [x] Deployment guides created

## 📋 Before Deploying

### Backend
- [ ] Push code to GitHub
- [ ] Have ABDM sandbox credentials ready
- [ ] Create Render.com account
- [ ] Note down backend URL after deployment

### Frontend
- [ ] Update `frontend/js/utils.js` with backend URL (line 6)
- [ ] Test locally one more time
- [ ] Push updated code to GitHub
- [ ] Create Netlify account

## 🚀 Deployment Steps

### 1. Deploy Backend First
1. [ ] Go to Render.com
2. [ ] Create new Web Service
3. [ ] Connect GitHub repo
4. [ ] Configure build settings (see DEPLOYMENT_GUIDE.md)
5. [ ] Add environment variables
6. [ ] Deploy and copy URL

### 2. Update Frontend with Backend URL
1. [ ] Open `frontend/js/utils.js`
2. [ ] Replace `'https://your-backend-url.onrender.com/api'` with actual URL
3. [ ] Commit and push

### 3. Deploy Frontend
1. [ ] Go to Netlify
2. [ ] Import from GitHub
3. [ ] Set base directory to `frontend`
4. [ ] Deploy
5. [ ] Copy Netlify URL

### 4. Update Backend CORS
1. [ ] Open `backend/server.js`
2. [ ] Replace `'https://your-netlify-site.netlify.app'` with actual URL
3. [ ] Commit and push
4. [ ] Render will auto-redeploy

## 🧪 Testing After Deployment
- [ ] Visit Netlify URL
- [ ] Test ABHA creation flow
- [ ] Test login flow
- [ ] Download ABHA card
- [ ] Check browser console for errors
- [ ] Test on mobile device

## 📊 URLs to Save
```
Backend URL: ____________________________________
Frontend URL: ___________________________________
GitHub Repo: ____________________________________
```

## 🔒 Security
- [ ] Never commit `.env` files
- [ ] Keep ABDM credentials in Render environment variables only
- [ ] Update CORS to specific domain (not `*`)

## 📱 Optional Enhancements (Later)
- [ ] Custom domain for Netlify site
- [ ] SSL certificate (auto with Netlify)
- [ ] Google Analytics
- [ ] Error monitoring (Sentry)
- [ ] Performance monitoring

---

**Ready to deploy?** Follow steps in `DEPLOYMENT_GUIDE.md`
