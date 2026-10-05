-- ============================================================
-- Migration 018: HR Employees (main employee records)
-- ============================================================

CREATE TABLE IF NOT EXISTS `hr_employees` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `employee_id`     VARCHAR(30)  NOT NULL COMMENT 'auto-generated, e.g. ATL0001',

  -- ── Personal Information ──
  `full_name`       VARCHAR(150) NOT NULL,
  `nric_passport`   VARCHAR(50)  DEFAULT NULL COMMENT 'IC / Passport No.',
  `gender`          VARCHAR(30)  DEFAULT NULL,
  `marital_status`  VARCHAR(30)  DEFAULT NULL,
  `nationality`     VARCHAR(50)  DEFAULT NULL,
  `date_of_birth`   DATE         DEFAULT NULL,
  `email`           VARCHAR(150) DEFAULT NULL,
  `phone`           VARCHAR(40)  DEFAULT NULL,
  `address`         VARCHAR(255) DEFAULT NULL,
  `city`            VARCHAR(80)  DEFAULT NULL,
  `state`           VARCHAR(80)  DEFAULT NULL,
  `postcode`        VARCHAR(20)  DEFAULT NULL,
  `country`         VARCHAR(80)  DEFAULT NULL,

  -- ── Employment Information ──
  `department_id`   INT UNSIGNED DEFAULT NULL,
  `position_id`     INT UNSIGNED DEFAULT NULL,
  `employment_type_id` INT UNSIGNED DEFAULT NULL,
  `join_date`       DATE         DEFAULT NULL,
  `confirm_date`    DATE         DEFAULT NULL,
  `employee_status` VARCHAR(40)  DEFAULT 'Active' COMMENT 'Active | Probation | Resigned | Terminated',

  -- ── Salary & Bank ──
  `basic_salary`    DECIMAL(12,2) DEFAULT NULL,
  `bank_id`         INT UNSIGNED DEFAULT NULL,
  `bank_account_no` VARCHAR(50)  DEFAULT NULL,
  `epf_no`          VARCHAR(50)  DEFAULT NULL,
  `socso_no`        VARCHAR(50)  DEFAULT NULL,
  `income_tax_no`   VARCHAR(50)  DEFAULT NULL,

  -- ── Meta ──
  `status`          ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employee_id` (`employee_id`),
  KEY `idx_dept` (`department_id`),
  KEY `idx_pos` (`position_id`),
  KEY `idx_emptype` (`employment_type_id`),
  KEY `idx_bank` (`bank_id`),
  KEY `idx_emp_status` (`employee_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
