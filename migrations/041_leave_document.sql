-- ============================================================
-- Migration 041: Supporting document attachment for leave applications
-- (e.g. medical certificate for Medical Leave)
-- ============================================================
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_leave_applications' AND COLUMN_NAME='document');
SET @s := IF(@c=0, 'ALTER TABLE `hr_leave_applications` ADD COLUMN `document` MEDIUMTEXT DEFAULT NULL AFTER `remarks`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_leave_applications' AND COLUMN_NAME='document_name');
SET @s := IF(@c=0, 'ALTER TABLE `hr_leave_applications` ADD COLUMN `document_name` VARCHAR(255) DEFAULT NULL AFTER `document`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
