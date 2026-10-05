-- ============================================================
-- Migration 050: Web Downloads — managed downloadable files
--   Files uploaded by admin (base64 in MEDIUMTEXT), optionally
--   gated behind email verification. Logs capture leads + downloads.
-- ============================================================

CREATE TABLE IF NOT EXISTS `web_downloads` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category`       VARCHAR(80)  NOT NULL DEFAULT 'General',
  `title`          VARCHAR(200) NOT NULL,
  `description`    TEXT         DEFAULT NULL,
  `file_data`      MEDIUMTEXT   DEFAULT NULL COMMENT 'base64 data URL',
  `file_name`      VARCHAR(255) DEFAULT NULL,
  `mime_type`      VARCHAR(120) DEFAULT NULL,
  `file_size`      VARCHAR(20)  DEFAULT NULL COMMENT 'human readable e.g. 2.4 MB',
  `icon`           VARCHAR(60)  DEFAULT 'bi-file-earmark-text',
  `require_email`  TINYINT(1)   NOT NULL DEFAULT 0,
  `status`         VARCHAR(20)  NOT NULL DEFAULT 'Active' COMMENT 'Active | Hidden',
  `download_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `sort_order`     INT          NOT NULL DEFAULT 0,
  `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dl_status` (`status`),
  KEY `idx_dl_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Download requests / leads (email verification + download tracking) ──
CREATE TABLE IF NOT EXISTS `web_download_logs` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `download_id`   INT UNSIGNED NOT NULL,
  `email`         VARCHAR(150) DEFAULT NULL,
  `name`          VARCHAR(150) DEFAULT NULL,
  `company`       VARCHAR(180) DEFAULT NULL,
  `token`         VARCHAR(80)  DEFAULT NULL,
  `verified`      TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `downloaded_at` DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_dlog_download` (`download_id`),
  KEY `idx_dlog_token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
