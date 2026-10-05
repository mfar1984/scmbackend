# ✅ FIX: 403 Forbidden When Saving Settings

## THE PROBLEM
```
PUT https://scm-core.malaysiadev.com/api/config/general 403 (Forbidden)
```

**What this means:**
- ✅ You ARE logged in (authentication works)
- ❌ Your user role DOESN'T HAVE permission to update settings (authorization fails)

---

## 🔧 SOLUTION 1: Grant Permissions to Your Role (RECOMMENDED)

### Step 1: Find Your Role ID

1. Login to **cPanel**
2. Open **phpMyAdmin**
3. Select your database (the one in `.env.production`)
4. Run this query to find your user's role:

```sql
SELECT id, name, email, role_id FROM users WHERE email = 'your-email@example.com';
```

**Replace `'your-email@example.com'` with YOUR actual email.**

**Example result:**
```
id: 1
name: Admin User
email: admin@atline.com.my
role_id: 2
```

**Remember your `role_id` number!** (example: `2`)

---

### Step 2: Check What Roles Exist

```sql
SELECT * FROM roles;
```

**Example result:**
```
id: 1, name: Super Admin
id: 2, name: Admin
id: 3, name: Manager
id: 4, name: Staff
```

---

### Step 3: Grant Permissions to Your Role

**Replace `2` with YOUR `role_id` from Step 1:**

```sql
-- Grant permission to update ALL config settings
INSERT INTO role_permissions (role_id, module, permission) VALUES
(2, 'settings.config.general', 'Update'),
(2, 'settings.config.branding', 'Update'),
(2, 'settings.config.social_seo', 'Update'),
(2, 'settings.config.backup', 'Update'),
(2, 'settings.config.maintenance', 'Update');
```

**If you get "Duplicate entry" error, it means the permission already exists. That's OK!**

---

### Step 4: Logout and Login Again

1. Logout from the website
2. Login again
3. Try saving Global Config settings
4. **It should work now!** ✅

---

## 🔧 SOLUTION 2: Make Your User a Super Admin (EASIEST)

**Super Admin bypasses ALL permission checks.**

### Step 1: Find Super Admin Role ID

```sql
SELECT id, name FROM roles WHERE LOWER(name) = 'super admin';
```

**Example result:**
```
id: 1, name: Super Admin
```

---

### Step 2: Update Your User to Super Admin

**Replace `'your-email@example.com'` with YOUR email:**

```sql
UPDATE users SET role_id = 1 WHERE email = 'your-email@example.com';
```

---

### Step 3: Logout and Login Again

1. Logout from website
2. Login again
3. Try saving settings
4. **Should work now!** ✅

---

## 🔧 SOLUTION 3: Temporary Dev Fix (NOT RECOMMENDED)

**Only use this for testing on development server!**

### Edit the API file:

**File:** `f:\Programming\SCM\atline-backend\pages\api\config\[module].ts`

**Line 51-53:** Comment out the permission check:

```typescript
// ── PUT /api/config/:module ──────────────────────────────
if (req.method === 'PUT') {
  const auth = await getAuth(req);
  if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  
  // TEMPORARY: Comment out permission check for testing
  /*
  if (!(await hasPermission(auth, MODULE_PERM[module], 'Update'))) {
    return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
  }
  */
  
  const updates = req.body as Record<string, string>;
  // ... rest of code
```

**Then rebuild and redeploy:**

```bash
cd /home/malaysiadev/scm-core.malaysiadev.com
npm run build
pm2 restart all
```

**⚠️ WARNING: This removes all security checks! Only for testing!**

---

## 🔍 HOW TO VERIFY IT WORKS

### Method 1: Check Browser Console

1. Open website
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Try saving settings
5. Should see: `PUT /api/config/general 200 (OK)` ✅ (not 403)

---

### Method 2: Check Database

After saving, verify settings were saved:

```sql
SELECT * FROM config_settings WHERE module = 'general';
```

Should see your updated values!

---

## 📊 PERMISSION SYSTEM EXPLAINED

### How it works:

1. **User** has a `role_id` (from `users` table)
2. **Role** has permissions (from `role_permissions` table)
3. **Permission** format: `module_name` + `action`
   - Example: `'settings.config.general'` + `'Update'`

### Required permissions for Config settings:

| Module | Permission | Action |
|--------|-----------|--------|
| `settings.config.general` | `Update` | Save General Config |
| `settings.config.branding` | `Update` | Save Branding Config |
| `settings.config.social_seo` | `Update` | Save Social/SEO Config |
| `settings.config.backup` | `Update` | Save Backup Config |
| `settings.config.maintenance` | `Update` | Save Maintenance Config |

### Special role: **Super Admin**

- Role name EXACTLY: `"Super Admin"` (case-insensitive)
- **Bypasses ALL permission checks**
- Can do EVERYTHING

---

## 🎯 RECOMMENDED APPROACH

**For production server:**
- Use **SOLUTION 2** (Make yourself Super Admin) - easiest and safest

**For multi-user system:**
- Use **SOLUTION 1** (Grant specific permissions) - more secure

**For testing only:**
- Use **SOLUTION 3** (Comment out check) - quick but insecure

---

## ❓ COMMON QUESTIONS

### Q: I inserted permissions but still get 403?
**A:** Logout and login again. The system caches your role on login.

### Q: How do I know if I'm Super Admin?
**A:** Run this query:
```sql
SELECT u.email, r.name as role 
FROM users u 
LEFT JOIN roles r ON r.id = u.role_id 
WHERE u.email = 'your-email@example.com';
```

### Q: Can I have multiple Super Admins?
**A:** Yes! Just set multiple users to `role_id = 1` (Super Admin role).

### Q: What if Super Admin role doesn't exist?
**A:** Create it:
```sql
INSERT INTO roles (name, description) VALUES ('Super Admin', 'Full system access');
```

---

## ✅ SUCCESS INDICATORS

**You'll know it's fixed when:**

1. ✅ No more 403 errors in browser console
2. ✅ Success message appears after clicking Save
3. ✅ Settings are actually saved in database
4. ✅ Settings persist after page refresh

---

## 📝 QUICK COPY-PASTE COMMANDS

### Find your role ID:
```sql
SELECT id, email, role_id FROM users WHERE email = 'CHANGE_THIS@example.com';
```

### Make yourself Super Admin:
```sql
UPDATE users SET role_id = 1 WHERE email = 'CHANGE_THIS@example.com';
```

### Grant all config permissions:
```sql
INSERT INTO role_permissions (role_id, module, permission) VALUES
(YOUR_ROLE_ID, 'settings.config.general', 'Update'),
(YOUR_ROLE_ID, 'settings.config.branding', 'Update'),
(YOUR_ROLE_ID, 'settings.config.social_seo', 'Update'),
(YOUR_ROLE_ID, 'settings.config.backup', 'Update'),
(YOUR_ROLE_ID, 'settings.config.maintenance', 'Update');
```

**Replace:**
- `CHANGE_THIS@example.com` → Your actual email
- `YOUR_ROLE_ID` → Your role ID number

---

## 🆘 STILL NOT WORKING?

Check these:

1. **Logout and login** after making database changes
2. **Clear browser cache** (Ctrl + Shift + Delete)
3. **Check database connection** in `.env.production`
4. **Verify table names** are correct (some systems use prefixes)
5. **Check error logs** in `/home/malaysiadev/logs/atline_stderr.log`

---

Need more help? Check the database structure:
```sql
DESCRIBE users;
DESCRIBE roles;
DESCRIBE role_permissions;
```
