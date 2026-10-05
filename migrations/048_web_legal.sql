-- ============================================================
-- Migration 048: Web — Legal pages + Sitemap entries
--   Privacy Policy / Terms of Service / Disclaimer (editable content)
--   Sitemap URL entries (drive a generated sitemap.xml)
-- ============================================================

-- ── Legal content pages ──
CREATE TABLE IF NOT EXISTS `web_legal_pages` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug`       VARCHAR(60)  NOT NULL,
  `title`      VARCHAR(200) NOT NULL,
  `content`    MEDIUMTEXT   DEFAULT NULL COMMENT 'HTML content',
  `status`     VARCHAR(20)  NOT NULL DEFAULT 'Published' COMMENT 'Published | Draft',
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_legal_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `web_legal_pages` (`slug`, `title`, `content`, `status`) VALUES
('privacy-policy',   'Privacy Policy',    '', 'Draft'),
('terms-of-service', 'Terms of Service',  '', 'Draft'),
('disclaimer',       'Disclaimer',        '', 'Draft');

-- ── Sitemap URL entries ──
CREATE TABLE IF NOT EXISTS `web_sitemap_entries` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `loc`        VARCHAR(300) NOT NULL COMMENT 'relative path e.g. /about',
  `changefreq` VARCHAR(20)  NOT NULL DEFAULT 'monthly' COMMENT 'always|hourly|daily|weekly|monthly|yearly|never',
  `priority`   DECIMAL(2,1) NOT NULL DEFAULT 0.5,
  `sort_order` INT          NOT NULL DEFAULT 0,
  `enabled`    TINYINT(1)   NOT NULL DEFAULT 1,
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sitemap_loc` (`loc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `web_sitemap_entries` (`loc`, `changefreq`, `priority`, `sort_order`) VALUES
('/',                  'weekly',  1.0, 1),
('/about',             'monthly', 0.8, 2),
('/solutions',         'monthly', 0.9, 3),
('/services',          'monthly', 0.9, 4),
('/business',          'monthly', 0.7, 5),
('/projects',          'weekly',  0.8, 6),
('/resources',         'monthly', 0.7, 7),
('/contact',           'monthly', 0.8, 8),
('/privacy-policy',    'yearly',  0.3, 9),
('/terms-of-service',  'yearly',  0.3, 10),
('/disclaimer',        'yearly',  0.3, 11);
