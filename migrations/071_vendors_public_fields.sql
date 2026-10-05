-- ============================================================
-- Migration 071: Extend ops_vendors for the public "Approved
--   Vendors / Service Suppliers" listing on the website.
--   Adds fax, expiry_date (validity) and manufacturer columns.
--   Also removes leftover ATLINE junk vendor rows.
-- ============================================================

-- ── fax ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_vendors' AND COLUMN_NAME='fax');
SET @s := IF(@c=0, "ALTER TABLE `ops_vendors` ADD COLUMN `fax` VARCHAR(40) DEFAULT NULL AFTER `phone`", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ── expiry_date (approval validity) ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_vendors' AND COLUMN_NAME='expiry_date');
SET @s := IF(@c=0, "ALTER TABLE `ops_vendors` ADD COLUMN `expiry_date` DATE DEFAULT NULL AFTER `address`", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ── manufacturer (authorized manufacturer, e.g. VDR/SVDR) ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_vendors' AND COLUMN_NAME='manufacturer');
SET @s := IF(@c=0, "ALTER TABLE `ops_vendors` ADD COLUMN `manufacturer` VARCHAR(120) DEFAULT NULL AFTER `category`", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ── Remove leftover ATLINE junk vendor(s) ──
DELETE FROM `ops_vendors` WHERE `name` = 'KF Legacy Resources';
