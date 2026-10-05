-- ============================================================
-- Migration 031: Add remarks to leave applications
-- ============================================================
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_leave_applications' AND COLUMN_NAME='remarks');
SET @s := IF(@c=0, 'ALTER TABLE `hr_leave_applications` ADD COLUMN `remarks` TEXT DEFAULT NULL AFTER `reason`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
