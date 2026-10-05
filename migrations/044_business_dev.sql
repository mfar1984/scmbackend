-- ============================================================
-- Migration 044: Business Development (real, DB-backed)
--   clients  +  leads  +  proposals  +  proposal documents
--   Proposals can be emailed to clients (logged via sent_at/email)
-- ============================================================

-- ── Client database ──
CREATE TABLE IF NOT EXISTS `ops_clients` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company`         VARCHAR(200) NOT NULL,
  `industry`        VARCHAR(80)  DEFAULT NULL,
  `sector`          VARCHAR(40)  DEFAULT NULL COMMENT 'Government | Education | Healthcare | Private | Local Government | Other',
  `contact_person`  VARCHAR(150) DEFAULT NULL,
  `designation`     VARCHAR(120) DEFAULT NULL,
  `email`           VARCHAR(150) DEFAULT NULL,
  `phone`           VARCHAR(40)  DEFAULT NULL,
  `address`         VARCHAR(400) DEFAULT NULL,
  `website`         VARCHAR(150) DEFAULT NULL,
  `potential_value` DECIMAL(14,2) DEFAULT NULL,
  `status`          VARCHAR(20)  NOT NULL DEFAULT 'Prospect' COMMENT 'Active | Prospect | Inactive',
  `last_contact`    DATE         DEFAULT NULL,
  `notes`           TEXT         DEFAULT NULL,
  `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_client_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Leads & prospects ──
CREATE TABLE IF NOT EXISTS `ops_leads` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`           VARCHAR(200) NOT NULL,
  `client_id`       INT UNSIGNED DEFAULT NULL,
  `company`         VARCHAR(200) DEFAULT NULL,
  `contact_person`  VARCHAR(150) DEFAULT NULL,
  `email`           VARCHAR(150) DEFAULT NULL,
  `phone`           VARCHAR(40)  DEFAULT NULL,
  `source`          VARCHAR(30)  DEFAULT 'Referral' COMMENT 'Referral | Cold Call | Website | Event | Tender | Other',
  `estimated_value` DECIMAL(14,2) DEFAULT NULL,
  `stage`           VARCHAR(20)  NOT NULL DEFAULT 'New' COMMENT 'New | Contacted | Qualified | Proposal | Negotiation | Won | Lost',
  `assigned_to`     VARCHAR(150) DEFAULT NULL,
  `next_follow_up`  DATE         DEFAULT NULL,
  `description`     TEXT         DEFAULT NULL,
  `lost_reason`     VARCHAR(400) DEFAULT NULL,
  `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lead_stage` (`stage`),
  KEY `idx_lead_client` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Proposals ──
CREATE TABLE IF NOT EXISTS `ops_proposals` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ref_no`          VARCHAR(80)  DEFAULT NULL,
  `title`           VARCHAR(255) NOT NULL,
  `client_id`       INT UNSIGNED DEFAULT NULL,
  `client_name`     VARCHAR(200) DEFAULT NULL,
  `contact_person`  VARCHAR(150) DEFAULT NULL,
  `contact_email`   VARCHAR(150) DEFAULT NULL,
  `lead_id`         INT UNSIGNED DEFAULT NULL,
  `summary`         TEXT         DEFAULT NULL,
  `scope`           TEXT         DEFAULT NULL,
  `value`           DECIMAL(14,2) DEFAULT NULL,
  `issued_date`     DATE         DEFAULT NULL,
  `valid_until`     DATE         DEFAULT NULL,
  `status`          VARCHAR(20)  NOT NULL DEFAULT 'Draft' COMMENT 'Draft | Sent | Accepted | Rejected | Expired',
  `sent_at`         DATETIME     DEFAULT NULL,
  `sent_to`         VARCHAR(150) DEFAULT NULL,
  `notes`           TEXT         DEFAULT NULL,
  -- attached proposal document (base64 data URL) for email attachment
  `doc_data`        MEDIUMTEXT   DEFAULT NULL,
  `doc_name`        VARCHAR(255) DEFAULT NULL,
  `doc_mime`        VARCHAR(100) DEFAULT NULL,
  `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_proposal_status` (`status`),
  KEY `idx_proposal_client` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
