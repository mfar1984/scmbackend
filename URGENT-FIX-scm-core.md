# 🚨 URGENT FIX — scm-core.malaysiadev.com

## ❌ MASALAH YANG DIKENALPASTI (dari stderr.log)

1. **`server.js` NOT FOUND** - File startup tak ada
2. **`formidable` package missing** - node_modules incomplete
3. **⚠️ Warning**: `next start` tak boleh guna dengan `output: standalone`

---

## ✅ PENYELESAIAN SEGERA

### STEP 1: Compress Fail-Fail Yang Perlu

Compress fail/folder ini dari `f:\Programming\SCM\atline-backend`:

#### ⚠️ CRITICAL FILES (MUST HAVE):
1. **`start.js`** — ⚠️ INI PENTING! (kalau tak ada, create dulu)
2. **`server.js`** — Backup startup script
3. **`package.json`** — Dependencies list
4. **`package-lock.json`** — Lock file
5. **`.env.production`** — Environment variables

#### 📁 FOLDERS NEEDED:
6. **`.next`** folder (FULL - include `.next/standalone` folder)
7. **`pages`** folder
8. **`components`** folder
9. **`lib`** folder
10. **`styles`** folder
11. **`public`** folder
12. **`prisma`** folder
13. **`scripts`** folder
14. **`node_modules`** folder (ATAU install nanti di server)

#### 📄 CONFIG FILES:
15. **`next.config.ts`**
16. **`tsconfig.json`**
17. **`.htaccess`**
18. **`postcss.config.mjs`** (if exists)

---

## 📋 STEP 2: Check `start.js` Ada Atau Tidak

### Kalau `start.js` TAK ADA, create file ini:

**File: `f:\Programming\SCM\atline-backend\start.js`**
```javascript
#!/usr/bin/env node

/**
 * ATLINE Backend — Production Startup (cPanel Compatible)
 * Uses Next.js standalone server
 */

const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');

// Configuration
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

console.log('');
console.log('  ╔════════════════════════════════════════════╗');
console.log('  ║        ATLINE Backend — Starting...        ║');
console.log('  ╠════════════════════════════════════════════╣');
console.log(`  ║   Environment : ${process.env.NODE_ENV || 'production'}`.padEnd(48) + '║');
console.log(`  ║   Hostname    : ${hostname}`.padEnd(48) + '║');
console.log(`  ║   Port        : ${port}`.padEnd(48) + '║');
console.log('  ╚════════════════════════════════════════════╝');
console.log('');

// Try standalone server first
const standaloneServer = path.join(__dirname, '.next', 'standalone', 'server.js');
const fs = require('fs');

if (fs.existsSync(standaloneServer)) {
  console.log('✅ Using standalone server...');
  // Set environment for standalone
  process.env.HOSTNAME = hostname;
  process.env.PORT = String(port);
  require(standaloneServer);
} else {
  console.log('⚠️  Standalone server not found, using next start...');
  const next = require('next');
  const app = next({ 
    dev: false,
    hostname,
    port,
    dir: __dirname
  });
  const handle = app.getRequestHandler();

  app.prepare()
    .then(() => {
      createServer((req, res) => {
        try {
          const parsedUrl = parse(req.url, true);
          handle(req, res, parsedUrl);
        } catch (err) {
          console.error('Error:', err);
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      })
      .listen(port, hostname, (err) => {
        if (err) {
          console.error('❌ Failed to start:', err);
          process.exit(1);
        }
        console.log(`✅ Server ready on http://${hostname}:${port}`);
      });
    })
    .catch((err) => {
      console.error('❌ Failed to prepare:', err);
      process.exit(1);
    });
}
```

---

## 📤 STEP 3: Upload Process

### A. Compress
```
1. Pilih SEMUA fail/folder dari senarai di atas
2. Right-click → Compress to ZIP
3. Nama: atline-backend-fixed.zip
```

### B. Upload ke cPanel
```
1. Login cPanel File Manager
2. Navigate to: /home/malaysiadev/scm-core.malaysiadev.com
3. Upload atline-backend-fixed.zip
4. Extract ZIP file
5. DELETE old files first (backup dulu kalau perlu)
```

---

## 🔧 STEP 4: Setup Di Server (Terminal Commands)

Login cPanel Terminal dan run:

```bash
# Navigate to project
cd /home/malaysiadev/scm-core.malaysiadev.com

# Activate Node.js environment
source /home/malaysiadev/nodevenv/scm-core.malaysiadev.com/24/bin/activate

# Check files ada atau tidak
echo "=== Checking Critical Files ==="
ls -la start.js server.js package.json 2>/dev/null || echo "⚠️ Files missing!"

# Install dependencies (PENTING!)
echo ""
echo "=== Installing Dependencies ==="
npm install --production

# Verify formidable installed
echo ""
echo "=== Checking formidable package ==="
ls node_modules/formidable/ 2>/dev/null && echo "✅ formidable OK" || echo "❌ formidable MISSING"

# Check standalone server
echo ""
echo "=== Checking Standalone Server ==="
ls -la .next/standalone/server.js 2>/dev/null && echo "✅ Standalone OK" || echo "❌ Standalone MISSING"
```

---

## ⚙️ STEP 5: Configure cPanel Node.js App

Di cPanel → Setup Node.js App:

1. **Application Startup File**: `start.js` ← PENTING!
2. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=mysql://user:pass@host:port/database
   ```

3. **Click "RESTART"**

---

## 🔍 STEP 6: Verify & Test

### A. Check Server Logs
```bash
tail -f ~/logs/scm-core.malaysiadev.com.log
```

Should see:
```
✅ Server ready on http://0.0.0.0:3000
```

### B. Test Website
```
https://scm-core.malaysiadev.com
```

Should load WITHOUT:
- ❌ White screen
- ❌ 404 errors
- ❌ 500 errors
- ❌ Network errors

### C. Test API
```bash
# Test dari terminal
curl https://scm-core.malaysiadev.com/api/config/sounds
```

Should return JSON, not error.

---

## 🆘 IF STILL ERROR

### Error: "formidable not found"
```bash
cd /home/malaysiadev/scm-core.malaysiadev.com
source /home/malaysiadev/nodevenv/scm-core.malaysiadev.com/24/bin/activate
npm install formidable --save
npm install
```

### Error: "standalone server.js not found"
```bash
# Check if .next/standalone exists
ls -la .next/standalone/

# If not, need to rebuild locally with output: 'standalone'
# Then re-upload full .next folder
```

### Error: "Cannot find module 'next'"
```bash
npm install next react react-dom --save
npm install
```

---

## 📊 CHECKLIST

Sebelum test, pastikan:

- [ ] `start.js` file ada di root folder
- [ ] `package.json` dan `package-lock.json` ada
- [ ] `.next/standalone/server.js` ada
- [ ] `node_modules/formidable` folder ada
- [ ] `node_modules/next` folder ada
- [ ] `.env.production` ada dengan DATABASE_URL
- [ ] cPanel startup file set to `start.js`
- [ ] cPanel environment variables set
- [ ] Application restarted

---

## 💡 IMPORTANT NOTES

1. **`output: 'standalone'` MUST USE `.next/standalone/server.js`**
   - Cannot use `next start` command
   - `start.js` will automatically use standalone server

2. **`formidable` is REQUIRED**
   - Used for file uploads
   - Must be in node_modules

3. **Database Connection**
   - 500 errors likely due to database connection issue
   - Check `.env.production` has correct DATABASE_URL
   - Test database connection

4. **403 Errors**
   - Permission issue
   - Check session/authentication
   - May need to login again

---

## 🎯 QUICK FIX SUMMARY

```bash
# 1. Create/check start.js locally
# 2. Compress all files/folders
# 3. Upload to server
# 4. Run in terminal:

cd /home/malaysiadev/scm-core.malaysiadev.com
source /home/malaysiadev/nodevenv/scm-core.malaysiadev.com/24/bin/activate
npm install --production
# 5. Set startup file to: start.js
# 6. Restart app
# 7. Test
```

---

**STATUS**: Website loads tapi API errors = File uploads incomplete

**NEXT**: Upload missing files + install dependencies

**ETA**: 10-15 minutes after upload complete
