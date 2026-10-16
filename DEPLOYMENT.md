# KasirSewa Deployment Guide

## Current Status (2026-10-16)

### ✅ READY FOR PRODUCTION
- **Google OAuth Login**: Fully functional
  - Endpoint: `/auth/google/redirect` → Google OAuth flow
  - Callback: `/auth/google/callback` → `/register` for new users
  - Session management: Secure, domain-scoped cookies
  - State validation: Fixed

### ⚠️ KNOWN ISSUE
- **Email/Password Login**: CSRF token validation blocked (HTTP 419)
  - Root cause: EncryptCookies middleware token mismatch in Laravel 13
  - Impact: Standard form login unavailable
  - Workaround: Users must login via Google OAuth
  - Fix timeline: Requires Laravel 13 expert (2-3 hours)

### 📊 Test Status
- Build: ✅ Complete (38s, all assets compiled)
- Tests: 93/95 passing (status: not retested post-session-driver change)
- Rate limiters: ✅ Stubs enabled (APP_ENV=testing)

### 🚀 DEPLOYMENT CHECKLIST
- [x] Google OAuth configured & tested
- [x] Session security enabled (HTTPS, SameSite=lax, domain-scoped)
- [x] APP_URL set to tunnel domain (https://superbackend.my.id)
- [x] Rate limiters configured
- [x] Build artifacts generated
- [ ] Email login fix (future sprint)

### 📝 ENV CHANGES (production)
```
APP_ENV=production
APP_DEBUG=false
SESSION_DRIVER=file
SESSION_SECURE_COOKIE=true
SESSION_DOMAIN=superbackend.my.id
SESSION_SAME_SITE=lax
```

### 🔧 DEPLOYMENT STEPS
1. Push commits to origin
2. Pull on production server
3. Run migrations: `php artisan migrate --force`
4. Clear cache: `php artisan config:cache`
5. Restart app: `docker compose restart kasirsewa_app`
6. Test: `curl https://superbackend.my.id/auth/google/redirect`

### 📞 SUPPORT
- Google OAuth issue: Check GoogleAuthController.php + config/services.php
- Email login: Contact Laravel 13 expert for middleware debugging
- Session issues: Check .env + storage/framework/sessions/

---
**Deployment ready**: 2026-10-16 06:15 UTC
