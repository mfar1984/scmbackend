-- ============================================================
-- Migration 030: Claim upgrade — types (code/color/receipt) + claim items
-- ============================================================

-- ── Claim Types: code, color, receipt_required ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_claim_types' AND COLUMN_NAME='code');
SET @s := IF(@c=0, 'ALTER TABLE `hr_claim_types` ADD COLUMN `code` VARCHAR(20) DEFAULT NULL AFTER `id`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_claim_types' AND COLUMN_NAME='color');
SET @s := IF(@c=0, "ALTER TABLE `hr_claim_types` ADD COLUMN `color` VARCHAR(20) DEFAULT '#3b82f6'", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_claim_types' AND COLUMN_NAME='receipt_required');
SET @s := IF(@c=0, 'ALTER TABLE `hr_claim_types` ADD COLUMN `receipt_required` TINYINT(1) NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ── Claim applications: remarks ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_claim_applications' AND COLUMN_NAME='remarks');
SET @s := IF(@c=0, 'ALTER TABLE `hr_claim_applications` ADD COLUMN `remarks` TEXT DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ── Claim Items (line items per claim) ──
CREATE TABLE IF NOT EXISTS `hr_claim_items` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `claim_id`    INT UNSIGNED NOT NULL,
  `item_date`   DATE         DEFAULT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `category_id` INT UNSIGNED DEFAULT NULL,
  `amount`      DECIMAL(12,2) NOT NULL DEFAULT 0,
  `receipt`     MEDIUMTEXT   DEFAULT NULL,
  `receipt_name` VARCHAR(255) DEFAULT NULL,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_claim_item` (`claim_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed codes/colors for existing claim types
UPDATE `hr_claim_types` SET `code`='MED', `color`='#ef4444' WHERE `name`='Medical Claim'  AND (`code` IS NULL OR `code`='');
UPDATE `hr_claim_types` SET `code`='TRV', `color`='#3b82f6' WHERE `name`='Travel Claim'   AND (`code` IS NULL OR `code`='');
UPDATE `hr_claim_types` SET `code`='MEA', `color`='#f59e0b' WHERE `name`='Meal Claim'     AND (`code` IS NULL OR `code`='');
UPDATE `hr_claim_types` SET `code`='PHN', `color`='#8b5cf6' WHERE `name`='Phone Claim'    AND (`code` IS NULL OR `code`='');
