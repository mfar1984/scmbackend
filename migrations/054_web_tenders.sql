-- ============================================================
-- Migration 054: Web Tenders — public tender listings with
--   uploadable document (disk) + optional email verification.
--   Reuses web_download_logs (kind='tender') for the gate.
-- ============================================================

CREATE TABLE IF NOT EXISTS `web_tenders` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ref_no`         VARCHAR(80)  DEFAULT NULL,
  `title`          VARCHAR(255) NOT NULL,
  `category`       VARCHAR(120) DEFAULT 'Network Infrastructure',
  `cat_icon`       VARCHAR(60)  DEFAULT 'bi-ethernet',
  `sector`         VARCHAR(40)  DEFAULT 'Government' COMMENT 'Government | Private',
  `value`          VARCHAR(120) DEFAULT NULL COMMENT 'estimated value text e.g. RM 350,000 – RM 500,000',
  `issued_date`    VARCHAR(40)  DEFAULT NULL,
  `deadline`       VARCHAR(40)  DEFAULT NULL,
  `tender_status`  VARCHAR(20)  NOT NULL DEFAULT 'open' COMMENT 'open | closing | closed',
  `description`    TEXT         DEFAULT NULL,
  -- downloadable tender document (on disk)
  `file_path`      VARCHAR(400) DEFAULT NULL,
  `file_name`      VARCHAR(255) DEFAULT NULL,
  `mime_type`      VARCHAR(120) DEFAULT NULL,
  `file_size`      VARCHAR(20)  DEFAULT NULL,
  `require_email`  TINYINT(1)   NOT NULL DEFAULT 0,
  `download_count` INT UNSIGNED NOT NULL DEFAULT 0,
  -- visibility on website
  `status`         VARCHAR(20)  NOT NULL DEFAULT 'Active' COMMENT 'Active | Hidden',
  `sort_order`     INT          NOT NULL DEFAULT 0,
  `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wtender_status` (`status`),
  KEY `idx_wtender_tstatus` (`tender_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
