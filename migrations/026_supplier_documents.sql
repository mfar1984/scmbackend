-- ============================================================
-- Migration 026: Supplier registration document attachments
-- ============================================================
-- Single-file docs stored as base64 data URLs (MEDIUMTEXT) + original filename.
-- "Other certificates" (multiple) stored as a JSON array of {name,data}.

-- helper macro pattern repeated per column
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='supplier_registrations' AND COLUMN_NAME='doc_ssm');
SET @s := IF(@c=0, 'ALTER TABLE `supplier_registrations` ADD COLUMN `doc_ssm` MEDIUMTEXT DEFAULT NULL, ADD COLUMN `doc_ssm_name` VARCHAR(255) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='supplier_registrations' AND COLUMN_NAME='doc_profile');
SET @s := IF(@c=0, 'ALTER TABLE `supplier_registrations` ADD COLUMN `doc_profile` MEDIUMTEXT DEFAULT NULL, ADD COLUMN `doc_profile_name` VARCHAR(255) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='supplier_registrations' AND COLUMN_NAME='doc_mof');
SET @s := IF(@c=0, 'ALTER TABLE `supplier_registrations` ADD COLUMN `doc_mof` MEDIUMTEXT DEFAULT NULL, ADD COLUMN `doc_mof_name` VARCHAR(255) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='supplier_registrations' AND COLUMN_NAME='doc_cidb');
SET @s := IF(@c=0, 'ALTER TABLE `supplier_registrations` ADD COLUMN `doc_cidb` MEDIUMTEXT DEFAULT NULL, ADD COLUMN `doc_cidb_name` VARCHAR(255) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='supplier_registrations' AND COLUMN_NAME='doc_financial');
SET @s := IF(@c=0, 'ALTER TABLE `supplier_registrations` ADD COLUMN `doc_financial` MEDIUMTEXT DEFAULT NULL, ADD COLUMN `doc_financial_name` VARCHAR(255) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='supplier_registrations' AND COLUMN_NAME='doc_bank');
SET @s := IF(@c=0, 'ALTER TABLE `supplier_registrations` ADD COLUMN `doc_bank` MEDIUMTEXT DEFAULT NULL, ADD COLUMN `doc_bank_name` VARCHAR(255) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='supplier_registrations' AND COLUMN_NAME='doc_other');
SET @s := IF(@c=0, 'ALTER TABLE `supplier_registrations` ADD COLUMN `doc_other` MEDIUMTEXT DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
