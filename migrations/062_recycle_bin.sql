-- ============================================================
-- Migration 062: Recycle Bin — centralised soft-delete store
--   Deleted records across all modules are snapshotted here as
--   JSON (the origin row is still hard-deleted, so existing
--   SELECT/list queries are untouched). Uploaded files stay on
--   disk while in the bin and are removed only on permanent
--   delete (purge). Auto-purge after a configurable retention.
-- ============================================================

CREATE TABLE IF NOT EXISTS `recycle_bin` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `module_key`      VARCHAR(120) NOT NULL COMMENT 'permission module e.g. app.procurement',
  `module_label`    VARCHAR(120) DEFAULT NULL COMMENT 'friendly group label e.g. Procurement',
  `source_table`    VARCHAR(120) NOT NULL,
  `record_id`       INT UNSIGNED NOT NULL,
  `label`           VARCHAR(255) DEFAULT NULL COMMENT 'human-readable item label',
  `payload`         MEDIUMTEXT   NOT NULL COMMENT 'JSON { main, children[], files[] }',
  `file_count`      INT          NOT NULL DEFAULT 0,
  `deleted_by`      INT UNSIGNED DEFAULT NULL,
  `deleted_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rb_module` (`module_key`),
  KEY `idx_rb_deleted` (`deleted_at`),
  KEY `idx_rb_source` (`source_table`, `record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default retention (days). 0 = never auto-purge.
INSERT IGNORE INTO `config_settings` (`module`, `key`, `value`)
VALUES ('recycle_bin', 'retention_days', '30');
