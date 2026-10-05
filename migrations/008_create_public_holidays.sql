-- ============================================================
-- Migration 008: Public Holidays & Custom Holidays tables
-- ============================================================

CREATE TABLE IF NOT EXISTS `public_holidays` (
  `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `date`        DATE          NOT NULL,
  `day_name`    VARCHAR(10)   NOT NULL,
  `name`        VARCHAR(200)  NOT NULL,
  `name_en`     VARCHAR(200)  NOT NULL,
  `type`        ENUM('national','regional') NOT NULL DEFAULT 'national',
  `state_codes` JSON          DEFAULT NULL COMMENT 'Array of state codes e.g. ["SGR","KUL"]',
  `year`        SMALLINT      NOT NULL,
  `is_active`   TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_date_name` (`date`, `name`),
  KEY `idx_year` (`year`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `custom_holidays` (
  `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `start_date`  DATE          NOT NULL,
  `end_date`    DATE          NOT NULL,
  `name`        VARCHAR(200)  NOT NULL,
  `state_codes` JSON          DEFAULT NULL COMMENT 'NULL = all states',
  `notes`       TEXT          DEFAULT NULL,
  `created_by`  INT UNSIGNED  DEFAULT NULL,
  `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_start_date` (`start_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Integration settings for holidays ──
INSERT IGNORE INTO `integration_settings` (`module`, `key`, `value`) VALUES
('holidays', 'last_sync',      ''),
('holidays', 'default_state',  'SGR');
