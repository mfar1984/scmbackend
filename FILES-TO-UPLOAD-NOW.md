# 📦 FILES TO COMPRESS & UPLOAD — atline-backend (scm-core.malaysiadev.com)

## 🚨 MASALAH SEKARANG:
1. ❌ `formidable` package missing → Error 500
2. ❌ `node_modules` incomplete → Cannot find modules
3. ⚠️ Using `output: standalone` but files missing

---

## ✅ SENARAI FAIL/FOLDER UNTUK COMPRESS

### 🔴 CRITICAL FILES (Must Have):
1. **`start.js`** ← Startup script (SUDAH ADA)
2. **`server.js`** ← Backup startup
3. **`package.json`** ← Dependencies list
4. **`package-lock.json`** ← Lock file
5. **`.env.production`** ← Environment variables

### 📁 FOLDERS (Must Have):
6. **`.next`** ← Build output (FULL folder including .next/standalone/)
7. **`pages`** ← All API routes and pages
8. **`components`** ← React components
9. **`lib`** ← Database, utilities, helpers
10. **`styles`** ← CSS files
11. **`public`** ← Static assets
12. **`prisma`** ← Database schema
13. **`scripts`** ← Utility scripts

### 📦 NODE MODULES (Choose ONE):

**OPTION A (Recommended - Faster Upload):**
- ❌ DON'T include `node_modules` folder
- ✅ Install di server: `npm install --production`

**OPTION B (Slower but Sure):**
- ✅ Include FULL `node_modules` folder (~500MB-1GB)
- ✅ Pastikan `formidable` ada di dalamnya

### 📄 CONFIG FILES:
14. **`next.config.ts`**
15. **`tsconfig.json`**
16. **`.htaccess`** (if ada)
17. **`postcss.config.mjs`** (if ada)

---

## 🎯 CARA COMPRESS (Windows)

### Step 1: Navigate to folder
```
f:\Programming\SCM\atline-backend
```

### Step 2: Select files
```
Pilih SEMUA files/folders dari senarai di atas
(Kalau guna Option A, JANGAN pilih node_modules)
```

### Step 3: Compress
```
Right-click → Send to → Compressed (zipped) folder
ATAU
Right-click → 7-Zip/WinRAR → Add to archive
```

### Step 4: Name the ZIP
```
Nama: atline-backend-complete.zip
```

---

## 📤 UPLOAD PROCESS

### 1. Login cPanel File Manager
```
Domain: scm-core.malaysiadev.com
Navigate to: /home/malaysiadev/scm-core.malaysiadev.com
```

### 2. Backup Current Files (Optional)
```
Select all current files → Compress → backup_before_fix.zip
Move backup to /home/malaysiadev/backups/
```

### 3. Delete Old Files
```
Select ALL files/folders EXCEPT .htaccess and backups
Delete
```

### 4. Upload New ZIP
```
Click Upload button
Select: atline-backend-complete.zip
Wait for upload to complete
```

### 5. Extract ZIP
```
Right-click ZIP file → Extract
Destination: /home/malaysiadev/scm-core.malaysiadev.com
Click Extract Files
```

---

## 🔧 SETUP DI SERVER (Terminal)

Login cPanel Terminal dan run commands ini:

```bash
# 1. Navigate to project folder
cd /home/malaysiadev/scm-core.malaysiadev.com

# 2. Activate Node.js environment
source /home/malaysiadev/nodevenv/scm-core.malaysiadev.com/24/bin/activate

# 3. Check files uploaded
echo "=== Checking Files ==="
ls -la start.js package.json .next/ pages/ lib/ | head -20

# 4. Install dependencies (IF you didn't upload node_modules)
echo ""
echo "=== Installing Dependencies ==="
npm install --production

# 5. Verify formidable installed
echo ""
echo "=== Checking formidable ==="
npm list formidable

# 6. Check prisma
echo ""
echo "=== Generating Prisma Client ==="
npx prisma generate

# 7. Done!
echo ""
echo "✅ Setup complete! Now configure cPanel Node.js App"
```

---

## ⚙️ CPANEL NODE.JS APP SETUP

### 1. Go to cPanel → Setup Node.js App

### 2. Find your app: scm-core.malaysiadev.com

### 3. Click "Edit" or "Stop" then edit

### 4. Set Application Startup File:
```
start.js
```

### 5. Set Environment Variables:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://your_user:your_pass@localhost:3306/your_database
SESSION_SECRET=your_secret_key_here
NEXTAUTH_URL=https://scm-core.malaysiadev.com
NEXTAUTH_SECRET=another_secret_here
```

### 6. Click "Save" then "Restart"

---

## 🔍 VERIFY SETELAH RESTART

### A. Check Server Log
```bash
tail -f ~/logs/scm-core.malaysiadev.com.log
```

**Should see:**
```
🚀 Starting ATLINE Backend...
📍 Environment: production
🌐 Port: 3000

✓ Ready in 2s
✓ Local: http://localhost:3000
```

**Should NOT see:**
```
❌ Error: Cannot find module 'formidable'
❌ Error: Cannot find module '/home/.../server.js'
```

### B. Test Website
Open browser:
```
https://scm-core.malaysiadev.com
```

**Should:**
- ✅ Load page (no white screen)
- ✅ Login page visible
- ✅ No JavaScript errors in console
- ✅ No 404 errors on CSS/JS files

**Should NOT:**
- ❌ White screen
- ❌ Network error messages
- ❌ 500 Internal Server Error

### C. Test API (After Login)
```
https://scm-core.malaysiadev.com/api/config/sounds
```

**Should:**
- ✅ Return JSON: `{"success":true,"data":[],"selected":""}`

**Should NOT:**
- ❌ 500 Internal Server Error
- ❌ Cannot find module errors

---

## 🆘 TROUBLESHOOTING

### Issue 1: "formidable not found"
```bash
cd /home/malaysiadev/scm-core.malaysiadev.com
source /home/malaysiadev/nodevenv/scm-core.malaysiadev.com/24/bin/activate
npm install formidable --save
npm install
# Restart app in cPanel
```

### Issue 2: "Cannot find module 'next'"
```bash
npm install next@16.2.10 react@19.2.4 react-dom@19.2.4 --save
npm install
# Restart app
```

### Issue 3: "Database connection failed"
```bash
# Check DATABASE_URL in .env.production
cat .env.production | grep DATABASE_URL

# Test database connection
mysql -h localhost -u your_user -p your_database
# (Enter password when prompted)
```

### Issue 4: "Prisma Client not generated"
```bash
source /home/malaysiadev/nodevenv/scm-core.malaysiadev.com/24/bin/activate
npx prisma generate
# Restart app
```

### Issue 5: "403 Forbidden on /api/config/general"
```
- This is PERMISSION ERROR (not file missing)
- User not logged in OR doesn't have permission
- Try login first, then test
```

---

## 📊 EXPECTED FILE SIZE

### Without node_modules:
- **ZIP size**: ~50-200 MB
- **Upload time**: 5-10 minutes (depending on speed)
- **Need to run**: `npm install` on server

### With node_modules:
- **ZIP size**: ~500 MB - 1 GB
- **Upload time**: 20-40 minutes
- **No need**: npm install

**Recommendation**: Upload WITHOUT node_modules, then install

---

## ✅ CHECKLIST BEFORE UPLOAD

- [ ] `start.js` file ada dalam ZIP
- [ ] `package.json` ada dalam ZIP
- [ ] `.next` folder ada dan lengkap
- [ ] `pages` folder ada (all API routes)
- [ ] `lib` folder ada (database connection)
- [ ] `prisma` folder ada (schema)
- [ ] `.env.production` ada dengan DATABASE_URL
- [ ] (Optional) `node_modules` folder

---

## ✅ CHECKLIST AFTER UPLOAD

- [ ] All files extracted successfully
- [ ] `npm install` completed (if no node_modules)
- [ ] `formidable` package installed
- [ ] `npx prisma generate` completed
- [ ] cPanel startup file set to `start.js`
- [ ] Environment variables configured
- [ ] Application restarted
- [ ] Website loads (no white screen)
- [ ] No 404 errors in browser console
- [ ] No 500 errors on API calls

---

## 🎯 ESTIMATED TIME

1. **Compress files**: 5 minutes
2. **Upload to cPanel**: 10-40 minutes (depending on size)
3. **Extract files**: 2 minutes
4. **Run npm install**: 5-10 minutes
5. **Configure & restart**: 2 minutes

**Total**: 25-60 minutes

---

## 💡 PRO TIPS

1. **Use WinRAR or 7-Zip** untuk compress - lebih cepat
2. **Compress level: Normal** - balance size vs speed
3. **Delete old files first** sebelum extract - avoid conflicts
4. **Check file permissions** after extract (755 for folders, 644 for files)
5. **Monitor server log** during first load untuk catch errors
6. **Test API endpoints** after login to verify database connection

---

## 🚀 READY TO GO!

Sekarang compress files mengikut senarai di atas, upload, dan ikut steps! 

**Current Status**: Website loads ✅ but API errors ❌

**After fix**: Website loads ✅ and API works ✅

**Let's go!** 🎯
