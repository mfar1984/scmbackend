-- ============================================================
-- Migration 056: Notifications (HR submissions: leave/claim/overtime/expense)
-- ============================================================

CREATE TABLE IF NOT EXISTS `notifications` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `type`        VARCHAR(30)  NOT NULL COMMENT 'leave | claim | overtime | expense',
  `title`       VARCHAR(160) NOT NULL,
  `message`     VARCHAR(400) NOT NULL,
  `link`        VARCHAR(255) DEFAULT NULL COMMENT 'admin route to open',
  `ref_table`   VARCHAR(60)  DEFAULT NULL,
  `ref_id`      INT UNSIGNED DEFAULT NULL,
  `reference_no` VARCHAR(40) DEFAULT NULL,
  `actor`       VARCHAR(160) DEFAULT NULL COMMENT 'employee name who submitted',
  `is_read`     TINYINT(1)   NOT NULL DEFAULT 0,
  `read_at`     TIMESTAMP    NULL DEFAULT NULL,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_read` (`is_read`),
  KEY `idx_notif_type` (`type`),
  KEY `idx_notif_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- HR notification recipient email (where submission alerts are sent).
INSERT INTO `config_settings` (`module`, `key`, `value`)
SELECT * FROM (SELECT 'general' AS m, 'hr_notify_email' AS k, 'hr@atline.com.my' AS v) AS t
WHERE NOT EXISTS (SELECT 1 FROM `config_settings` WHERE `module`='general' AND `key`='hr_notify_email');
