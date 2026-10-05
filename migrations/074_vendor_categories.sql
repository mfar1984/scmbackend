-- ============================================================
-- Migration 074: Vendor service categories (managed list)
--   Canonical `name` matches ops_vendors.category strings.
--   short_label + icon + description drive the public website.
-- ============================================================

CREATE TABLE IF NOT EXISTS `web_vendor_categories` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(180) NOT NULL COMMENT 'canonical category (matches ops_vendors.category)',
  `short_label` VARCHAR(120) DEFAULT NULL COMMENT 'display label on website',
  `icon`        VARCHAR(60)  NOT NULL DEFAULT 'bi-clipboard-check',
  `description` VARCHAR(500) DEFAULT NULL,
  `sort_order`  INT          NOT NULL DEFAULT 0,
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'Active' COMMENT 'Active | Inactive',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vcat_name` (`name`),
  KEY `idx_vcat_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `web_vendor_categories` (`name`, `short_label`, `icon`, `description`, `sort_order`) VALUES
('Ultrasonic Thickness Measurement', 'Ultrasonic Thickness Measurement', 'bi-soundwave', 'Approved firms performing ultrasonic thickness measurement (UTM) of hull structures and steel plating for class and statutory surveys.', 1),
('In-Water Survey', 'In-Water Survey', 'bi-water', 'Approved diving/ROV service suppliers carrying out in-water surveys (IWS) of the underwater hull as an alternative to dry-docking.', 2),
('Radio Communication Equipment Survey', 'Radio Communication Equipment Survey', 'bi-broadcast-pin', 'Approved suppliers for the survey and testing of GMDSS and radio communication equipment on board vessels.', 3),
('Performance Tests of VDR / SVDR', 'VDR / SVDR Performance Tests', 'bi-record-circle', 'Approved service providers for the annual performance test of Voyage Data Recorders (VDR) and Simplified VDR (S-VDR), by authorised manufacturer.', 4),
('Fire Extinguishing Equipment & Self-Contained Breathing Apparatus Survey', 'Fire Extinguishing & SCBA Survey', 'bi-fire', 'Approved suppliers servicing fire-extinguishing equipment and Self-Contained Breathing Apparatus (SCBA).', 5),
('Inflatable (Liferafts, Lifejackets, Rescue Boats), HRUs & Marine Evacuation System Service', 'Inflatable Life-Saving Appliances', 'bi-life-preserver', 'Approved stations servicing inflatable liferafts, lifejackets, rescue boats, HRUs and marine evacuation systems.', 6),
('Lifeboat, Launching Appliances, On-Load Release Gears & Davit-Launched Liferaft Release Hooks Service', 'Lifeboat & Launching Appliances', 'bi-lifebuoy', 'Approved suppliers for lifeboats, launching appliances, on-load release gears and davit-launched liferaft release hooks.', 7),
('BWMS Commissioning Testing', 'BWMS Commissioning Testing', 'bi-droplet-half', 'Approved laboratories/suppliers for Ballast Water Management System (BWMS) commissioning testing.', 8);
