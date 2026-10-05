-- ============================================================
-- Migration 005: Integration Settings
-- ============================================================

CREATE TABLE IF NOT EXISTS `integration_settings` (
  `id`         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `module`     VARCHAR(50)   NOT NULL COMMENT 'email | api | weather | holidays | payments | sms',
  `key`        VARCHAR(100)  NOT NULL,
  `value`      TEXT          DEFAULT NULL,
  `updated_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_module_key` (`module`, `key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed: Email defaults ──
INSERT INTO `integration_settings` (`module`, `key`, `value`) VALUES
('email', 'smtp_host',       'mail.atline.com.my'),
('email', 'smtp_port',       '587'),
('email', 'smtp_encryption', 'TLS'),
('email', 'smtp_user',       'noreply@atline.com.my'),
('email', 'smtp_pass',       ''),
('email', 'from_name',       'ATLINE SDN BHD'),
('email', 'from_email',      'noreply@atline.com.my'),
('email', 'reply_to',        'support@atline.com.my'),

-- ── Seed: API defaults ──
('api', 'enabled',           '1'),
('api', 'api_key',           ''),
('api', 'rate_limit',        '100'),
('api', 'rate_window',       '60'),
('api', 'cors_enabled',      '1'),
('api', 'allowed_origins',   '*'),
('api', 'webhook_secret',    ''),
('api', 'ip_whitelist_enabled', '0'),
('api', 'ip_whitelist',      ''),

-- ── Seed: Weather defaults ──
('weather', 'enabled',       '0'),
('weather', 'provider',      'openweathermap'),
('weather', 'api_key',       ''),
('weather', 'city',          'Petaling Jaya'),
('weather', 'country_code',  'MY'),
('weather', 'units',         'metric'),

-- ── Seed: Holidays defaults ──
('holidays', 'enabled',      '1'),
('holidays', 'country',      'MY'),
('holidays', 'state',        'Selangor'),
('holidays', 'api_key',      ''),

-- ── Seed: Payments defaults ──
('payments', 'enabled',      '0'),
('payments', 'provider',     'billplz'),
('payments', 'api_key',      ''),
('payments', 'secret_key',   ''),
('payments', 'sandbox_mode', '1'),
('payments', 'collection_id',''),

-- ── Seed: SMS defaults ──
('sms', 'enabled',           '0'),
('sms', 'provider',          'nexmo'),
('sms', 'api_key',           ''),
('sms', 'api_secret',        ''),
('sms', 'sender_id',         'ATLINE');
