-- ============================================================
-- Migration 045: Procurement — Vendor directory (DB-backed)
--   Vendors linked to approved supplier registrations.
--   (Purchase Order / Goods Received were intentionally dropped —
--    procurement here is a vendor contact directory, not accounting.)
-- ============================================================

CREATE TABLE IF NOT EXISTS `ops_vendors` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `source`          VARCHAR(20)  NOT NULL DEFAULT 'Manual' COMMENT 'Manual | Registration',
  `supplier_id`     INT UNSIGNED DEFAULT NULL COMMENT 'links supplier_registrations.id',
  `name`            VARCHAR(200) NOT NULL,
  `category`        VARCHAR(120) DEFAULT NULL,
  `contact_person`  VARCHAR(150) DEFAULT NULL,
  `phone`           VARCHAR(40)  DEFAULT NULL,
  `email`           VARCHAR(150) DEFAULT NULL,
  `address`         VARCHAR(400) DEFAULT NULL,
  `status`          VARCHAR(20)  NOT NULL DEFAULT 'Active' COMMENT 'Active | Inactive',
  `notes`           TEXT         DEFAULT NULL,
  `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vendor_status` (`status`),
  KEY `idx_vendor_supplier` (`supplier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
