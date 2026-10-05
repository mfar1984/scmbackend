-- ============================================================
-- Migration 025: Supplier Registrations + Partner Applications
-- ============================================================

-- ── Supplier Registrations (Procurement) ──
CREATE TABLE IF NOT EXISTS `supplier_registrations` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reference_no`    VARCHAR(30)  NOT NULL,
  `status`          VARCHAR(30)  NOT NULL DEFAULT 'Pending'
                    COMMENT 'Pending | On Progress | Approved | Active | Rejected',

  -- Step 1 — Company
  `company_name`    VARCHAR(180) NOT NULL,
  `ssm`             VARCHAR(60)  DEFAULT NULL,
  `company_type`    VARCHAR(80)  DEFAULT NULL,
  `incorporation`   DATE         DEFAULT NULL,
  `address`         VARCHAR(255) DEFAULT NULL,
  `city`            VARCHAR(80)  DEFAULT NULL,
  `state`           VARCHAR(80)  DEFAULT NULL,
  `postcode`        VARCHAR(20)  DEFAULT NULL,
  `office_phone`    VARCHAR(40)  DEFAULT NULL,
  `mobile`          VARCHAR(40)  DEFAULT NULL,
  `email`           VARCHAR(150) DEFAULT NULL,
  `website`         VARCHAR(180) DEFAULT NULL,

  -- Step 2 — Registration & Compliance
  `mof`             VARCHAR(80)  DEFAULT NULL,
  `cidb`            VARCHAR(80)  DEFAULT NULL,
  `cidb_grade`      VARCHAR(30)  DEFAULT NULL,
  `bumiputera`      VARCHAR(60)  DEFAULT NULL,
  `paid_capital`    VARCHAR(60)  DEFAULT NULL,
  `num_employees`   VARCHAR(20)  DEFAULT NULL,
  `turnover`        VARCHAR(80)  DEFAULT NULL,
  `years_in_biz`    VARCHAR(20)  DEFAULT NULL,
  `bank_name`       VARCHAR(100) DEFAULT NULL,
  `bank_acc`        VARCHAR(60)  DEFAULT NULL,
  `bank_acc_name`   VARCHAR(150) DEFAULT NULL,

  -- Step 3 — Services & Profile
  `services`        TEXT         DEFAULT NULL COMMENT 'comma separated categories',
  `nature_of_biz`   TEXT         DEFAULT NULL,
  `prod_desc`       TEXT         DEFAULT NULL,
  `director_name`   VARCHAR(150) DEFAULT NULL,
  `director_ic`     VARCHAR(50)  DEFAULT NULL,
  `director_position` VARCHAR(100) DEFAULT NULL,
  `director_contact`  VARCHAR(40)  DEFAULT NULL,

  -- Meta
  `submitted_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_supplier_ref` (`reference_no`),
  KEY `idx_supplier_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Partner Applications (Strategic Partners) ──
CREATE TABLE IF NOT EXISTS `partner_applications` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reference_no`    VARCHAR(30)  NOT NULL,
  `status`          VARCHAR(30)  NOT NULL DEFAULT 'Pending'
                    COMMENT 'Pending | On Progress | Approved | Active | Rejected',

  -- Step 1 — Company + Contact
  `company`         VARCHAR(180) NOT NULL,
  `ssm`             VARCHAR(60)  DEFAULT NULL,
  `website`         VARCHAR(180) DEFAULT NULL,
  `industry`        VARCHAR(100) DEFAULT NULL,
  `country`         VARCHAR(80)  DEFAULT NULL,
  `state`           VARCHAR(80)  DEFAULT NULL,
  `contact_name`    VARCHAR(150) DEFAULT NULL,
  `position`        VARCHAR(100) DEFAULT NULL,
  `email`           VARCHAR(150) DEFAULT NULL,
  `phone`           VARCHAR(40)  DEFAULT NULL,

  -- Step 2 — Partnership
  `partner_type`    TEXT         DEFAULT NULL COMMENT 'comma separated',
  `partner_tier`    VARCHAR(60)  DEFAULT NULL,
  `tech_stack`      TEXT         DEFAULT NULL COMMENT 'comma separated',
  `years_op`        VARCHAR(20)  DEFAULT NULL,
  `prev_partner`    TEXT         DEFAULT NULL,

  -- Step 3 — Proposal
  `value_proposition` TEXT       DEFAULT NULL,
  `target_market`     TEXT       DEFAULT NULL,
  `expected_revenue`  VARCHAR(80) DEFAULT NULL,

  -- Meta
  `submitted_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_partner_ref` (`reference_no`),
  KEY `idx_partner_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
