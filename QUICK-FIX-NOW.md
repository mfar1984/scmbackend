# 🚨 QUICK FIX NOW — scm-core.malaysiadev.com

## ❌ MASALAH:
1. **Port 3000 already in use** - Process conflict
2. **formidable package missing** - Module not found
3. **output: standalone warning** - Wrong startup method

---

## ✅ PENYELESAIAN CEPAT (5 MINIT)

### STEP 1: Upload File Yang Updated

**File yang perlu upload (updated):**
1. `start.js` ← UPDATED! (f:\Programming\SCM\atline-backend\start.js)

**Cara upload:**
```
1. Login cPanel File Manager
2. Navigate: /home/malaysiadev/scm-core.malaysiadev.com
3. Upload start.js (overwrite existing)
```

---

### STEP 2: Run Commands Di Terminal

Login **cPanel Terminal** dan copy-paste commands ni **SATU PER SATU**:

```bash
# Navigate to project
cd /home/malaysiadev/scm-core.malaysiadev.com

# Activate Node.js
source /home/malaysiadev/nodevenv/scm-core.malaysiadev.com/24/bin/activate

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Pause sebentar, then continue:**

```bash
# Install formidable
npm install formidable --save

# Install all dependencies
npm install --production
```

**Wait for installation (~2-3 minutes), then:**

```bash
# Generate Prisma Client
npx prisma generate

# Verify formidable installed
npm list formidable
```

**Should see:**
```
atline-backend@1.0.0
└── formidable@3.x.x
```

---

### STEP 3: Restart Application

**Di cPanel:**
```
1. Go to: Setup Node.js App
2. Find: scm-core.malaysiadev.com
3. Click: STOP (if running)
4. Verify: Application Startup File = start.js
5. Click: START
```

**OR just click RESTART if already stopped**

---

### STEP 4: Verify

**Check terminal log:**
```bash
tail -f ~/logs/scm-core.malaysiadev.com.log
```

**Should see:**
```
🚀 Starting ATLINE Backend...
📍 Environment: production
🌐 Port: 3000

✅ Using standalone server...
(OR)
📦 Using standard Next.js server...

✓ Ready in 2s
```

**Should NOT see:**
```
❌ Error: listen EADDRINUSE
❌ Cannot find package 'formidable'
```

---

### STEP 5: Test Website

Open browser:
```
https://scm-core.malaysiadev.com
```

**Should work:**
- ✅ Page loads
- ✅ No white screen
- ✅ No JavaScript errors
- ✅ API calls work (after login)

---

## 🆘 IF STILL ERROR

### Error: "Port still in use"
```bash
# Force kill all node processes
pkill -9 node

# Wait 5 seconds
sleep 5

# Restart app in cPanel
```

### Error: "formidable still missing"
```bash
cd /home/malaysiadev/scm-core.malaysiadev.com
source /home/malaysiadev/nodevenv/scm-core.malaysiadev.com/24/bin/activate

# Force reinstall
rm -rf node_modules/formidable
npm install formidable --save --force

# Verify
ls -la node_modules/formidable/
```

### Error: "Standalone server not found"
```
This is OK! start.js will fallback to standard Next.js server
Website should still work
```

---

## 📊 EXPECTED RESULT

**Before Fix:**
- ❌ Port conflict (EADDRINUSE)
- ❌ formidable missing (500 errors)
- ❌ Website loads but API fails

**After Fix:**
- ✅ No port conflict
- ✅ formidable installed
- ✅ Website loads AND API works

---

## ⏱️ TIME ESTIMATE

1. Upload start.js: **1 minute**
2. Run terminal commands: **3-5 minutes**
3. Restart app: **1 minute**
4. Test: **1 minute**

**Total: 6-8 minutes**

---

## 💡 IMPORTANT NOTES

1. **MUST activate Node.js environment first**:
   ```bash
   source /home/malaysiadev/nodevenv/scm-core.malaysiadev.com/24/bin/activate
   ```

2. **MUST kill process on port 3000**:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

3. **MUST install formidable**:
   ```bash
   npm install formidable --save
   ```

4. **start.js now handles both standalone AND standard builds**
   - Tries standalone first
   - Falls back to next start if standalone missing

---

## ✅ CHECKLIST

Before restart:
- [ ] start.js uploaded (updated version)
- [ ] Port 3000 killed (no process)
- [ ] formidable installed (npm list shows it)
- [ ] Prisma client generated
- [ ] cPanel startup file = start.js

After restart:
- [ ] No "EADDRINUSE" error in log
- [ ] No "formidable" error in log
- [ ] Website loads successfully
- [ ] API endpoints working

---

## 🎯 READY?

1. ✅ Upload `start.js` yang baru
2. ✅ Run terminal commands
3. ✅ Restart app
4. ✅ Test!

**GO! 🚀**
