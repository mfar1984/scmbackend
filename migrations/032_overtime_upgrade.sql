-- ============================================================
-- Migration 032: Overtime upgrade — project, times, remarks, day type
-- ============================================================

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_overtime_applications' AND COLUMN_NAME='project_name');
SET @s := IF(@c=0, 'ALTER TABLE `hr_overtime_applications` ADD COLUMN `project_name` VARCHAR(180) DEFAULT NULL AFTER `employee_id`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_overtime_applications' AND COLUMN_NAME='start_time');
SET @s := IF(@c=0, 'ALTER TABLE `hr_overtime_applications` ADD COLUMN `start_time` VARCHAR(10) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_overtime_applications' AND COLUMN_NAME='end_time');
SET @s := IF(@c=0, 'ALTER TABLE `hr_overtime_applications` ADD COLUMN `end_time` VARCHAR(10) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_overtime_applications' AND COLUMN_NAME='remarks');
SET @s := IF(@c=0, 'ALTER TABLE `hr_overtime_applications` ADD COLUMN `remarks` TEXT DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_overtime_applications' AND COLUMN_NAME='day_type');
SET @s := IF(@c=0, "ALTER TABLE `hr_overtime_applications` ADD COLUMN `day_type` VARCHAR(40) DEFAULT NULL COMMENT 'Normal Day | Weekend | Public Holiday'", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Map overtime rates to a day-type keyword so the form can auto-suggest
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_overtime_rates' AND COLUMN_NAME='applies_to');
SET @s := IF(@c=0, "ALTER TABLE `hr_overtime_rates` ADD COLUMN `applies_to` VARCHAR(20) DEFAULT 'normal' COMMENT 'normal | rest_day | holiday'", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Seed applies_to mapping for the default seeded rates
UPDATE `hr_overtime_rates` SET `applies_to`='normal'   WHERE `name`='Normal Day';
UPDATE `hr_overtime_rates` SET `applies_to`='rest_day' WHERE `name`='Rest Day';
UPDATE `hr_overtime_rates` SET `applies_to`='holiday'  WHERE `name`='Public Holiday';
