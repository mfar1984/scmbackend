# 🔧 cPanel Static Files 404 Fix - URGENT

## ⚡ Quick Fix (5 minutes)

### **Step 1: LOCAL - Rebuild WITHOUT standalone**

```bash
cd f:\Programming\SCM\atline-backend

# Delete old build
rd /s /q .next

# Rebuild (next.config.ts already fixed)
npm run build
```

### **Step 2: Upload ke Server**

**Upload HANYA ini:**
- `.next/` folder (FULL!)
- `start.js` (NEW file)
- `next.config.ts` (UPDATED)

Via File Manager cPanel atau SCP.

### **Step 3: cPanel - Change Startup File**

1. cPanel → **Setup Node.js App**
2. Find `scm-core.malaysiadev.com`
3. Click **EDIT**
4. **Change "Application startup file" to:** `start.js`
5. Click **SAVE**
6. Click **RESTART**

### **Step 4: Test**

Visit: https://scm-core.malaysiadev.com

Should work now! ✅

---

## 🎯 Why This Works

**Before (BROKEN):**
- `output: 'standalone'` creates minimal build
- Custom `server.js` doesn't serve static files properly in cPanel
- cPanel reverse proxy can't find `/_next/static/` files

**After (FIXED):**
- Standard Next.js build (no standalone)
- Use `start.js` which runs `next start`
- Next.js built-in server serves static files correctly
- cPanel proxy works perfectly

---

## 📋 Full Rebuild Steps (if needed)

### **1. Local**
```bash
cd f:\Programming\SCM\atline-backend

# Clean everything
rd /s /q .next node_modules

# Fresh install
npm install

# Build
npm run build
```

### **2. Verify Build**
Check these exist:
- `.next/static/chunks/`
- `.next/static/css/`
- `.next/server/`
- `.next/cache/`

### **3. Create Upload Package**
```bash
tar -czf atline-backend-cpanel-fix.tar.gz ^
  .next ^
  pages ^
  components ^
  lib ^
  styles ^
  public ^
  prisma ^
  scripts ^
  start.js ^
  next.config.ts ^
  package.json ^
  package-lock.json ^
  .env.production
```

### **4. Server - Extract**
```bash
cd /home/malaysiadev/scm-core.malaysiadev.com

# Backup old
mv .next .next.backup

# Extract new
tar -xzf ~/atline-backend-cpanel-fix.tar.gz
```

### **5. cPanel - Update Config**

**Application startup file:** `start.js`

**Environment variables** (already set, verify):
```
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
APP_PUBLIC_URL=https://scm-core.malaysiadev.com
NEXTAUTH_URL=https://scm-core.malaysiadev.com
NEXT_PUBLIC_WEBSITE_URL=https://scm.malaysiadev.com
```

Click **RESTART**

---

## ✅ Verify Success

Browser console should show:
- ✅ NO 404 errors
- ✅ CSS loaded
- ✅ JavaScript loaded
- ✅ Page fully rendered

---

## 🆘 Still Not Working?

### Check 1: Build completed successfully
```bash
# Local
npm run build
# Should end with "Compiled successfully"
```

### Check 2: Files uploaded
```bash
# Server terminal
cd /home/malaysiadev/scm-core.malaysiadev.com
ls -la .next/static/
# Should show folders: chunks, css, media
```

### Check 3: Startup file correct
cPanel → Node.js App → Check "Application startup file" = `start.js`

### Check 4: Restart actually worked
cPanel → Node.js App → Click STOP → Wait 5 sec → Click START

### Check 5: Check logs
cPanel → Node.js App → "View Log"

### Check 6: Hard refresh browser
Press: **Ctrl + Shift + R**

---

## 💡 Alternative Startup File

If `start.js` not working, try direct approach:

**Application startup file:** `node_modules/next/dist/bin/next`
**Application arguments:** `start -p 3000`

---

## 📞 Emergency Contact

Issue persists? Provide:
1. cPanel Node.js App log
2. Browser console screenshot
3. Output of: `ls -la .next/static/`

---

Last updated: Now
