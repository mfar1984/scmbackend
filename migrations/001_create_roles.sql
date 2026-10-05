-- ============================================================
-- Migration 001: Roles & Permissions
-- ============================================================

CREATE TABLE IF NOT EXISTS `roles` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100)    NOT NULL,
  `description` VARCHAR(255)    DEFAULT NULL,
  `status`      ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_roles_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── role_permissions: one row per module+permission combo ──
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_id`    INT UNSIGNED NOT NULL,
  `module`     VARCHAR(100) NOT NULL,
  `permission` VARCHAR(50)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_role_module_perm` (`role_id`, `module`, `permission`),
  CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed: Super Admin role ──
INSERT INTO `roles` (`id`, `name`, `description`, `status`) VALUES
(1, 'Super Admin',    'Full access to all modules',            'Active'),
(2, 'HR Manager',     'Access to HR and payroll modules',      'Active'),
(3, 'Web Editor',     'Manage website content and tools',      'Active'),
(4, 'Viewer',         'Read-only access to all modules',       'Active'),
(5, 'HR Staff',       'Leave, claim and overtime management',  'Active'),
(6, 'Tender Officer', 'Manage tender and procurement modules', 'Inactive');
