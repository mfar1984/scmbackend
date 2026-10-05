-- ============================================================
-- Migration 043: Professional tender fields
--   agency contact, procurement method, category, fees, timing
-- ============================================================

-- helper to add a column only if missing
-- (repeated blocks, idempotent)

-- ── Tender classification ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_tenders' AND COLUMN_NAME='category');
SET @s := IF(@c=0,"ALTER TABLE `ops_tenders` ADD COLUMN `category` VARCHAR(40) DEFAULT NULL COMMENT 'Supply | Services | Works | Supply & Install' AFTER `agency`",'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_tenders' AND COLUMN_NAME='procurement_method');
SET @s := IF(@c=0,"ALTER TABLE `ops_tenders` ADD COLUMN `procurement_method` VARCHAR(40) DEFAULT NULL COMMENT 'Open Tender | Selective | Quotation | Direct Negotiation' AFTER `category`",'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ── Timing & fees ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_tenders' AND COLUMN_NAME='closing_time');
SET @s := IF(@c=0,"ALTER TABLE `ops_tenders` ADD COLUMN `closing_time` VARCHAR(10) DEFAULT NULL AFTER `closing_date`",'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_tenders' AND COLUMN_NAME='briefing_date');
SET @s := IF(@c=0,"ALTER TABLE `ops_tenders` ADD COLUMN `briefing_date` DATE DEFAULT NULL AFTER `closing_time`",'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_tenders' AND COLUMN_NAME='document_fee');
SET @s := IF(@c=0,"ALTER TABLE `ops_tenders` ADD COLUMN `document_fee` DECIMAL(12,2) DEFAULT NULL AFTER `estimated_value`",'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_tenders' AND COLUMN_NAME='tender_deposit');
SET @s := IF(@c=0,"ALTER TABLE `ops_tenders` ADD COLUMN `tender_deposit` DECIMAL(12,2) DEFAULT NULL AFTER `document_fee`",'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ── Agency contact (the missing professional piece) ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_tenders' AND COLUMN_NAME='contact_person');
SET @s := IF(@c=0,"ALTER TABLE `ops_tenders` ADD COLUMN `contact_person` VARCHAR(150) DEFAULT NULL AFTER `assigned_to`",'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_tenders' AND COLUMN_NAME='contact_designation');
SET @s := IF(@c=0,"ALTER TABLE `ops_tenders` ADD COLUMN `contact_designation` VARCHAR(120) DEFAULT NULL AFTER `contact_person`",'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_tenders' AND COLUMN_NAME='contact_phone');
SET @s := IF(@c=0,"ALTER TABLE `ops_tenders` ADD COLUMN `contact_phone` VARCHAR(40) DEFAULT NULL AFTER `contact_designation`",'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_tenders' AND COLUMN_NAME='contact_email');
SET @s := IF(@c=0,"ALTER TABLE `ops_tenders` ADD COLUMN `contact_email` VARCHAR(150) DEFAULT NULL AFTER `contact_phone`",'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_tenders' AND COLUMN_NAME='agency_address');
SET @s := IF(@c=0,"ALTER TABLE `ops_tenders` ADD COLUMN `agency_address` VARCHAR(400) DEFAULT NULL AFTER `contact_email`",'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
