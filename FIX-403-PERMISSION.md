# 🔐 FIX 403 FORBIDDEN ERROR — Cannot Save Global Config

## ❌ MASALAH:

Website loads ✅  
API works ✅  
**TAPI**: Cannot save Global Config settings → **403 Forbidden**

```
PUT /api/config/general 403 (Forbidden)
"You do not have permission to perform this action."
```

---

## 🔍 ROOT CAUSE:

**User logged in TAPI role TIDAK ADA PERMISSION untuk:**
- Module: `settings.config.general`
- Permission: `Update`

---

## ✅ PENYELESAIAN:

### OPTION 1: Grant Permission via Database (Recommended)

Run SQL commands ni di cPanel phpMyAdmin atau terminal:

#### A. Check Current User Role
```sql
-- Login user apa role dia?
SELECT u.id, u.username, u.email, u.role_id, r.name as role_name
FROM users u
LEFT JOIN roles r ON r.id = u.role_id
WHERE u.email = 'your_email@example.com';
-- Atau
WHERE u.username = 'your_username';
```

**Result contoh:**
```
id  | username | role_id | role_name
----|----------|---------|-------------
1   | admin    | 1       | Super Admin
```

#### B. Check Permission Exists
```sql
-- Check role ada permission atau tidak
SELECT * 
FROM role_permissions 
WHERE role_id = 1 
AND module = 'settings.config.general' 
AND permission = 'Update';
```

**If NO ROWS = permission missing!**

#### C. Add Permission
```sql
-- Add permission untuk role
INSERT INTO role_permissions (role_id, module, permission)
VALUES (1, 'settings.config.general', 'Update');

-- Add all config permissions sekalian
INSERT INTO role_permissions (role_id, module, permission) VALUES
(1, 'settings.config.general', 'Update'),
(1, 'settings.config.branding', 'Update'),
(1, 'settings.config.social_seo', 'Update'),
(1, 'settings.config.backup', 'Update'),
(1, 'settings.config.maintenance', 'Update');
```

**Note:** Replace `1` dengan `role_id` yang betul dari Step A

---

### OPTION 2: Make User Super Admin

Super Admin bypass all permissions:

```sql
-- Update user role to Super Admin
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE LOWER(TRIM(name)) = 'super admin' LIMIT 1)
WHERE id = 1;
-- Replace 1 with your user id
```

**OR create Super Admin role if not exists:**

```sql
-- Check if Super Admin role exists
SELECT * FROM roles WHERE LOWER(TRIM(name)) = 'super admin';

-- If not exist, create it
INSERT INTO roles (name, description) 
VALUES ('Super Admin', 'Full system access');

-- Then update user
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE LOWER(TRIM(name)) = 'super admin' LIMIT 1)
WHERE id = 1;
```

---

### OPTION 3: Temporary Fix (Dev Only) - Bypass Permission Check

**⚠️ FOR DEVELOPMENT ONLY! NOT FOR PRODUCTION!**

Edit `pages/api/config/[module].ts`:

```typescript
// Line ~50, comment out permission check temporarily
if (req.method === 'PUT') {
  const auth = await getAuth(req);
  if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  
  // TEMPORARY FIX: Comment out permission check
  /*
  if (!(await hasPermission(auth, MODULE_PERM[module], 'Update'))) {
    return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
  }
  */
  
  // Rest of code...
}
```

**After bypass, you can save → then grant proper permissions → then uncomment**

---

## 🎯 STEP-BY-STEP FIX (RECOMMENDED)

### 1. Login cPanel → phpMyAdmin

### 2. Select your database

### 3. Click "SQL" tab

### 4. Run this SQL (replace values):

```sql
-- Step 1: Find your user ID and role
SELECT u.id as user_id, u.username, u.email, u.role_id, r.name as role_name
FROM users u
LEFT JOIN roles r ON r.id = u.role_id
WHERE u.email = 'admin@atline.com.my'  -- ← CHANGE THIS
LIMIT 1;
```

**Note the `role_id` from result**

### 5. Grant permissions:

```sql
-- Step 2: Add permissions for that role_id
-- Replace 1 with actual role_id from Step 1
INSERT INTO role_permissions (role_id, module, permission) VALUES
(1, 'settings.config.general', 'Update'),
(1, 'settings.config.branding', 'Update'),
(1, 'settings.config.social_seo', 'Update'),
(1, 'settings.config.backup', 'Update'),
(1, 'settings.config.maintenance', 'Update')
ON DUPLICATE KEY UPDATE permission = VALUES(permission);
```

### 6. Verify permissions added:

```sql
-- Step 3: Verify
SELECT * FROM role_permissions 
WHERE role_id = 1  -- ← Your role_id
AND module LIKE 'settings.config.%';
```

**Should see 5 rows** (one for each config module)

### 7. Test in browser:

1. **Logout** dari website (important!)
2. **Login** balik
3. Go to: **Global Config → General**
4. Try **SAVE** → Should work now! ✅

---

## 🔍 VERIFY DATABASE STRUCTURE

### Check Tables Exist:

```sql
-- Check users table
SHOW TABLES LIKE 'users';

-- Check roles table
SHOW TABLES LIKE 'roles';

-- Check role_permissions table
SHOW TABLES LIKE 'role_permissions';
```

### Check Table Structure:

```sql
-- Role permissions structure
DESCRIBE role_permissions;
```

**Should have:**
- `id` (primary key)
- `role_id` (foreign key to roles)
- `module` (varchar - permission key)
- `permission` (varchar - Create/Read/Update/Delete)

---

## 📊 COMMON PERMISSION MODULES

For full system access, grant these permissions:

```sql
-- All Settings permissions
INSERT INTO role_permissions (role_id, module, permission) VALUES
-- Config
(1, 'settings.config.general', 'Update'),
(1, 'settings.config.branding', 'Update'),
(1, 'settings.config.social_seo', 'Update'),
(1, 'settings.config.backup', 'Update'),
(1, 'settings.config.maintenance', 'Update'),

-- Users & Roles
(1, 'settings.users', 'Create'),
(1, 'settings.users', 'Update'),
(1, 'settings.users', 'Delete'),
(1, 'settings.roles', 'Create'),
(1, 'settings.roles', 'Update'),
(1, 'settings.roles', 'Delete'),

-- Logs
(1, 'settings.logs.activity', 'Read'),
(1, 'settings.logs.audit', 'Read'),
(1, 'settings.logs.error', 'Read')

ON DUPLICATE KEY UPDATE permission = VALUES(permission);
```

---

## 🆘 TROUBLESHOOTING

### Issue 1: Still 403 after adding permission
```
1. Clear browser cache
2. Logout completely
3. Close ALL browser tabs
4. Clear cookies for domain
5. Login fresh
6. Try again
```

### Issue 2: Cannot find user in database
```sql
-- List all users
SELECT id, username, email, role_id FROM users;

-- Create admin user if missing
INSERT INTO users (username, email, password, role_id, status)
VALUES ('admin', 'admin@atline.com.my', '$2a$10$...hashed...', 1, 'Active');
```

### Issue 3: role_permissions table empty
```sql
-- Check if table exists
SELECT COUNT(*) FROM role_permissions;

-- If table exists but empty, need to run migration/seeder
-- Check prisma/seed.ts or migrations
```

### Issue 4: Super Admin role not working
```sql
-- Check role name EXACTLY (case-sensitive check)
SELECT id, name, LOWER(TRIM(name)) as normalized 
FROM roles 
WHERE LOWER(TRIM(name)) = 'super admin';

-- Must return exactly: 'super admin' (lowercase, no extra spaces)
```

---

## ✅ EXPECTED RESULT

**Before Fix:**
- ✅ Can login
- ✅ Can view Global Config
- ❌ Cannot save → 403 Forbidden

**After Fix:**
- ✅ Can login
- ✅ Can view Global Config
- ✅ Can save successfully!
- ✅ Changes persist

---

## 💡 SECURITY NOTE

**For Production:**
- Don't give everyone Super Admin role
- Create specific roles (Admin, Manager, Staff, etc.)
- Grant only necessary permissions per role
- Use `role_permissions` table properly

**Permission Format:**
- Module: `module.submodule.feature`
- Permission: `Create`, `Read`, `Update`, `Delete`, `Approve`, `Reject`

**Example:**
```sql
-- HR Manager can approve leave
INSERT INTO role_permissions (role_id, module, permission)
VALUES (2, 'hr.leave', 'Approve');

-- Staff can only create leave
INSERT INTO role_permissions (role_id, module, permission)
VALUES (3, 'hr.leave', 'Create');
```

---

## 🎯 QUICK FIX SQL (Copy-Paste Ready)

**Run this in phpMyAdmin SQL tab:**

```sql
-- Find admin user
SET @admin_user_id = (SELECT id FROM users WHERE email = 'admin@atline.com.my' LIMIT 1);
SET @admin_role_id = (SELECT role_id FROM users WHERE id = @admin_user_id);

-- Add config permissions
INSERT INTO role_permissions (role_id, module, permission) VALUES
(@admin_role_id, 'settings.config.general', 'Update'),
(@admin_role_id, 'settings.config.branding', 'Update'),
(@admin_role_id, 'settings.config.social_seo', 'Update'),
(@admin_role_id, 'settings.config.backup', 'Update'),
(@admin_role_id, 'settings.config.maintenance', 'Update')
ON DUPLICATE KEY UPDATE permission = VALUES(permission);

-- Verify
SELECT * FROM role_permissions WHERE role_id = @admin_role_id AND module LIKE 'settings.config.%';
```

**⚠️ Replace `admin@atline.com.my` with your actual admin email!**

---

## ✅ CHECKLIST

Before test:
- [ ] Found user in database (users table)
- [ ] Found user's role_id
- [ ] Added permissions to role_permissions table
- [ ] Verified permissions exist in database
- [ ] Logged out from website
- [ ] Cleared browser cache/cookies

After fix:
- [ ] Logged in successfully
- [ ] Can access Global Config page
- [ ] Can click SAVE button
- [ ] No 403 error in browser console
- [ ] Settings saved successfully
- [ ] Changes persist after page refresh

---

**SELESAI! 🎉**
