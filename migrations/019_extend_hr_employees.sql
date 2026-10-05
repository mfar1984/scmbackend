-- ============================================================
-- Migration 019: Extend hr_employees + seed race/religion dropdowns
-- ============================================================

-- ── Add extra personal / emergency columns (idempotent guards) ──
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hr_employees' AND COLUMN_NAME = 'race');
SET @sql := IF(@col = 0, 'ALTER TABLE `hr_employees` ADD COLUMN `race` VARCHAR(50) DEFAULT NULL AFTER `marital_status`', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hr_employees' AND COLUMN_NAME = 'religion');
SET @sql := IF(@col = 0, 'ALTER TABLE `hr_employees` ADD COLUMN `religion` VARCHAR(50) DEFAULT NULL AFTER `race`', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hr_employees' AND COLUMN_NAME = 'emergency_name');
SET @sql := IF(@col = 0, 'ALTER TABLE `hr_employees` ADD COLUMN `emergency_name` VARCHAR(150) DEFAULT NULL AFTER `country`', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hr_employees' AND COLUMN_NAME = 'emergency_relationship');
SET @sql := IF(@col = 0, 'ALTER TABLE `hr_employees` ADD COLUMN `emergency_relationship` VARCHAR(80) DEFAULT NULL AFTER `emergency_name`', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hr_employees' AND COLUMN_NAME = 'emergency_phone');
SET @sql := IF(@col = 0, 'ALTER TABLE `hr_employees` ADD COLUMN `emergency_phone` VARCHAR(40) DEFAULT NULL AFTER `emergency_relationship`', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ── Add work-related employment columns ──
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hr_employees' AND COLUMN_NAME = 'work_location');
SET @sql := IF(@col = 0, 'ALTER TABLE `hr_employees` ADD COLUMN `work_location` VARCHAR(120) DEFAULT NULL AFTER `confirm_date`', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hr_employees' AND COLUMN_NAME = 'reporting_to');
SET @sql := IF(@col = 0, 'ALTER TABLE `hr_employees` ADD COLUMN `reporting_to` VARCHAR(150) DEFAULT NULL AFTER `work_location`', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ── Seed: Race dropdown options ──
INSERT IGNORE INTO `hr_dropdown_options` (`category`, `value`, `sort_order`) VALUES
('race', 'Malay',   1),
('race', 'Chinese', 2),
('race', 'Indian',  3),
('race', 'Bumiputera Sabah', 4),
('race', 'Bumiputera Sarawak', 5),
('race', 'Others',  6);

-- ── Seed: Religion dropdown options ──
INSERT IGNORE INTO `hr_dropdown_options` (`category`, `value`, `sort_order`) VALUES
('religion', 'Islam',     1),
('religion', 'Buddhism',  2),
('religion', 'Christianity', 3),
('religion', 'Hinduism',  4),
('religion', 'Others',    5);
