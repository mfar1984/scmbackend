-- ============================================================
-- Migration 051: Public tender publishing + downloadable document
--   Lets a tender be shown on the website with a downloadable
--   document, optionally gated behind email verification.
--   Reuses web_download_logs (adds a `kind` discriminator).
-- ============================================================

-- ── ops_tenders: public publishing fields ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_tenders' AND COLUMN_NAME='is_public');
SET @s := IF(@c=0,"ALTER TABLE `ops_tenders` ADD COLUMN `is_public` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'show on website tender page'",'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_tenders' AND COLUMN_NAME='require_email');
SET @s := IF(@c=0,"ALTER TABLE `ops_tenders` ADD COLUMN `require_email` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'gate doc download behind email'",'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_tenders' AND COLUMN_NAME='public_doc');
SET @s := IF(@c=0,"ALTER TABLE `ops_tenders` ADD COLUMN `public_doc` MEDIUMTEXT DEFAULT NULL COMMENT 'public tender document (base64)', ADD COLUMN `public_doc_name` VARCHAR(255) DEFAULT NULL, ADD COLUMN `public_doc_mime` VARCHAR(120) DEFAULT NULL",'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_tenders' AND COLUMN_NAME='public_downloads');
SET @s := IF(@c=0,"ALTER TABLE `ops_tenders` ADD COLUMN `public_downloads` INT UNSIGNED NOT NULL DEFAULT 0",'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ── web_download_logs: discriminate downloads vs tenders ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='web_download_logs' AND COLUMN_NAME='kind');
SET @s := IF(@c=0,"ALTER TABLE `web_download_logs` ADD COLUMN `kind` VARCHAR(20) NOT NULL DEFAULT 'download' COMMENT 'download | tender' AFTER `download_id`",'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
