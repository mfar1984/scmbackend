-- ============================================================
-- Migration 047: Widen config_settings.value to MEDIUMTEXT
--   Base64 logo/favicon images exceed TEXT (64KB). MEDIUMTEXT = 16MB.
-- ============================================================

ALTER TABLE `config_settings` MODIFY COLUMN `value` MEDIUMTEXT DEFAULT NULL;
