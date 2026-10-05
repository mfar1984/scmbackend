-- ============================================================
-- Migration 042: Tender Management (real, DB-backed)
--   tenders + documents + evaluation + award + archive fields
-- ============================================================

CREATE TABLE IF NOT EXISTS `ops_tenders` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ref_no`          VARCHAR(80)  NOT NULL,
  `name`            VARCHAR(255) NOT NULL,
  `agency`          VARCHAR(200) DEFAULT NULL,
  `description`     TEXT         DEFAULT NULL,
  `closing_date`    DATE         DEFAULT NULL,
  `estimated_value` DECIMAL(14,2) DEFAULT 0,
  `assigned_to`     VARCHAR(150) DEFAULT NULL,

  -- lifecycle stage: Draft | In Progress | Submitted | Evaluation | Awarded | Unsuccessful | Closed
  `stage`           VARCHAR(30)  NOT NULL DEFAULT 'Draft',

  -- submission
  `submitted_date`  DATE         DEFAULT NULL,

  -- evaluation
  `eval_type`       VARCHAR(20)  DEFAULT NULL COMMENT 'Technical | Financial | Both',
  `eval_officer`    VARCHAR(150) DEFAULT NULL,
  `eval_status`     VARCHAR(20)  DEFAULT NULL COMMENT 'Pending | In Progress | Completed',
  `technical_score` DECIMAL(5,2) DEFAULT NULL,
  `financial_score` DECIMAL(5,2) DEFAULT NULL,
  `eval_remarks`    TEXT         DEFAULT NULL,

  -- award
  `contract_no`     VARCHAR(80)  DEFAULT NULL,
  `actual_value`    DECIMAL(14,2) DEFAULT NULL,
  `award_date`      DATE         DEFAULT NULL,
  `project_start`   DATE         DEFAULT NULL,
  `project_end`     DATE         DEFAULT NULL,
  `award_status`    VARCHAR(20)  DEFAULT NULL COMMENT 'Active | Completed',

  -- archive (unsuccessful/cancelled/expired)
  `outcome`         VARCHAR(20)  DEFAULT NULL COMMENT 'Unsuccessful | Cancelled | Expired',
  `outcome_reason`  VARCHAR(500) DEFAULT NULL,
  `reference_price` DECIMAL(14,2) DEFAULT NULL,

  -- compiled submission PDF (base64 data URL) — the scanned/compiled bundle
  `compiled_doc`      MEDIUMTEXT DEFAULT NULL,
  `compiled_doc_name` VARCHAR(255) DEFAULT NULL,

  `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tender_ref` (`ref_no`),
  KEY `idx_tender_stage` (`stage`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tender supporting documents (multiple files per tender) ──
CREATE TABLE IF NOT EXISTS `ops_tender_documents` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tender_id`  INT UNSIGNED NOT NULL,
  `doc_type`   VARCHAR(60)  DEFAULT 'General' COMMENT 'Tender Notice | Technical Proposal | Financial Proposal | Company Profile | Certificate | General',
  `file_name`  VARCHAR(255) DEFAULT NULL,
  `mime_type`  VARCHAR(100) DEFAULT NULL,
  `file_data`  MEDIUMTEXT   DEFAULT NULL COMMENT 'base64 data URL',
  `uploaded_at` TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_td_tender` (`tender_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
