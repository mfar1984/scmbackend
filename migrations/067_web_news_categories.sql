-- ============================================================
-- Migration 067: Web News Categories (managed list)
-- Idempotent: safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS `web_news_categories` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL,
  `sort_order` INT          NOT NULL DEFAULT 0,
  `status`     ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_news_cat` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `web_news_categories` (`name`, `sort_order`) VALUES
('Company News',     1),
('Maritime Safety',  2),
('Industry Updates', 3),
('Events',           4);
