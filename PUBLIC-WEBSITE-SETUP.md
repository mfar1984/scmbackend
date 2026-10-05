# 🌐 ATLINE Public Website - Setup Guide

## URLs Configuration

- **Backend Admin:** https://core.malaysiadev.com (already deployed)
- **Public Website:** https://atline.malaysiadev.com (this guide)

---

## ❓ Do You Need Node.js Variables for Public Website?

### Short Answer: **YES** ✅

The public website needs environment variables to connect to the backend admin panel.

---

## 🔗 Why Public Website Needs Backend Connection

Your public website needs to:
1. **Fetch dynamic content** from backend (CMS content, downloads, gallery)
2. **Submit forms** (contact forms, applications, tender inquiries)
3. **Display latest data** (job postings, tenders, announcements)
4. **Trigger cache revalidation** when content updates in backend

---

## 📋 Environment Variables for Public Website

Create `.env.production` in your **public website** project:

```env
# ============================================
# ATLINE Public Website - Production
# Domain: https://atline.malaysiadev.com
# ============================================

# Backend API Connection
NEXT_PUBLIC_API_URL=https://core.malaysiadev.com/api
API_URL=https://core.malaysiadev.com/api

# Revalidation Secret (must match backend)
REVALIDATE_SECRET=SAME_SECRET_AS_BACKEND

# Public Website URL
NEXT_PUBLIC_SITE_URL=https://atline.malaysiadev.com

# Node Environment
NODE_ENV=production

# ============================================
# Optional: External Services
# ============================================

# Google Analytics (if using)
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Google Maps API (if using)
# NEXT_PUBLIC_GOOGLE_MAPS_KEY=

# Google ReCAPTCHA (for forms)
# NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
# RECAPTCHA_SECRET_KEY=
```

---

## 🔐 Important Variables Explained

### 1. NEXT_PUBLIC_API_URL
**Purpose:** Frontend JavaScript needs this to call backend APIs

**Example usage in public website:**
```javascript
// Fetch job postings
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/career/postings`);

// Submit contact form
await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact`, {
  method: 'POST',
  body: JSON.stringify(formData)
});
```

### 2. API_URL (without NEXT_PUBLIC)
**Purpose:** Server-side API calls (SSR, SSG)

**Example usage:**
```javascript
// In getServerSideProps or getStaticProps
export async function getStaticProps() {
  const res = await fetch(`${process.env.API_URL}/web/content`);
  const data = await res.json();
  return { props: { data } };
}
```

### 3. REVALIDATE_SECRET
**Purpose:** Backend triggers cache revalidation when content updates

**How it works:**
1. Admin updates content in backend CMS
2. Backend sends revalidation request to public website
3. Public website rebuilds only affected pages
4. Users see updated content immediately

**Security:** Must be the same secret in both backend and public website.

---

## 🔄 How Backend & Public Website Communicate

### Data Flow:

```
┌─────────────────────────────────────────────┐
│  Backend (core.malaysiadev.com)             │
│  - CMS Content Management                    │
│  - Database Storage                          │
│  - API Endpoints                             │
└─────────────────┬───────────────────────────┘
                  │
                  │ API Calls
                  │ (REST/JSON)
                  │
┌─────────────────▼───────────────────────────┐
│  Public Website (atline.malaysiadev.com)    │
│  - Fetch content from backend               │
│  - Display to visitors                       │
│  - Submit forms to backend                   │
└─────────────────────────────────────────────┘
```

### Example API Endpoints:

**Backend provides:**
```
GET  /api/web/content          → Homepage content
GET  /api/web/about            → About page content
GET  /api/web/services         → Services list
GET  /api/career/postings      → Job postings
GET  /api/web/downloads        → Downloads list
GET  /api/web/gallery          → Gallery images
POST /api/contact              → Contact form submission
POST /api/career/apply         → Job application submission
```

**Public website calls:**
```javascript
// Example: Fetch homepage content
const getHomeContent = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/web/content`);
  return res.json();
};

// Example: Submit contact form
const submitContact = async (formData) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  return res.json();
};
```

---

## 🚀 Deployment Steps for Public Website

### 1. Build Public Website Locally
```bash
cd f:\Programming\atline-website\atline-website  # (or your public site folder)
npm run build
```

### 2. Create .env File
Create `.env` with production values (see above)

### 3. Upload to cPanel
Upload to different directory:
```
/home/username/atline.malaysiadev.com/
```

**Files to upload:**
- `.next/` folder
- `public/` folder
- `package.json`
- `package-lock.json`
- `next.config.ts`
- `server.js` (same as backend)
- `.env` file

### 4. Setup Node.js App in cPanel
- Create new Node.js application
- Application Root: `atline.malaysiadev.com`
- Application URL: `atline.malaysiadev.com`
- Startup File: `server.js`

### 5. Install Dependencies
```bash
cd ~/atline.malaysiadev.com
source /home/username/nodevenv/atline.malaysiadev.com/18/bin/activate
npm install --production
```

### 6. Setup SSL
- Install Let's Encrypt for `atline.malaysiadev.com`
- Force HTTPS redirect

### 7. Restart Application
- cPanel → Setup Node.js App → Restart

---

## ✅ Verify Public Website Works

### Test Checklist:
- [ ] Homepage loads: https://atline.malaysiadev.com
- [ ] Content displays from backend CMS
- [ ] Contact form submission works
- [ ] Job postings display
- [ ] Downloads work
- [ ] Gallery loads images
- [ ] All links work correctly

---

## 🔄 Cache Revalidation Setup

### Backend Configuration

In backend, when content updates, trigger revalidation:

```javascript
// Example: After updating CMS content
async function revalidatePublicSite(path) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_WEBSITE_URL}/api/revalidate?secret=${process.env.REVALIDATE_SECRET}&path=${path}`
  );
  return res.json();
}

// Usage:
await revalidatePublicSite('/'); // Revalidate homepage
await revalidatePublicSite('/about'); // Revalidate about page
await revalidatePublicSite('/services'); // Revalidate services page
```

### Public Website API Route

Create `pages/api/revalidate.ts` in public website:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check secret
  if (req.query.secret !== process.env.REVALIDATE_SECRET) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    const path = req.query.path as string || '/';
    
    // Revalidate the path
    await res.revalidate(path);
    
    return res.json({ revalidated: true, path });
  } catch (err) {
    return res.status(500).json({ message: 'Error revalidating' });
  }
}
```

This allows backend to refresh public website content instantly when admins make changes.

---

## 🔐 Security Considerations

### API Security

**Backend should validate:**
- Rate limiting on public endpoints
- CORS headers for frontend
- Input validation
- File upload restrictions

**Example CORS setup in backend:**
```javascript
// In backend next.config.ts
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://atline.malaysiadev.com' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
      ],
    },
  ];
},
```

---

## 📊 Monitoring Both Sites

### Health Check Endpoints

**Backend:**
```
GET https://core.malaysiadev.com/api/health
Response: { status: 'ok', timestamp: '...' }
```

**Public Website:**
```
GET https://atline.malaysiadev.com/api/health
Response: { status: 'ok', backend: 'connected' }
```

---

## 🆘 Troubleshooting

### Issue: Public site can't connect to backend

**Check:**
1. Backend is running: https://core.malaysiadev.com
2. API endpoints work: https://core.malaysiadev.com/api/health
3. CORS headers allow public domain
4. Environment variables are correct

**Test API connection:**
```bash
# From public site terminal
curl https://core.malaysiadev.com/api/health
```

### Issue: Stale content on public site

**Causes:**
1. Cache not revalidating
2. Wrong REVALIDATE_SECRET
3. Revalidation endpoint not working

**Fix:**
- Check secrets match in both sites
- Test revalidation manually:
  ```
  https://atline.malaysiadev.com/api/revalidate?secret=YOUR_SECRET&path=/
  ```

---

## ✅ Summary

**YES, you need environment variables for public website!**

**Minimum required:**
```env
NEXT_PUBLIC_API_URL=https://core.malaysiadev.com/api
REVALIDATE_SECRET=same_secret_as_backend
NODE_ENV=production
```

**Optional but recommended:**
```env
NEXT_PUBLIC_GA_ID=your_analytics_id
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_key
```

The public website communicates with backend for:
- ✅ Dynamic content (CMS)
- ✅ Form submissions
- ✅ Job postings
- ✅ Downloads
- ✅ Gallery images
- ✅ Contact forms
- ✅ Applications

Without these variables, your public website would be completely static with no dynamic content! 🚫

---

## 📞 Next Steps

1. ✅ Deploy backend to https://core.malaysiadev.com (done)
2. ⏳ Create public website `.env.production` file
3. ⏳ Build public website
4. ⏳ Deploy public website to https://atline.malaysiadev.com
5. ⏳ Test connection between both sites
6. ⏳ Configure cache revalidation

Need help with any step? Ask away! 🚀
