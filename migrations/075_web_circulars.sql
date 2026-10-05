-- ============================================================
-- Migration 075: Web Circulars — official SCM circulars
--   PDF stored on disk (file_path), served via API.
--   Idempotent seed of the initial SCM circulars (guarded by `no`).
-- ============================================================

CREATE TABLE IF NOT EXISTS `web_circulars` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `no`            VARCHAR(40)  NOT NULL COMMENT 'circular number e.g. 3/99',
  `title`         VARCHAR(300) NOT NULL,
  `year`          INT          NOT NULL,
  `circular_date` DATE         DEFAULT NULL,
  `file_path`     VARCHAR(400) DEFAULT NULL COMMENT 'PDF on disk',
  `file_name`     VARCHAR(255) DEFAULT NULL,
  `mime_type`     VARCHAR(120) DEFAULT NULL,
  `status`        VARCHAR(20)  NOT NULL DEFAULT 'Active' COMMENT 'Active | Hidden',
  `sort_order`    INT          NOT NULL DEFAULT 0,
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_circ_status` (`status`),
  KEY `idx_circ_year` (`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed initial circulars (idempotent by `no`) ──
INSERT INTO `web_circulars` (`no`, `title`, `year`, `circular_date`, `file_path`, `file_name`, `mime_type`, `status`, `sort_order`)
SELECT * FROM (SELECT '3/99' AS `no`, 'Fitting of GMDSS Equipment on Board Ships' AS title, 1999 AS year, '1999-10-12' AS circular_date,
  'circulars/Circular-3-1999-Fitting-of-GMDSS-Equipment-On-Board-Ships.pdf' AS file_path,
  'Circular-3-1999-Fitting-of-GMDSS-Equipment-On-Board-Ships.pdf' AS file_name, 'application/pdf' AS mime_type, 'Active' AS status, 0 AS sort_order) AS t
WHERE NOT EXISTS (SELECT 1 FROM `web_circulars` WHERE `no` = '3/99');

INSERT INTO `web_circulars` (`no`, `title`, `year`, `circular_date`, `status`)
SELECT * FROM (SELECT '2/99', 'Disposal of Garbage from Ships', 1999, '1999-07-08', 'Active') AS t
WHERE NOT EXISTS (SELECT 1 FROM `web_circulars` WHERE `no` = '2/99');

INSERT INTO `web_circulars` (`no`, `title`, `year`, `circular_date`, `status`)
SELECT * FROM (SELECT '1/99', 'SCM Representation During Radio Surveys', 1999, '1999-03-15', 'Active') AS t
WHERE NOT EXISTS (SELECT 1 FROM `web_circulars` WHERE `no` = '1/99');

INSERT INTO `web_circulars` (`no`, `title`, `year`, `circular_date`, `status`)
SELECT * FROM (SELECT '1/22', 'Ballast Water Management Compliance', 2022, '2022-01-20', 'Active') AS t
WHERE NOT EXISTS (SELECT 1 FROM `web_circulars` WHERE `no` = '1/22');

INSERT INTO `web_circulars` (`no`, `title`, `year`, `circular_date`, `status`)
SELECT * FROM (SELECT '2/22', 'EEXI and CII Implementation Guidance', 2022, '2022-09-05', 'Active') AS t
WHERE NOT EXISTS (SELECT 1 FROM `web_circulars` WHERE `no` = '2/22');

INSERT INTO `web_circulars` (`no`, `title`, `year`, `circular_date`, `status`)
SELECT * FROM (SELECT '1/23', 'Updated Survey Fee Schedule', 2023, '2023-02-10', 'Active') AS t
WHERE NOT EXISTS (SELECT 1 FROM `web_circulars` WHERE `no` = '1/23');
