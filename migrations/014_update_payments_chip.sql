-- ============================================================
-- Migration 014: Add collection_id key for payments (CHIP Brand ID / ToyyibPay Category)
-- ============================================================

INSERT IGNORE INTO `integration_settings` (`module`, `key`, `value`) VALUES
('payments', 'collection_id', '');
