-- ============================================================
-- Migration 010: Add missing API settings keys
-- ============================================================

INSERT IGNORE INTO `integration_settings` (`module`, `key`, `value`) VALUES
('api', 'allowed_methods',  'GET,POST,PUT,DELETE'),
('api', 'require_https',    '1'),
('api', 'rate_limit_enabled','1'),
('api', 'rate_burst',       '20'),
('api', 'rate_action',      'block');
