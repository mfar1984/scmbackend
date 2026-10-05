-- ============================================================
-- Migration 027: HR Modules — Leave, Claim, Overtime, Expenses, Payroll
-- + approval workflow approver_user_id
-- ============================================================

-- ── Approval: add approver_user_id (link to administrator account) ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_approval_workflow' AND COLUMN_NAME='approver_user_id');
SET @s := IF(@c=0, 'ALTER TABLE `hr_approval_workflow` ADD COLUMN `approver_user_id` INT UNSIGNED DEFAULT NULL AFTER `approver_role`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ── Leave Types (settings) ──
CREATE TABLE IF NOT EXISTS `hr_leave_types` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`         VARCHAR(100) NOT NULL,
  `days_per_year` INT         NOT NULL DEFAULT 0,
  `paid`         ENUM('Paid','Unpaid') NOT NULL DEFAULT 'Paid',
  `carry_forward` TINYINT(1)  NOT NULL DEFAULT 0,
  `description`  VARCHAR(255) DEFAULT NULL,
  `status`       ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_leave_type` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Leave Applications ──
CREATE TABLE IF NOT EXISTS `hr_leave_applications` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reference_no`  VARCHAR(30)  NOT NULL,
  `employee_id`   INT UNSIGNED DEFAULT NULL,
  `leave_type_id` INT UNSIGNED DEFAULT NULL,
  `start_date`    DATE         DEFAULT NULL,
  `end_date`      DATE         DEFAULT NULL,
  `days`          DECIMAL(5,1) DEFAULT NULL,
  `reason`        TEXT         DEFAULT NULL,
  `status`        VARCHAR(20)  NOT NULL DEFAULT 'Pending' COMMENT 'Pending | Approved | Rejected',
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_leave_ref` (`reference_no`),
  KEY `idx_leave_emp` (`employee_id`),
  KEY `idx_leave_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Claim Types (settings) ──
CREATE TABLE IF NOT EXISTS `hr_claim_types` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100) NOT NULL,
  `max_amount`  DECIMAL(12,2) DEFAULT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `status`      ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_claim_type` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Claim Applications ──
CREATE TABLE IF NOT EXISTS `hr_claim_applications` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reference_no` VARCHAR(30)  NOT NULL,
  `employee_id`  INT UNSIGNED DEFAULT NULL,
  `claim_type_id` INT UNSIGNED DEFAULT NULL,
  `claim_date`   DATE         DEFAULT NULL,
  `amount`       DECIMAL(12,2) DEFAULT NULL,
  `description`  TEXT         DEFAULT NULL,
  `receipt`      MEDIUMTEXT   DEFAULT NULL,
  `receipt_name` VARCHAR(255) DEFAULT NULL,
  `status`       VARCHAR(20)  NOT NULL DEFAULT 'Pending',
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_claim_ref` (`reference_no`),
  KEY `idx_claim_emp` (`employee_id`),
  KEY `idx_claim_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Overtime Settings (rate multipliers) ──
CREATE TABLE IF NOT EXISTS `hr_overtime_rates` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL,
  `multiplier` DECIMAL(4,2) NOT NULL DEFAULT 1.50,
  `description` VARCHAR(255) DEFAULT NULL,
  `status`     ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ot_rate` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Overtime Applications ──
CREATE TABLE IF NOT EXISTS `hr_overtime_applications` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reference_no` VARCHAR(30)  NOT NULL,
  `employee_id`  INT UNSIGNED DEFAULT NULL,
  `ot_rate_id`   INT UNSIGNED DEFAULT NULL,
  `ot_date`      DATE         DEFAULT NULL,
  `hours`        DECIMAL(5,1) DEFAULT NULL,
  `reason`       TEXT         DEFAULT NULL,
  `status`       VARCHAR(20)  NOT NULL DEFAULT 'Pending',
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ot_ref` (`reference_no`),
  KEY `idx_ot_emp` (`employee_id`),
  KEY `idx_ot_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Expenses Categories (settings) ──
CREATE TABLE IF NOT EXISTS `hr_expense_categories` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `status`      ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_expense_cat` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Expenses Applications ──
CREATE TABLE IF NOT EXISTS `hr_expense_applications` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reference_no` VARCHAR(30)  NOT NULL,
  `employee_id`  INT UNSIGNED DEFAULT NULL,
  `category_id`  INT UNSIGNED DEFAULT NULL,
  `expense_date` DATE         DEFAULT NULL,
  `amount`       DECIMAL(12,2) DEFAULT NULL,
  `description`  TEXT         DEFAULT NULL,
  `receipt`      MEDIUMTEXT   DEFAULT NULL,
  `receipt_name` VARCHAR(255) DEFAULT NULL,
  `status`       VARCHAR(20)  NOT NULL DEFAULT 'Pending',
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_expense_ref` (`reference_no`),
  KEY `idx_expense_emp` (`employee_id`),
  KEY `idx_expense_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
