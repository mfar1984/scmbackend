-- ============================================================
-- Migration 029: Extend hr_leave_types (code, color, flags)
-- ============================================================

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_leave_types' AND COLUMN_NAME='code');
SET @s := IF(@c=0, 'ALTER TABLE `hr_leave_types` ADD COLUMN `code` VARCHAR(20) DEFAULT NULL AFTER `id`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_leave_types' AND COLUMN_NAME='color');
SET @s := IF(@c=0, "ALTER TABLE `hr_leave_types` ADD COLUMN `color` VARCHAR(20) DEFAULT '#3b82f6'", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_leave_types' AND COLUMN_NAME='requires_approval');
SET @s := IF(@c=0, 'ALTER TABLE `hr_leave_types` ADD COLUMN `requires_approval` TINYINT(1) NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_leave_types' AND COLUMN_NAME='allow_half_day');
SET @s := IF(@c=0, 'ALTER TABLE `hr_leave_types` ADD COLUMN `allow_half_day` TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_leave_types' AND COLUMN_NAME='requires_document');
SET @s := IF(@c=0, 'ALTER TABLE `hr_leave_types` ADD COLUMN `requires_document` TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Seed codes for existing default leave types
UPDATE `hr_leave_types` SET `code` = 'AL' WHERE `name` = 'Annual Leave'    AND (`code` IS NULL OR `code` = '');
UPDATE `hr_leave_types` SET `code` = 'ML' WHERE `name` = 'Medical Leave'   AND (`code` IS NULL OR `code` = '');
UPDATE `hr_leave_types` SET `code` = 'EL' WHERE `name` = 'Emergency Leave' AND (`code` IS NULL OR `code` = '');
UPDATE `hr_leave_types` SET `code` = 'UL' WHERE `name` = 'Unpaid Leave'    AND (`code` IS NULL OR `code` = '');
UPDATE `hr_leave_types` SET `code` = 'MTL' WHERE `name` = 'Maternity Leave' AND (`code` IS NULL OR `code` = '');
UPDATE `hr_leave_types` SET `code` = 'PL' WHERE `name` = 'Paternity Leave' AND (`code` IS NULL OR `code` = '');
