-- ============================================================
-- Migration 013: Activity Logs & Audit Logs tables
-- ============================================================

CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id`         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `timestamp`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `level`      ENUM('INFO','WARN','ERROR','DEBUG') NOT NULL DEFAULT 'INFO',
  `category`   VARCHAR(50)   NOT NULL DEFAULT 'System',
  `user`       VARCHAR(191)  NOT NULL DEFAULT 'system',
  `ip`         VARCHAR(45)   DEFAULT NULL,
  `message`    TEXT          NOT NULL,
  `details`    TEXT          DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_level`     (`level`),
  KEY `idx_category`  (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `timestamp`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `action`      ENUM('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT','APPROVE','REJECT') NOT NULL,
  `module`      VARCHAR(50)   NOT NULL,
  `user`        VARCHAR(191)  NOT NULL,
  `user_role`   VARCHAR(100)  DEFAULT NULL,
  `ip`          VARCHAR(45)   DEFAULT NULL,
  `target`      VARCHAR(255)  NOT NULL,
  `description` TEXT          NOT NULL,
  `before_data` JSON          DEFAULT NULL,
  `after_data`  JSON          DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_action`    (`action`),
  KEY `idx_module`    (`module`),
  KEY `idx_user`      (`user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed: Sample activity logs ──
INSERT INTO `activity_logs` (`timestamp`, `level`, `category`, `user`, `ip`, `message`, `details`) VALUES
('2026-05-27 09:12:34', 'INFO',  'Auth',        'admin@atline.com.my',        '192.168.1.10', 'User logged in successfully',                                          'Browser: Chrome 124, OS: Windows 11'),
('2026-05-27 09:05:11', 'INFO',  'Backup',      'system',                     '127.0.0.1',    'Scheduled backup completed: backup_2026-05-27_03-00.zip (24.3 MB)',    NULL),
('2026-05-27 08:44:22', 'WARN',  'Auth',        'unknown',                    '103.21.45.67', 'Failed login attempt (3rd attempt)',                                   'Email: unknown@test.com — Account temporarily locked after 5 attempts'),
('2026-05-27 08:30:05', 'INFO',  'Application', 'admin@atline.com.my',        '192.168.1.10', 'Career application approved: Ahmad Faris (Network Engineer)',          NULL),
('2026-05-27 08:15:44', 'INFO',  'Users',       'admin@atline.com.my',        '192.168.1.10', 'New administrator account created: nurul.izzati@atline.com.my',        NULL),
('2026-05-26 22:15:44', 'ERROR', 'Email',       'system',                     '127.0.0.1',    'SMTP connection timeout — email delivery failed',                      'Recipient: support@atline.com.my, SMTP Host: mail.atline.com.my:587, Error: Connection timed out after 30s'),
('2026-05-26 17:30:12', 'INFO',  'Web Tools',   'admin@atline.com.my',        '192.168.1.10', 'FAQ content updated: 3 questions modified',                            NULL),
('2026-05-26 15:30:05', 'INFO',  'Cache',       'admin@atline.com.my',        '192.168.1.10', 'Application cache cleared manually',                                   NULL),
('2026-05-26 14:08:33', 'INFO',  'Application', 'system',                     '127.0.0.1',    'New supplier registration received: Syarikat XYZ Sdn Bhd',             NULL),
('2026-05-26 11:22:18', 'WARN',  'API',         'api_client',                 '45.33.12.88',  'Rate limit approaching: 87/100 requests in current window',            'API Key: atl_live_xxx...xxx, Endpoint: /api/v1/applications'),
('2026-05-26 10:05:00', 'INFO',  'Auth',        'siti.nabilah@atline.com.my', '192.168.1.15', 'User logged in successfully',                                          NULL),
('2026-05-26 09:00:01', 'INFO',  'Backup',      'system',                     '127.0.0.1',    'Scheduled backup started',                                             NULL),
('2026-05-25 16:45:33', 'ERROR', 'Webhook',     'system',                     '127.0.0.1',    'Webhook delivery failed: Career Application Notify',                   'URL: https://hooks.example.com/career, HTTP 503, Retry 3/3 exhausted'),
('2026-05-25 14:20:11', 'INFO',  'Config',      'admin@atline.com.my',        '192.168.1.10', 'Global config updated: SMTP settings modified',                        NULL),
('2026-05-25 11:10:55', 'DEBUG', 'API',         'api_client',                 '45.33.12.88',  'API request: GET /api/v1/applications?status=pending',                 'Response: 200 OK, 12 records, 45ms');

-- ── Seed: Sample audit logs ──
INSERT INTO `audit_logs` (`timestamp`, `action`, `module`, `user`, `user_role`, `ip`, `target`, `description`, `before_data`, `after_data`) VALUES
('2026-05-27 09:12:34', 'LOGIN',   'Auth',        'admin@atline.com.my',        'Super Admin', '192.168.1.10', 'System',                                    'Administrator logged in',                          NULL, NULL),
('2026-05-27 08:30:05', 'APPROVE', 'Application', 'admin@atline.com.my',        'Super Admin', '192.168.1.10', 'Career Application #1042 (Ahmad Faris)',     'Career application status changed to Approved',    '{"status":"Pending"}', '{"status":"Approved"}'),
('2026-05-27 08:15:44', 'CREATE',  'Users',       'admin@atline.com.my',        'Super Admin', '192.168.1.10', 'User: nurul.izzati@atline.com.my',           'New administrator account created',                NULL, '{"name":"Nurul Izzati","email":"nurul.izzati@atline.com.my","role":"Super Admin","status":"Active"}'),
('2026-05-26 17:30:12', 'UPDATE',  'Web Tools',   'admin@atline.com.my',        'Super Admin', '192.168.1.10', 'FAQ: "What is structured cabling?"',         'FAQ answer updated',                               '{"answer":"Structured cabling is a system..."}', '{"answer":"Structured cabling is a standardised system..."}'),
('2026-05-26 15:30:05', 'DELETE',  'Cache',       'admin@atline.com.my',        'Super Admin', '192.168.1.10', 'Application Cache',                          'Application cache cleared manually',               NULL, NULL),
('2026-05-26 14:08:33', 'UPDATE',  'Config',      'admin@atline.com.my',        'Super Admin', '192.168.1.10', 'Global Config: SMTP Settings',               'SMTP configuration updated',                       '{"host":"mail.old.com","port":"25"}', '{"host":"mail.atline.com.my","port":"587"}'),
('2026-05-26 11:22:18', 'EXPORT',  'Application', 'admin@atline.com.my',        'Super Admin', '192.168.1.10', 'Career Applications (CSV)',                  'Exported 24 career application records to CSV',    NULL, NULL),
('2026-05-26 11:00:05', 'LOGIN',   'Auth',        'siti.nabilah@atline.com.my', 'HR Manager',  '192.168.1.15', 'System',                                    'HR Manager logged in',                             NULL, NULL),
('2026-05-25 16:45:33', 'REJECT',  'Application', 'admin@atline.com.my',        'Super Admin', '192.168.1.10', 'Supplier Registration: Syarikat ABC Sdn Bhd','Supplier registration rejected',                   '{"status":"Pending"}', '{"status":"Rejected","reason":"Incomplete documentation"}'),
('2026-05-25 14:20:11', 'UPDATE',  'Roles',       'admin@atline.com.my',        'Super Admin', '192.168.1.10', 'Role: HR Manager',                          'Role permissions updated',                         '{"payroll_view":"false"}', '{"payroll_view":"true"}'),
('2026-05-25 10:05:44', 'DELETE',  'Users',       'admin@atline.com.my',        'Super Admin', '192.168.1.10', 'User: khairul.anwar@atline.com.my',          'Staff account deleted',                            '{"name":"Khairul Anwar","status":"Suspended"}', NULL),
('2026-05-24 17:30:00', 'LOGOUT',  'Auth',        'admin@atline.com.my',        'Super Admin', '192.168.1.10', 'System',                                    'Administrator logged out',                         NULL, NULL);
