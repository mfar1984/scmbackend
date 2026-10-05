-- ============================================================
-- Migration 024: Store actual applicant document files (base64) + filenames
-- ============================================================

-- Enlarge document columns to hold base64 data URLs
ALTER TABLE `hr_applicants` MODIFY COLUMN `doc_passport`     MEDIUMTEXT DEFAULT NULL;
ALTER TABLE `hr_applicants` MODIFY COLUMN `doc_resume`       MEDIUMTEXT DEFAULT NULL;
ALTER TABLE `hr_applicants` MODIFY COLUMN `doc_cover_letter` MEDIUMTEXT DEFAULT NULL;

-- Add original filename columns (for display)
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_applicants' AND COLUMN_NAME='doc_passport_name');
SET @s := IF(@c=0, 'ALTER TABLE `hr_applicants` ADD COLUMN `doc_passport_name` VARCHAR(255) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_applicants' AND COLUMN_NAME='doc_resume_name');
SET @s := IF(@c=0, 'ALTER TABLE `hr_applicants` ADD COLUMN `doc_resume_name` VARCHAR(255) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_applicants' AND COLUMN_NAME='doc_cover_letter_name');
SET @s := IF(@c=0, 'ALTER TABLE `hr_applicants` ADD COLUMN `doc_cover_letter_name` VARCHAR(255) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
