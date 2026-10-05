-- ============================================================
-- Migration 015: Add callback_url key for payments
-- ============================================================

INSERT IGNORE INTO `integration_settings` (`module`, `key`, `value`) VALUES
('payments', 'callback_url', '');
