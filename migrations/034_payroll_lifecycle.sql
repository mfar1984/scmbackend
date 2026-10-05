-- ============================================================
-- Migration 034: Payroll Lifecycle (process → approve → pay → close)
--                + generated payslips
-- ============================================================

-- ── Extend hr_payroll_periods with lifecycle columns ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_payroll_periods' AND COLUMN_NAME='period_start');
SET @s := IF(@c=0,'ALTER TABLE `hr_payroll_periods` ADD COLUMN `period_start` DATE DEFAULT NULL AFTER `year`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_payroll_periods' AND COLUMN_NAME='period_end');
SET @s := IF(@c=0,'ALTER TABLE `hr_payroll_periods` ADD COLUMN `period_end` DATE DEFAULT NULL AFTER `period_start`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_payroll_periods' AND COLUMN_NAME='processed_at');
SET @s := IF(@c=0,'ALTER TABLE `hr_payroll_periods` ADD COLUMN `processed_at` TIMESTAMP NULL DEFAULT NULL AFTER `status`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_payroll_periods' AND COLUMN_NAME='approved_at');
SET @s := IF(@c=0,'ALTER TABLE `hr_payroll_periods` ADD COLUMN `approved_at` TIMESTAMP NULL DEFAULT NULL AFTER `processed_at`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_payroll_periods' AND COLUMN_NAME='approval_remarks');
SET @s := IF(@c=0,'ALTER TABLE `hr_payroll_periods` ADD COLUMN `approval_remarks` VARCHAR(500) DEFAULT NULL AFTER `approved_at`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_payroll_periods' AND COLUMN_NAME='paid_at');
SET @s := IF(@c=0,'ALTER TABLE `hr_payroll_periods` ADD COLUMN `paid_at` TIMESTAMP NULL DEFAULT NULL AFTER `approval_remarks`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_payroll_periods' AND COLUMN_NAME='payment_reference');
SET @s := IF(@c=0,'ALTER TABLE `hr_payroll_periods` ADD COLUMN `payment_reference` VARCHAR(120) DEFAULT NULL AFTER `paid_at`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_payroll_periods' AND COLUMN_NAME='payment_proof');
SET @s := IF(@c=0,'ALTER TABLE `hr_payroll_periods` ADD COLUMN `payment_proof` MEDIUMTEXT DEFAULT NULL AFTER `payment_reference`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_payroll_periods' AND COLUMN_NAME='payment_proof_name');
SET @s := IF(@c=0,'ALTER TABLE `hr_payroll_periods` ADD COLUMN `payment_proof_name` VARCHAR(255) DEFAULT NULL AFTER `payment_proof`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_payroll_periods' AND COLUMN_NAME='paid_remarks');
SET @s := IF(@c=0,'ALTER TABLE `hr_payroll_periods` ADD COLUMN `paid_remarks` VARCHAR(500) DEFAULT NULL AFTER `payment_proof_name`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_payroll_periods' AND COLUMN_NAME='closed_at');
SET @s := IF(@c=0,'ALTER TABLE `hr_payroll_periods` ADD COLUMN `closed_at` TIMESTAMP NULL DEFAULT NULL AFTER `paid_remarks`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ── Generated Payslips (one row per employee per processed period) ──
CREATE TABLE IF NOT EXISTS `hr_payslips` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `payslip_no`      VARCHAR(40)  NOT NULL,
  `period_id`       INT UNSIGNED NOT NULL,
  `employee_id`     INT UNSIGNED NOT NULL,

  -- snapshot of employee identity (so historic payslips stay correct)
  `employee_code`   VARCHAR(30)  DEFAULT NULL,
  `employee_name`   VARCHAR(150) DEFAULT NULL,
  `nric_passport`   VARCHAR(50)  DEFAULT NULL,
  `department_name` VARCHAR(150) DEFAULT NULL,
  `position_name`   VARCHAR(150) DEFAULT NULL,
  `bank_name`       VARCHAR(120) DEFAULT NULL,
  `bank_account_no` VARCHAR(50)  DEFAULT NULL,
  `epf_no`          VARCHAR(50)  DEFAULT NULL,
  `socso_no`        VARCHAR(50)  DEFAULT NULL,
  `income_tax_no`   VARCHAR(50)  DEFAULT NULL,

  -- earnings
  `basic_salary`    DECIMAL(12,2) NOT NULL DEFAULT 0,
  `allowances`      DECIMAL(12,2) NOT NULL DEFAULT 0,
  `bonus`           DECIMAL(12,2) NOT NULL DEFAULT 0,
  `commission`      DECIMAL(12,2) NOT NULL DEFAULT 0,
  `overtime`        DECIMAL(12,2) NOT NULL DEFAULT 0,
  `claims`          DECIMAL(12,2) NOT NULL DEFAULT 0,
  `gross_salary`    DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- deductions
  `epf_employee`    DECIMAL(12,2) NOT NULL DEFAULT 0,
  `socso_employee`  DECIMAL(12,2) NOT NULL DEFAULT 0,
  `eis_employee`    DECIMAL(12,2) NOT NULL DEFAULT 0,
  `loan_deduction`  DECIMAL(12,2) NOT NULL DEFAULT 0,
  `advance_deduction` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `total_deductions` DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- employer contributions (for reference)
  `epf_employer`    DECIMAL(12,2) NOT NULL DEFAULT 0,
  `socso_employer`  DECIMAL(12,2) NOT NULL DEFAULT 0,
  `eis_employer`    DECIMAL(12,2) NOT NULL DEFAULT 0,

  `net_salary`      DECIMAL(12,2) NOT NULL DEFAULT 0,

  `earnings_json`   TEXT         DEFAULT NULL COMMENT 'detailed line items snapshot',
  `status`          VARCHAR(20)  NOT NULL DEFAULT 'Draft' COMMENT 'Draft | Approved | Paid',
  `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payslip_no` (`payslip_no`),
  UNIQUE KEY `uq_period_emp` (`period_id`, `employee_id`),
  KEY `idx_ps_period` (`period_id`),
  KEY `idx_ps_emp` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Add fixed allowance + employee company-email columns referenced by payslip ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_employees' AND COLUMN_NAME='fixed_allowance');
SET @s := IF(@c=0,'ALTER TABLE `hr_employees` ADD COLUMN `fixed_allowance` DECIMAL(12,2) DEFAULT 0 AFTER `basic_salary`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
