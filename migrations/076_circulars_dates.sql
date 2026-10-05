-- ============================================================
-- Migration 076: Circulars — split date into Release + Effective
--   Adds release_date & effective_date; backfills release_date
--   from the existing circular_date. (circular_date kept as legacy.)
-- ============================================================

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='web_circulars' AND COLUMN_NAME='release_date');
SET @s := IF(@c=0, "ALTER TABLE `web_circulars` ADD COLUMN `release_date` DATE DEFAULT NULL AFTER `year`", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='web_circulars' AND COLUMN_NAME='effective_date');
SET @s := IF(@c=0, "ALTER TABLE `web_circulars` ADD COLUMN `effective_date` DATE DEFAULT NULL AFTER `release_date`", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Backfill release_date from the legacy circular_date (only where empty)
UPDATE `web_circulars` SET `release_date` = `circular_date` WHERE `release_date` IS NULL AND `circular_date` IS NOT NULL;
