-- ============================================================
-- Migration 012: Add logo/image keys to branding config
-- ============================================================

INSERT IGNORE INTO `config_settings` (`module`, `key`, `value`) VALUES
('branding', 'admin_logo',   ''),
('branding', 'sidebar_logo', ''),
('branding', 'login_image',  ''),
('branding', 'favicon',      '');
