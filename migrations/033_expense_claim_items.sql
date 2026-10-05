-- ============================================================
-- Migration 033: Expense header fields + expense items; claim item remarks
-- ============================================================

-- ── Expense header fields ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_expense_applications' AND COLUMN_NAME='vendor_name');
SET @s := IF(@c=0, 'ALTER TABLE `hr_expense_applications` ADD COLUMN `vendor_name` VARCHAR(180) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_expense_applications' AND COLUMN_NAME='invoice_number');
SET @s := IF(@c=0, 'ALTER TABLE `hr_expense_applications` ADD COLUMN `invoice_number` VARCHAR(100) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_expense_applications' AND COLUMN_NAME='payment_method');
SET @s := IF(@c=0, 'ALTER TABLE `hr_expense_applications` ADD COLUMN `payment_method` VARCHAR(60) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_expense_applications' AND COLUMN_NAME='payment_reference');
SET @s := IF(@c=0, 'ALTER TABLE `hr_expense_applications` ADD COLUMN `payment_reference` VARCHAR(120) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_expense_applications' AND COLUMN_NAME='tax_amount');
SET @s := IF(@c=0, 'ALTER TABLE `hr_expense_applications` ADD COLUMN `tax_amount` DECIMAL(12,2) DEFAULT 0', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_expense_applications' AND COLUMN_NAME='remarks');
SET @s := IF(@c=0, 'ALTER TABLE `hr_expense_applications` ADD COLUMN `remarks` TEXT DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ── Expense Items (qty x unit price) ──
CREATE TABLE IF NOT EXISTS `hr_expense_items` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `expense_id`  INT UNSIGNED NOT NULL,
  `item_date`   DATE         DEFAULT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `qty`         DECIMAL(10,2) NOT NULL DEFAULT 1,
  `unit_price`  DECIMAL(12,2) NOT NULL DEFAULT 0,
  `amount`      DECIMAL(12,2) NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expense_item` (`expense_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Claim item remarks ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_claim_items' AND COLUMN_NAME='remarks');
SET @s := IF(@c=0, 'ALTER TABLE `hr_claim_items` ADD COLUMN `remarks` VARCHAR(255) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
