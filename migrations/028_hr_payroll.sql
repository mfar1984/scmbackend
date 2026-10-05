-- ============================================================
-- Migration 028: Payroll & Compensation
-- ============================================================

-- ── Payroll Periods ──
CREATE TABLE IF NOT EXISTS `hr_payroll_periods` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL,
  `month`      VARCHAR(20)  DEFAULT NULL,
  `year`       INT          DEFAULT NULL,
  `pay_date`   DATE         DEFAULT NULL,
  `status`     VARCHAR(20)  NOT NULL DEFAULT 'Draft' COMMENT 'Draft | Processing | Paid | Closed',
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Allowances ──
CREATE TABLE IF NOT EXISTS `hr_allowances` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` INT UNSIGNED DEFAULT NULL,
  `name`        VARCHAR(100) NOT NULL,
  `amount`      DECIMAL(12,2) NOT NULL DEFAULT 0,
  `frequency`   VARCHAR(30)  DEFAULT 'Monthly' COMMENT 'Monthly | One-time',
  `status`      ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_allow_emp` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Bonuses ──
CREATE TABLE IF NOT EXISTS `hr_bonuses` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` INT UNSIGNED DEFAULT NULL,
  `name`        VARCHAR(100) NOT NULL,
  `amount`      DECIMAL(12,2) NOT NULL DEFAULT 0,
  `bonus_date`  DATE         DEFAULT NULL,
  `remarks`     VARCHAR(255) DEFAULT NULL,
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'Pending' COMMENT 'Pending | Approved | Paid',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bonus_emp` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Commissions ──
CREATE TABLE IF NOT EXISTS `hr_commissions` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id` INT UNSIGNED DEFAULT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `amount`      DECIMAL(12,2) NOT NULL DEFAULT 0,
  `commission_date` DATE     DEFAULT NULL,
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'Pending' COMMENT 'Pending | Approved | Paid',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_comm_emp` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Loans ──
CREATE TABLE IF NOT EXISTS `hr_loans` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id`   INT UNSIGNED DEFAULT NULL,
  `loan_type`     VARCHAR(100) DEFAULT NULL,
  `amount`        DECIMAL(12,2) NOT NULL DEFAULT 0,
  `monthly_deduction` DECIMAL(12,2) DEFAULT 0,
  `start_date`    DATE         DEFAULT NULL,
  `installments`  INT          DEFAULT NULL,
  `remarks`       VARCHAR(255) DEFAULT NULL,
  `status`        VARCHAR(20)  NOT NULL DEFAULT 'Active' COMMENT 'Active | Completed | Cancelled',
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_loan_emp` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Salary Advances ──
CREATE TABLE IF NOT EXISTS `hr_advances` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reference_no` VARCHAR(30)  NOT NULL,
  `employee_id`  INT UNSIGNED DEFAULT NULL,
  `amount`       DECIMAL(12,2) NOT NULL DEFAULT 0,
  `request_date` DATE         DEFAULT NULL,
  `reason`       TEXT         DEFAULT NULL,
  `status`       VARCHAR(20)  NOT NULL DEFAULT 'Pending' COMMENT 'Pending | Approved | Rejected | Paid',
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_advance_ref` (`reference_no`),
  KEY `idx_adv_emp` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Payroll Settings (key-value) ──
CREATE TABLE IF NOT EXISTS `hr_payroll_settings` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key`        VARCHAR(100) NOT NULL,
  `value`      TEXT         DEFAULT NULL,
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payroll_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `hr_payroll_settings` (`key`, `value`) VALUES
('epf_employee_rate', '11'),
('epf_employer_rate', '13'),
('socso_employee_rate', '0.5'),
('socso_employer_rate', '1.75'),
('eis_rate', '0.2'),
('pay_day', '25'),
('currency', 'MYR');

-- ── Seed some defaults ──
INSERT IGNORE INTO `hr_leave_types` (`name`, `days_per_year`, `paid`, `carry_forward`) VALUES
('Annual Leave', 14, 'Paid', 1),
('Medical Leave', 14, 'Paid', 0),
('Emergency Leave', 3, 'Paid', 0),
('Unpaid Leave', 0, 'Unpaid', 0),
('Maternity Leave', 60, 'Paid', 0),
('Paternity Leave', 7, 'Paid', 0);

INSERT IGNORE INTO `hr_claim_types` (`name`, `max_amount`) VALUES
('Medical Claim', 1000.00),
('Travel Claim', 500.00),
('Meal Claim', 300.00),
('Phone Claim', 150.00);

INSERT IGNORE INTO `hr_overtime_rates` (`name`, `multiplier`, `description`) VALUES
('Normal Day', 1.50, 'Overtime on a normal working day'),
('Rest Day', 2.00, 'Overtime on a rest day'),
('Public Holiday', 3.00, 'Overtime on a public holiday');

INSERT IGNORE INTO `hr_expense_categories` (`name`) VALUES
('Office Supplies'), ('Travel & Transport'), ('Client Entertainment'),
('Training & Development'), ('Equipment'), ('Miscellaneous');
