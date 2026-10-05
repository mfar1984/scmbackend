-- ============================================================
-- Migration 068: add updated_at to web_news_categories
-- Idempotent (guarded ALTER).
-- ============================================================

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='web_news_categories' AND COLUMN_NAME='updated_at');
SET @s := IF(@c=0, 'ALTER TABLE `web_news_categories` ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
