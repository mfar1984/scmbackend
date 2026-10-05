-- ============================================================
-- Migration 058: Clean stale role permissions
-- ------------------------------------------------------------
-- The Permission Matrix was redesigned to mirror the sidebar.
-- Module keys changed from human labels ("Dashboard", "Career",
-- "Leave Management") to dotted keys ("dashboard", "hr.career.*",
-- "hr.leave.application"), and the permission vocabulary changed
-- ("View" → "Read", added "Update").
--
-- This removes obsolete rows so roles can be re-assigned cleanly.
-- Super Admin is unaffected (it bypasses the matrix entirely).
-- Safe to re-run; deletes are idempotent.
-- ============================================================

-- 1) Drop rows whose module is NOT a valid new key.
--    Every new permission module is either 'dashboard' or contains a '.'.
--    All legacy label-based modules had neither.
DELETE FROM `role_permissions`
WHERE `module` <> 'dashboard'
  AND `module` NOT LIKE '%.%';

-- 2) Drop rows using the old permission vocabulary.
--    New vocabulary: Create, Read, Update, Delete, Approve, Reject, Export, Print.
DELETE FROM `role_permissions`
WHERE `permission` NOT IN ('Create','Read','Update','Delete','Approve','Reject','Export','Print');
