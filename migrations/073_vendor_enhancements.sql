-- ============================================================
-- Migration 073: Vendor enhancements
--   ops_vendors: + published (website visibility), + state (region filter)
--   supplier_registrations: + fax, + accreditations (own columns)
--   Backfills state for seeded vendors by parsing the address.
-- ============================================================

-- ── ops_vendors.published ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_vendors' AND COLUMN_NAME='published');
SET @s := IF(@c=0, "ALTER TABLE `ops_vendors` ADD COLUMN `published` TINYINT(1) NOT NULL DEFAULT 1 AFTER `status`", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ── ops_vendors.state ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ops_vendors' AND COLUMN_NAME='state');
SET @s := IF(@c=0, "ALTER TABLE `ops_vendors` ADD COLUMN `state` VARCHAR(80) DEFAULT NULL AFTER `address`", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ── supplier_registrations.fax ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='supplier_registrations' AND COLUMN_NAME='fax');
SET @s := IF(@c=0, "ALTER TABLE `supplier_registrations` ADD COLUMN `fax` VARCHAR(40) DEFAULT NULL AFTER `office_phone`", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ── supplier_registrations.accreditations ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='supplier_registrations' AND COLUMN_NAME='accreditations');
SET @s := IF(@c=0, "ALTER TABLE `supplier_registrations` ADD COLUMN `accreditations` TEXT DEFAULT NULL AFTER `prod_desc`", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ── Backfill ops_vendors.state from address (only where empty) ──
UPDATE `ops_vendors` SET `state`='W.P. Kuala Lumpur' WHERE (`state` IS NULL OR `state`='') AND `address` LIKE '%Kuala Lumpur%';
UPDATE `ops_vendors` SET `state`='W.P. Labuan'        WHERE (`state` IS NULL OR `state`='') AND `address` LIKE '%Labuan%';
UPDATE `ops_vendors` SET `state`='W.P. Putrajaya'     WHERE (`state` IS NULL OR `state`='') AND `address` LIKE '%Putrajaya%';
UPDATE `ops_vendors` SET `state`='Johor'              WHERE (`state` IS NULL OR `state`='') AND `address` LIKE '%Johor%';
UPDATE `ops_vendors` SET `state`='Kedah'              WHERE (`state` IS NULL OR `state`='') AND `address` LIKE '%Kedah%';
UPDATE `ops_vendors` SET `state`='Kelantan'           WHERE (`state` IS NULL OR `state`='') AND `address` LIKE '%Kelantan%';
UPDATE `ops_vendors` SET `state`='Melaka'             WHERE (`state` IS NULL OR `state`='') AND `address` LIKE '%Melaka%';
UPDATE `ops_vendors` SET `state`='Negeri Sembilan'    WHERE (`state` IS NULL OR `state`='') AND `address` LIKE '%Negeri Sembilan%';
UPDATE `ops_vendors` SET `state`='Pahang'             WHERE (`state` IS NULL OR `state`='') AND `address` LIKE '%Pahang%';
UPDATE `ops_vendors` SET `state`='Perak'              WHERE (`state` IS NULL OR `state`='') AND `address` LIKE '%Perak%';
UPDATE `ops_vendors` SET `state`='Perlis'             WHERE (`state` IS NULL OR `state`='') AND `address` LIKE '%Perlis%';
UPDATE `ops_vendors` SET `state`='Pulau Pinang'       WHERE (`state` IS NULL OR `state`='') AND (`address` LIKE '%Pulau Pinang%' OR `address` LIKE '%Penang%');
UPDATE `ops_vendors` SET `state`='Sabah'              WHERE (`state` IS NULL OR `state`='') AND `address` LIKE '%Sabah%';
UPDATE `ops_vendors` SET `state`='Sarawak'            WHERE (`state` IS NULL OR `state`='') AND `address` LIKE '%Sarawak%';
UPDATE `ops_vendors` SET `state`='Selangor'           WHERE (`state` IS NULL OR `state`='') AND `address` LIKE '%Selangor%';
UPDATE `ops_vendors` SET `state`='Terengganu'         WHERE (`state` IS NULL OR `state`='') AND `address` LIKE '%Terengganu%';
UPDATE `ops_vendors` SET `state`='Singapore'          WHERE (`state` IS NULL OR `state`='') AND `address` LIKE '%Singapore%';
UPDATE `ops_vendors` SET `state`='Indonesia'          WHERE (`state` IS NULL OR `state`='') AND `address` LIKE '%Indonesia%';
