# Things We Skipped But Later On We Have To Add

This document tracks all features from the ABHA API collection that were NOT implemented in the current version but may be needed in future iterations.

---

## 📋 Complete Feature List from Postman Collection

### **Phase 1: Basic Enrollment (Aadhaar-based)** ✅ FULLY IMPLEMENTED
- [x] Session API (get access token)
- [x] Send OTP to Aadhaar mobile
- [x] Verify OTP and create ABHA
- [x] ABHA Address suggestions
- [x] Create/assign ABHA Address
- [x] Download ABHA card

---

### **Phase 2: Profile Management** ⚠️ PARTIALLY IMPLEMENTED
**Implemented:**
- [x] Get Profile Details (view full profile after enrollment/login)

**SKIPPED (To be added later):**
- [ ] Update Profile (name, DOB, gender, address, etc.)
- [ ] Update Profile Photo
- [ ] Generate QR Code
- [ ] Email Verification Link (send verification email)
- [ ] Mobile Update - Send OTP (for changing mobile number)
- [ ] Mobile Update - Verify OTP (confirm new mobile)

**Priority:** Medium  
**Reason Skipped:** Current version focuses on account creation; profile editing is Phase 2 enhancement  
**Effort:** 3-4 days  

---

### **Phase 3: Login System** ❌ COMPLETELY SKIPPED
- [ ] Login - Generate OTP (mobile OTP login)
- [ ] Login - Verify OTP
- [ ] Login with Password (password-based authentication)
- [ ] Login with ABHA Address
- [ ] Login with ABHA Number
- [ ] Token Refresh (refresh expired JWT tokens)
- [ ] Logout functionality

**Priority:** High (needed for returning users)  
**Reason Skipped:** Current flow is one-shot enrollment only; no session persistence  
**Effort:** 5-7 days for complete auth system  
**Notes:**  
- Need to implement session management
- Store refresh tokens securely
- Add "Remember Me" functionality
- Implement password creation/reset flow

---

### **Phase 4: Search & Verification** ✅ FULLY IMPLEMENTED
- [x] Search by ABHA Address
- [x] Search by ABHA Number
- [x] Search by Mobile
- [x] Verify ABHA Address availability

---

### **Phase 5: Advanced Features** ❌ COMPLETELY SKIPPED
- [ ] Link/Delink ABHA Addresses (manage multiple addresses per user)
- [ ] Account Authentication (verify credentials)
- [ ] Forgot ABHA workflows
- [ ] Account Recovery
- [ ] Delete ABHA Account

**Priority:** Low  
**Reason Skipped:** Advanced use cases; not needed for MVP  
**Effort:** 4-6 days  

---

### **Phase 6: Alternative Enrollment Methods** ❌ SKIPPED
- [ ] ABHA Enrolment via Driving License
  - [ ] Session API (DL-based)
  - [ ] Send OTP (DL)
  - [ ] Verify OTP (DL)
  - [ ] Enrol with Driving License
  - [ ] Get ABHA Suggestions (DL flow)
  - [ ] Create ABHA Address (DL flow)

**Priority:** Medium  
**Reason Skipped:** Aadhaar-based enrollment is primary method  
**Effort:** 3-4 days  
**Notes:** Similar flow to Aadhaar but uses DL as identity proof

---

## 🚧 Features We Should Prioritize Next

### **Immediate Priority (Next Sprint):**
1. **Login System (Phase 3)** - Essential for returning users
2. **Token Refresh** - Prevent users from re-enrolling
3. **Session Persistence** - Remember user across page refreshes

### **Medium Priority (1-2 months):**
4. **Profile Update** - Let users edit their information
5. **Email Verification** - Complete user profile
6. **Mobile Number Change** - Account maintenance

### **Low Priority (Future):**
7. **Driving License Enrollment** - Alternative ID proof
8. **Account Recovery** - Forgot ABHA workflows
9. **Multi-Address Management** - Link/delink addresses

---

## 🔒 Security Enhancements Skipped

**Current State:**  
- RSA encryption for Aadhaar/OTP ✅
- HTTPS required ✅
- Client credentials hidden in backend ✅
- Token-based auth for profile access ✅

**SKIPPED (To be added):**
- [ ] Rate limiting (prevent brute force)
- [ ] CAPTCHA on enrollment forms
- [ ] IP-based throttling
- [ ] Audit logging (track all API calls)
- [ ] Two-factor authentication (2FA)
- [ ] Device fingerprinting
- [ ] Suspicious activity alerts
- [ ] Account lockout after failed attempts

**Priority:** High  
**Effort:** 2-3 days  

---

## 🎨 UI/UX Enhancements Skipped

**Current Implementation:**
- Mobile responsive ✅
- Inline error messages ✅
- Loading spinners ✅
- Toast notifications ✅
- Step indicator ✅

**SKIPPED (To be added):**
- [ ] Multi-language support (Hindi, regional languages)
- [ ] Dark mode
- [ ] Accessibility improvements (WCAG 2.1 AA)
- [ ] Screen reader optimization
- [ ] Keyboard navigation
- [ ] Advanced form validation (real-time Aadhaar format check)
- [ ] Auto-fill suggestions
- [ ] Progress save (resume later)
- [ ] Print-friendly ABHA card view
- [ ] Tutorial/onboarding walkthrough

**Priority:** Medium  
**Effort:** 5-7 days  

---

## 📊 Analytics & Monitoring Skipped

- [ ] User analytics (enrollment funnel tracking)
- [ ] Error tracking (Sentry/LogRocket integration)
- [ ] Performance monitoring
- [ ] API response time tracking
- [ ] Success/failure rate dashboards
- [ ] User behavior analytics
- [ ] A/B testing framework

**Priority:** Low (for production deployments)  
**Effort:** 3-4 days  

---

## 🧪 Testing Infrastructure Skipped

- [ ] Unit tests (Jest/Mocha)
- [ ] Integration tests
- [ ] E2E tests (Playwright/Cypress)
- [ ] Load testing
- [ ] Security testing (OWASP)
- [ ] API contract testing
- [ ] Automated CI/CD pipeline

**Priority:** High (before production)  
**Effort:** 7-10 days for comprehensive suite  

---

## 📱 Additional Features Not in Postman Collection

**Potential Value-Adds:**
- [ ] Admin Dashboard
  - View all enrollments
  - User statistics
  - Error logs
  - System health monitoring
- [ ] Email/SMS Notifications
  - Enrollment success confirmation
  - OTP delivery fallback
  - Profile update alerts
- [ ] Bulk Enrollment (CSV upload)
- [ ] Export user data (GDPR compliance)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Developer portal for integration
- [ ] Webhook notifications for events

**Priority:** Varies  
**Effort:** 10+ days for complete admin system  

---

## 🗺️ Suggested Implementation Roadmap

### **Version 1.1 (Current + Critical Additions)**
- ✅ Phase 1: Enrollment *(done)*
- ✅ Phase 4: Search *(done)*
- ✅ Phase 2 (partial): Get Profile *(done)*
- **Add:** Login System (Phase 3)
- **Add:** Session persistence
- **Add:** Basic security (rate limiting)

### **Version 1.2 (Enhanced UX)**
- Profile management (update, photo, email)
- Better error handling
- Multi-language support
- Accessibility improvements

### **Version 2.0 (Advanced Features)**
- Driving License enrollment
- Account recovery
- Admin dashboard
- Analytics & monitoring
- Comprehensive testing

### **Version 2.1+ (Enterprise Features)**
- Bulk enrollment
- API for third-party integration
- Advanced security (2FA, device management)
- Compliance features (audit logs, GDPR)

---

## 📝 Notes for Future Development

1. **Public Key Rotation:**  
   Current implementation uses a static public key. Need to:
   - Implement automatic key fetching from ABDM Cert API
   - Add key rotation logic every 3 months
   - Cache keys efficiently

2. **Database Integration:**  
   Currently no database. Consider adding for:
   - User session management
   - Enrollment history
   - Analytics data
   - Caching API responses

3. **Environment Management:**  
   - Add staging environment
   - Separate sandbox/production configs
   - Feature flags for gradual rollouts

4. **Error Recovery:**  
   - Implement retry logic for failed API calls
   - Save form state on page refresh
   - Allow users to resume incomplete enrollments

5. **Performance Optimization:**  
   - Implement response caching
   - Lazy load images and assets
   - Optimize bundle size
   - Add service worker for offline support

---

## 🔗 Reference Links

- ABDM Developer Portal: https://sandbox.abdm.gov.in/
- ABHA Documentation: https://abha.abdm.gov.in/
- Postman Collection: `abha.json` (in project root)

---

**Last Updated:** November 24, 2025  
**Current Version:** 1.0  
**Next Review:** Before starting Version 1.1 development
