-- ============================================================
-- Migration 053: Configurable upload size limit (General config)
-- ============================================================

INSERT IGNORE INTO `config_settings` (`module`, `key`, `value`) VALUES
('general', 'max_upload_mb', '60');
