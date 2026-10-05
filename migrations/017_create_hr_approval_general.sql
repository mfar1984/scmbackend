-- ============================================================
-- Migration 017: HR Approval Workflow + General settings + seed
-- ============================================================

-- ── Approval Workflow ──
CREATE TABLE IF NOT EXISTS `hr_approval_workflow` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `module`        VARCHAR(50)  NOT NULL COMMENT 'leave | claim | overtime | expenses',
  `level`         INT          NOT NULL DEFAULT 1,
  `approver_role` VARCHAR(100) NOT NULL COMMENT 'role name that approves at this level',
  `status`        ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── General HR settings (key-value) ──
CREATE TABLE IF NOT EXISTS `hr_settings` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key`        VARCHAR(100) NOT NULL,
  `value`      TEXT         DEFAULT NULL,
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_hr_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed: Departments ──
INSERT IGNORE INTO `hr_departments` (`name`, `code`, `description`) VALUES
('Management',       'MGT', 'Executive and administrative management'),
('Human Resources',  'HR',  'HR, payroll and recruitment'),
('Engineering',      'ENG', 'Network engineering and technical team'),
('Project Management','PM',  'Project planning and delivery'),
('Sales & Marketing','SNM', 'Business development and marketing'),
('Finance',          'FIN', 'Accounting and finance'),
('Operations',       'OPS', 'Field operations and support');

-- ── Seed: Employment Types ──
INSERT IGNORE INTO `hr_employment_types` (`name`) VALUES
('Permanent'), ('Contract'), ('Probation'), ('Internship'), ('Part-Time');

-- ── Seed: Banks (Malaysian) ──
INSERT IGNORE INTO `hr_banks` (`name`) VALUES
('Maybank'), ('CIMB Bank'), ('Public Bank'), ('RHB Bank'), ('Hong Leong Bank'),
('AmBank'), ('Bank Islam'), ('Bank Rakyat'), ('BSN'), ('OCBC Bank'),
('HSBC Bank'), ('Standard Chartered'), ('UOB Bank'), ('Affin Bank'), ('Alliance Bank'),
('Agrobank'), ('MBSB Bank'), ('Bank Muamalat');

-- ── Seed: Dropdown Options ──
INSERT IGNORE INTO `hr_dropdown_options` (`category`, `value`, `sort_order`) VALUES
('gender', 'Male',   1),
('gender', 'Female', 2),
('marital_status', 'Single',   1),
('marital_status', 'Married',  2),
('marital_status', 'Divorced', 3),
('marital_status', 'Widowed',  4),
('employee_status', 'Active',     1),
('employee_status', 'Probation',  2),
('employee_status', 'Resigned',   3),
('employee_status', 'Terminated', 4),
('nationality', 'Malaysian',   1),
('nationality', 'Non-Malaysian', 2);

-- ── Seed: General settings ──
INSERT IGNORE INTO `hr_settings` (`key`, `value`) VALUES
('employee_id_prefix',   'ATL'),
('employee_id_digits',   '4'),
('employee_id_next',     '1'),
('default_probation_months', '3'),
('default_nationality',  'Malaysian'),
('default_country',      'Malaysia');
