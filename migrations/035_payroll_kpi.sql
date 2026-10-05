-- ============================================================
-- Migration 035: Payroll sub-module redesign + KPI module
-- ============================================================

-- ─────────────────────────────────────────────
-- ALLOWANCES: restructure to per-employee setup
-- (Housing / Transport / Meal / Other + effective date)
-- ─────────────────────────────────────────────
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_allowances' AND COLUMN_NAME='housing');
SET @s := IF(@c=0,'ALTER TABLE `hr_allowances` ADD COLUMN `housing` DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER `employee_id`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_allowances' AND COLUMN_NAME='transport');
SET @s := IF(@c=0,'ALTER TABLE `hr_allowances` ADD COLUMN `transport` DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER `housing`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_allowances' AND COLUMN_NAME='meal');
SET @s := IF(@c=0,'ALTER TABLE `hr_allowances` ADD COLUMN `meal` DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER `transport`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_allowances' AND COLUMN_NAME='other_allowance');
SET @s := IF(@c=0,'ALTER TABLE `hr_allowances` ADD COLUMN `other_allowance` DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER `meal`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_allowances' AND COLUMN_NAME='effective_date');
SET @s := IF(@c=0,'ALTER TABLE `hr_allowances` ADD COLUMN `effective_date` DATE DEFAULT NULL AFTER `other_allowance`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_allowances' AND COLUMN_NAME='remarks');
SET @s := IF(@c=0,'ALTER TABLE `hr_allowances` ADD COLUMN `remarks` VARCHAR(500) DEFAULT NULL AFTER `effective_date`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ─────────────────────────────────────────────
-- BONUS: link to payroll period + KPI + type
-- ─────────────────────────────────────────────
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_bonuses' AND COLUMN_NAME='period_id');
SET @s := IF(@c=0,'ALTER TABLE `hr_bonuses` ADD COLUMN `period_id` INT UNSIGNED DEFAULT NULL AFTER `employee_id`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_bonuses' AND COLUMN_NAME='bonus_type');
SET @s := IF(@c=0,"ALTER TABLE `hr_bonuses` ADD COLUMN `bonus_type` VARCHAR(60) DEFAULT 'Performance Bonus' AFTER `name`",'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_bonuses' AND COLUMN_NAME='kpi_result_id');
SET @s := IF(@c=0,'ALTER TABLE `hr_bonuses` ADD COLUMN `kpi_result_id` INT UNSIGNED DEFAULT NULL AFTER `bonus_type`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ─────────────────────────────────────────────
-- COMMISSION: link to payroll period + type
-- ─────────────────────────────────────────────
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_commissions' AND COLUMN_NAME='period_id');
SET @s := IF(@c=0,'ALTER TABLE `hr_commissions` ADD COLUMN `period_id` INT UNSIGNED DEFAULT NULL AFTER `employee_id`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_commissions' AND COLUMN_NAME='commission_type');
SET @s := IF(@c=0,"ALTER TABLE `hr_commissions` ADD COLUMN `commission_type` VARCHAR(60) DEFAULT 'Sales Commission' AFTER `description`",'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_commissions' AND COLUMN_NAME='remarks');
SET @s := IF(@c=0,'ALTER TABLE `hr_commissions` ADD COLUMN `remarks` VARCHAR(500) DEFAULT NULL AFTER `commission_date`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ─────────────────────────────────────────────
-- LOAN: installment-based with auto monthly + progress
-- ─────────────────────────────────────────────
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_loans' AND COLUMN_NAME='loan_number');
SET @s := IF(@c=0,'ALTER TABLE `hr_loans` ADD COLUMN `loan_number` VARCHAR(40) DEFAULT NULL AFTER `id`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_loans' AND COLUMN_NAME='total_installments');
SET @s := IF(@c=0,'ALTER TABLE `hr_loans` ADD COLUMN `total_installments` INT DEFAULT 12 AFTER `monthly_deduction`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_loans' AND COLUMN_NAME='paid_installments');
SET @s := IF(@c=0,'ALTER TABLE `hr_loans` ADD COLUMN `paid_installments` INT NOT NULL DEFAULT 0 AFTER `total_installments`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
-- migrate old `installments` values into total_installments where present
UPDATE `hr_loans` SET `total_installments` = `installments` WHERE `installments` IS NOT NULL AND `total_installments` = 12;

-- ─────────────────────────────────────────────
-- ADVANCE: repayment-month based with auto monthly + progress
-- ─────────────────────────────────────────────
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_advances' AND COLUMN_NAME='repayment_months');
SET @s := IF(@c=0,'ALTER TABLE `hr_advances` ADD COLUMN `repayment_months` INT NOT NULL DEFAULT 3 AFTER `amount`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_advances' AND COLUMN_NAME='monthly_deduction');
SET @s := IF(@c=0,'ALTER TABLE `hr_advances` ADD COLUMN `monthly_deduction` DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER `repayment_months`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_advances' AND COLUMN_NAME='paid_months');
SET @s := IF(@c=0,'ALTER TABLE `hr_advances` ADD COLUMN `paid_months` INT NOT NULL DEFAULT 0 AFTER `monthly_deduction`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_advances' AND COLUMN_NAME='start_date');
SET @s := IF(@c=0,'ALTER TABLE `hr_advances` ADD COLUMN `start_date` DATE DEFAULT NULL AFTER `request_date`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_advances' AND COLUMN_NAME='remarks');
SET @s := IF(@c=0,'ALTER TABLE `hr_advances` ADD COLUMN `remarks` VARCHAR(500) DEFAULT NULL AFTER `reason`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ============================================================
-- KPI MODULE
-- ============================================================

-- ── KPI Competencies: reusable evaluation criteria ──
CREATE TABLE IF NOT EXISTS `hr_kpi_competencies` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(150) NOT NULL,
  `category`    VARCHAR(80)  DEFAULT 'General' COMMENT 'Core | Functional | Leadership | General',
  `description` VARCHAR(500) DEFAULT NULL,
  `status`      ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_kpi_comp` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── KPI Grade Bands: score range → grade + bonus multiplier ──
CREATE TABLE IF NOT EXISTS `hr_kpi_grade_bands` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `grade`       VARCHAR(20)  NOT NULL COMMENT 'A | B | C | D ...',
  `label`       VARCHAR(80)  DEFAULT NULL COMMENT 'Outstanding | Exceeds | Meets ...',
  `min_score`   DECIMAL(5,2) NOT NULL DEFAULT 0,
  `max_score`   DECIMAL(5,2) NOT NULL DEFAULT 100,
  `bonus_multiplier` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT 'months of basic salary as bonus',
  `color`       VARCHAR(20)  DEFAULT '#3b82f6',
  `status`      ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_kpi_grade` (`grade`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── KPI Templates: appraisal form (header) ──
CREATE TABLE IF NOT EXISTS `hr_kpi_templates` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(150) NOT NULL,
  `description` VARCHAR(500) DEFAULT NULL,
  `status`      ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_kpi_template` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── KPI Template items: competency + weight ──
CREATE TABLE IF NOT EXISTS `hr_kpi_template_items` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `template_id`   INT UNSIGNED NOT NULL,
  `competency_id` INT UNSIGNED DEFAULT NULL,
  `competency_name` VARCHAR(150) DEFAULT NULL,
  `weight`        DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT 'percentage weight',
  `sort_order`    INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_kti_template` (`template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── KPI Periods: review cycles ──
CREATE TABLE IF NOT EXISTS `hr_kpi_periods` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(120) NOT NULL,
  `cycle`       VARCHAR(30)  DEFAULT 'Annual' COMMENT 'Annual | Quarterly | Monthly | Probation',
  `start_date`  DATE         DEFAULT NULL,
  `end_date`    DATE         DEFAULT NULL,
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'Open' COMMENT 'Open | Closed',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_kpi_period` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── KPI Assignments: template + period → employee + reviewer ──
CREATE TABLE IF NOT EXISTS `hr_kpi_assignments` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reference_no`  VARCHAR(30)  DEFAULT NULL,
  `period_id`     INT UNSIGNED NOT NULL,
  `template_id`   INT UNSIGNED NOT NULL,
  `employee_id`   INT UNSIGNED NOT NULL,
  `reviewer_user_id` INT UNSIGNED DEFAULT NULL COMMENT 'administrator account who reviews',
  `status`        VARCHAR(20)  NOT NULL DEFAULT 'Pending' COMMENT 'Pending | In Progress | Reviewed | Completed',
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ka_period` (`period_id`),
  KEY `idx_ka_emp` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── KPI Review scores: one row per competency per assignment ──
CREATE TABLE IF NOT EXISTS `hr_kpi_review_items` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `assignment_id` INT UNSIGNED NOT NULL,
  `competency_name` VARCHAR(150) DEFAULT NULL,
  `weight`        DECIMAL(5,2) NOT NULL DEFAULT 0,
  `score`         DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT 'score out of 100',
  `comments`      VARCHAR(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_kri_assign` (`assignment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── KPI Results: final weighted score → grade (per assignment) ──
CREATE TABLE IF NOT EXISTS `hr_kpi_results` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `assignment_id` INT UNSIGNED NOT NULL,
  `employee_id`   INT UNSIGNED NOT NULL,
  `period_id`     INT UNSIGNED NOT NULL,
  `final_score`   DECIMAL(5,2) NOT NULL DEFAULT 0,
  `grade`         VARCHAR(20)  DEFAULT NULL,
  `grade_label`   VARCHAR(80)  DEFAULT NULL,
  `bonus_multiplier` DECIMAL(5,2) NOT NULL DEFAULT 0,
  `reviewer_remarks` VARCHAR(500) DEFAULT NULL,
  `bonus_generated` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_kpi_result_assign` (`assignment_id`),
  KEY `idx_kr_emp` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed default grade bands ──
INSERT IGNORE INTO `hr_kpi_grade_bands` (`grade`, `label`, `min_score`, `max_score`, `bonus_multiplier`, `color`) VALUES
('A', 'Outstanding',      85, 100, 2.00, '#16a34a'),
('B', 'Exceeds Expectations', 70, 84.99, 1.50, '#3b82f6'),
('C', 'Meets Expectations',   55, 69.99, 1.00, '#f59e0b'),
('D', 'Needs Improvement',    40, 54.99, 0.50, '#f97316'),
('E', 'Unsatisfactory',        0, 39.99, 0.00, '#ef4444');

-- ── Seed default competencies ──
INSERT IGNORE INTO `hr_kpi_competencies` (`name`, `category`, `description`) VALUES
('Job Knowledge', 'Core', 'Understanding of role responsibilities and technical skills'),
('Quality of Work', 'Core', 'Accuracy, thoroughness and reliability of output'),
('Productivity', 'Core', 'Volume of work and efficiency'),
('Communication', 'Core', 'Clarity and effectiveness of communication'),
('Teamwork', 'Core', 'Collaboration and support of colleagues'),
('Initiative', 'Functional', 'Proactiveness and problem solving'),
('Leadership', 'Leadership', 'Guiding, motivating and developing others'),
('Punctuality & Attendance', 'Core', 'Timeliness and reliability of attendance');
