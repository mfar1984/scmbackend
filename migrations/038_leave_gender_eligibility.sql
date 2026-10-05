-- ============================================================
-- Migration 038: Gender eligibility for leave types
--   'All' | 'Male' | 'Female'
-- ============================================================

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_leave_types' AND COLUMN_NAME='gender_eligibility');
SET @s := IF(@c=0, "ALTER TABLE `hr_leave_types` ADD COLUMN `gender_eligibility` VARCHAR(10) NOT NULL DEFAULT 'All' COMMENT 'All | Male | Female' AFTER `paid`", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ── Seed sensible defaults for known statutory leave types ──
UPDATE `hr_leave_types` SET `gender_eligibility` = 'Female' WHERE `name` LIKE '%Maternity%';
UPDATE `hr_leave_types` SET `gender_eligibility` = 'Male'   WHERE `name` LIKE '%Paternity%';
