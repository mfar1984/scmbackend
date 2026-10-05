-- ============================================================
-- Migration 023: Link career postings to master data (IDs)
-- ============================================================

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_career_postings' AND COLUMN_NAME='department_id');
SET @s := IF(@c=0, 'ALTER TABLE `hr_career_postings` ADD COLUMN `department_id` INT UNSIGNED DEFAULT NULL AFTER `department`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_career_postings' AND COLUMN_NAME='position_id');
SET @s := IF(@c=0, 'ALTER TABLE `hr_career_postings` ADD COLUMN `position_id` INT UNSIGNED DEFAULT NULL AFTER `title`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_career_postings' AND COLUMN_NAME='employment_type_id');
SET @s := IF(@c=0, 'ALTER TABLE `hr_career_postings` ADD COLUMN `employment_type_id` INT UNSIGNED DEFAULT NULL AFTER `employment_type`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ── Link applicants back to master data too (resolved at apply time) ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_applicants' AND COLUMN_NAME='department_id');
SET @s := IF(@c=0, 'ALTER TABLE `hr_applicants` ADD COLUMN `department_id` INT UNSIGNED DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_applicants' AND COLUMN_NAME='position_id');
SET @s := IF(@c=0, 'ALTER TABLE `hr_applicants` ADD COLUMN `position_id` INT UNSIGNED DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_applicants' AND COLUMN_NAME='employment_type_id');
SET @s := IF(@c=0, 'ALTER TABLE `hr_applicants` ADD COLUMN `employment_type_id` INT UNSIGNED DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
