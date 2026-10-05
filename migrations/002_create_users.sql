-- ============================================================
-- Migration 002: Users
-- ============================================================

CREATE TABLE IF NOT EXISTS `users` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(150)    NOT NULL,
  `email`       VARCHAR(191)    NOT NULL,
  `phone`       VARCHAR(30)     DEFAULT NULL,
  `password`    VARCHAR(255)    NOT NULL,
  `role_id`     INT UNSIGNED    DEFAULT NULL,
  `user_type`   ENUM('administrator','staff','client') NOT NULL DEFAULT 'staff',
  `status`      ENUM('Active','Inactive','Suspended')  NOT NULL DEFAULT 'Active',
  `department`  VARCHAR(100)    DEFAULT NULL,
  `position`    VARCHAR(100)    DEFAULT NULL,
  `join_date`   DATE            DEFAULT NULL,
  `last_login`  DATETIME        DEFAULT NULL,
  `created_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed: Sample users (password = "password123" hashed) ──
-- bcrypt hash of "password123"
INSERT INTO `users` (`name`, `email`, `phone`, `password`, `role_id`, `user_type`, `status`, `department`, `position`, `join_date`, `last_login`) VALUES
('Ahmad Faris',      'ahmad.faris@atline.com.my',  '012-345 6789', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 'administrator', 'Active',    'Management',    'System Administrator', '2024-01-01', '2026-01-15 09:12:00'),
('Nurul Izzati',     'nurul.izzati@atline.com.my', '011-234 5678', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 'administrator', 'Active',    'Management',    'IT Manager',           '2024-03-15', '2026-01-14 16:45:00'),
('Razif Hakim',      'razif.hakim@atline.com.my',  '019-876 5432', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 'administrator', 'Inactive',  'Management',    'System Administrator', '2024-06-01', '2025-12-01 11:00:00'),
('Siti Nabilah',     'siti.nabilah@atline.com.my', '013-456 7890', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2, 'staff',         'Active',    'Human Resources','HR Manager',           '2024-02-01', '2026-01-15 08:30:00'),
('Hafizuddin',       'hafizuddin@atline.com.my',   '017-654 3210', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3, 'staff',         'Active',    'Marketing',     'Web Editor',           '2024-04-15', '2026-01-13 14:15:00'),
('Amirah Zulaikha',  'amirah.z@atline.com.my',     '016-789 0123', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 5, 'staff',         'Active',    'Human Resources','HR Executive',         '2024-05-01', '2026-01-12 10:00:00'),
('Khairul Anwar',    'khairul.anwar@atline.com.my','018-321 0987', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 5, 'staff',         'Suspended', 'Human Resources','HR Assistant',         '2024-07-01', '2025-11-05 09:00:00'),
('Politeknik KL',    'ict@politeknik.edu.my',      '03-1234 5678', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 4, 'client',        'Active',    NULL,            NULL,                   NULL,         '2026-01-10 15:00:00'),
('Kolej Komuniti SJ','admin@kksj.edu.my',          '03-8765 4321', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 4, 'client',        'Active',    NULL,            NULL,                   NULL,         '2026-01-08 11:30:00'),
('Syarikat ABC Sdn', 'procurement@abc.com.my',     '03-5678 9012', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 4, 'client',        'Inactive',  NULL,            NULL,                   NULL,         '2025-12-20 09:45:00');
