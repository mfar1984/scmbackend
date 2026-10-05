-- ============================================================
-- Migration 009: Webhooks table
-- ============================================================

CREATE TABLE IF NOT EXISTS `webhooks` (
  `id`         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(150)  NOT NULL,
  `url`        VARCHAR(500)  NOT NULL,
  `events`     VARCHAR(500)  DEFAULT NULL COMMENT 'Comma-separated event names, NULL = all events',
  `status`     ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed: Default webhooks ──
INSERT INTO `webhooks` (`name`, `url`, `events`, `status`) VALUES
('Career Application Notify', 'https://hooks.example.com/career',      'application.created, application.updated', 'Active'),
('Supplier Registration',     'https://hooks.example.com/procurement', 'supplier.registered',                       'Active');
