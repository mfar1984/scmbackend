-- ============================================================
-- Migration 039: Link staff user accounts to employee records (ESS)
-- ============================================================

-- ── Link a user login to an hr_employees record ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='employee_id');
SET @s := IF(@c=0, 'ALTER TABLE `users` ADD COLUMN `employee_id` INT UNSIGNED DEFAULT NULL AFTER `user_type`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND INDEX_NAME='idx_users_employee');
SET @s := IF(@c=0, 'ALTER TABLE `users` ADD KEY `idx_users_employee` (`employee_id`)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ── Track whether an employee already has a staff login (for the import UI) ──
-- (queried via JOIN; no extra column needed on hr_employees)
