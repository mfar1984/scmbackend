-- ============================================================
-- Migration 052: Store download / tender files on disk
--   Large files broke MEDIUMTEXT (16MB) — switch to file paths.
--   Files are written under /public/uploads and served via API.
-- ============================================================

-- web_downloads.file_path
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='web_downloads' AND COLUMN_NAME='file_path');
SET @s := IF(@c=0, "ALTER TABLE `web_downloads` ADD COLUMN `file_path` VARCHAR(400) DEFAULT NULL AFTER `description`", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- web_downloads.file_data → allow NULL (legacy only)
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='web_downloads' AND COLUMN_NAME='file_data');
SET @s := IF(@c>0, "ALTER TABLE `web_downloads` MODIFY COLUMN `file_data` MEDIUMTEXT DEFAULT NULL", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ops_tenders.public_doc_path
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_tenders' AND COLUMN_NAME='public_doc_path');
SET @s := IF(@c=0, "ALTER TABLE `ops_tenders` ADD COLUMN `public_doc_path` VARCHAR(400) DEFAULT NULL AFTER `public_doc`", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
