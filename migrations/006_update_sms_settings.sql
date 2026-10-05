-- ============================================================
-- Migration 006: Add triggers key to SMS settings
-- ============================================================

INSERT IGNORE INTO `integration_settings` (`module`, `key`, `value`) VALUES
('sms', 'triggers', '{"leaveApproved":true,"leaveRejected":true,"claimApproved":true,"claimRejected":false,"otApproved":true,"newApplication":false,"payslipReady":true,"passwordReset":true}');
