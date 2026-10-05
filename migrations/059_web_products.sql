-- ============================================================
-- Migration 059: Web Products — managed product catalog items
--   Each row is a product/category card shown on the public
--   Products page. Optional uploaded image stored on disk.
-- ============================================================

CREATE TABLE IF NOT EXISTS `web_products` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`       VARCHAR(200) NOT NULL,
  `tag`         VARCHAR(120) DEFAULT NULL COMMENT 'short label e.g. Layer 2 / Layer 3',
  `category`    VARCHAR(120) NOT NULL DEFAULT 'General',
  `description` TEXT         DEFAULT NULL,
  `specs`       TEXT         DEFAULT NULL COMMENT 'one spec per line',
  `brands`      VARCHAR(400) DEFAULT NULL COMMENT 'comma separated brand names',
  `icon`        VARCHAR(60)  DEFAULT 'bi-box-seam',
  `image_path`  VARCHAR(400) DEFAULT NULL,
  `image_name`  VARCHAR(255) DEFAULT NULL,
  `mime_type`   VARCHAR(120) DEFAULT NULL,
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'Active' COMMENT 'Active | Hidden',
  `sort_order`  INT          NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_prod_status` (`status`),
  KEY `idx_prod_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
