-- ============================================================
-- Migration 016: HR Employee Settings (master data)
-- ============================================================

-- ── Departments ──
CREATE TABLE IF NOT EXISTS `hr_departments` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL,
  `code`       VARCHAR(20)  DEFAULT NULL,
  `description`VARCHAR(255) DEFAULT NULL,
  `status`     ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dept_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Positions ──
CREATE TABLE IF NOT EXISTS `hr_positions` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(100) NOT NULL,
  `department_id` INT UNSIGNED DEFAULT NULL,
  `status`        ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pos_dept` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Employment Types ──
CREATE TABLE IF NOT EXISTS `hr_employment_types` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(50)  NOT NULL,
  `status`     ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_emptype_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Banks ──
CREATE TABLE IF NOT EXISTS `hr_banks` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL,
  `status`     ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bank_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Dropdown Options (gender, marital_status, employee_status, nationality) ──
CREATE TABLE IF NOT EXISTS `hr_dropdown_options` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category`   VARCHAR(50)  NOT NULL COMMENT 'gender | marital_status | employee_status | nationality',
  `value`      VARCHAR(100) NOT NULL,
  `sort_order` INT          NOT NULL DEFAULT 0,
  `status`     ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  UNIQUE KEY `uq_cat_value` (`category`, `value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
