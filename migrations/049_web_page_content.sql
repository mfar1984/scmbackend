-- ============================================================
-- Migration 049: Web page content (CMS) — structured JSON per page
--   Each website page (e.g. about/about-us) stores its editable
--   fields as a JSON document. Schema-driven editor on the admin.
-- ============================================================

CREATE TABLE IF NOT EXISTS `web_page_content` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug`       VARCHAR(120) NOT NULL COMMENT 'route key e.g. about/about-us',
  `content`    MEDIUMTEXT   DEFAULT NULL COMMENT 'JSON document of fields',
  `status`     VARCHAR(20)  NOT NULL DEFAULT 'Published' COMMENT 'Published | Draft',
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_page_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
