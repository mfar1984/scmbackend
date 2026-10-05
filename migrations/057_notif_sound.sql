-- ============================================================
-- Migration 057: Notification sound selection (branding module)
-- ============================================================
INSERT INTO `config_settings` (`module`, `key`, `value`)
SELECT * FROM (SELECT 'branding' AS m, 'notif_sound' AS k, '' AS v) AS t
WHERE NOT EXISTS (SELECT 1 FROM `config_settings` WHERE `module`='branding' AND `key`='notif_sound');
