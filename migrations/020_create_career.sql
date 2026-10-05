-- ============================================================
-- Migration 020: Career Postings + Applicants
-- ============================================================

-- ── Career Postings ──
CREATE TABLE IF NOT EXISTS `hr_career_postings` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`           VARCHAR(150) NOT NULL,
  `department`      VARCHAR(120) DEFAULT NULL,
  `location`        VARCHAR(150) DEFAULT NULL,
  `job_type`        VARCHAR(50)  DEFAULT 'Full Time' COMMENT 'Full Time | Part Time | Contract | Internship',
  `employment_type` VARCHAR(50)  DEFAULT 'Permanent',
  `min_salary`      DECIMAL(12,2) DEFAULT NULL,
  `max_salary`      DECIMAL(12,2) DEFAULT NULL,
  `salary_notes`    VARCHAR(150) DEFAULT NULL,
  `min_experience`  INT          DEFAULT NULL,
  `max_experience`  INT          DEFAULT NULL,
  `experience_level` VARCHAR(80) DEFAULT NULL,
  `icon_theme`      VARCHAR(40)  DEFAULT 'general' COMMENT 'it | sales | hr | engineering | technical | general',
  `overview`        TEXT         DEFAULT NULL,
  `responsibilities` TEXT        DEFAULT NULL COMMENT 'one item per line',
  `requirements`    TEXT         DEFAULT NULL COMMENT 'one item per line',
  `benefits`        TEXT         DEFAULT NULL COMMENT 'one item per line',
  `skills`          TEXT         DEFAULT NULL COMMENT 'comma separated tags',
  `is_featured`     TINYINT(1)   NOT NULL DEFAULT 0,
  `status`          VARCHAR(20)  NOT NULL DEFAULT 'Draft' COMMENT 'Draft | Published | Closed',
  `posted_date`     DATE         DEFAULT NULL,
  `closing_date`    DATE         DEFAULT NULL,
  `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Applicants ──
CREATE TABLE IF NOT EXISTS `hr_applicants` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `application_no`   VARCHAR(30)  NOT NULL,
  `posting_id`       INT UNSIGNED DEFAULT NULL,
  `position_applied` VARCHAR(150) DEFAULT NULL,
  `department`       VARCHAR(120) DEFAULT NULL,
  `status`           VARCHAR(40)  NOT NULL DEFAULT 'Pending'
                     COMMENT 'Pending | Shortlisted | Interview Scheduled | Offered | Rejected | Hired',

  -- ── Personal ──
  `full_name`        VARCHAR(150) NOT NULL,
  `ic_number`        VARCHAR(50)  DEFAULT NULL,
  `email`            VARCHAR(150) DEFAULT NULL,
  `phone`            VARCHAR(40)  DEFAULT NULL,
  `alt_phone`        VARCHAR(40)  DEFAULT NULL,
  `date_of_birth`    DATE         DEFAULT NULL,
  `gender`           VARCHAR(30)  DEFAULT NULL,
  `nationality`      VARCHAR(50)  DEFAULT NULL,
  `religion`         VARCHAR(50)  DEFAULT NULL,
  `marital_status`   VARCHAR(30)  DEFAULT NULL,

  -- ── Address (IC) ──
  `ic_address`       VARCHAR(255) DEFAULT NULL,
  `ic_postcode`      VARCHAR(20)  DEFAULT NULL,
  `ic_city`          VARCHAR(80)  DEFAULT NULL,
  `ic_state`         VARCHAR(80)  DEFAULT NULL,
  `ic_country`       VARCHAR(80)  DEFAULT NULL,
  -- ── Address (Current) ──
  `cur_address`      VARCHAR(255) DEFAULT NULL,
  `cur_postcode`     VARCHAR(20)  DEFAULT NULL,
  `cur_city`         VARCHAR(80)  DEFAULT NULL,
  `cur_state`        VARCHAR(80)  DEFAULT NULL,
  `cur_country`      VARCHAR(80)  DEFAULT NULL,

  -- ── Emergency ──
  `emg_name`         VARCHAR(150) DEFAULT NULL,
  `emg_relationship` VARCHAR(80)  DEFAULT NULL,
  `emg_phone`        VARCHAR(40)  DEFAULT NULL,
  `emg_email`        VARCHAR(150) DEFAULT NULL,
  `emg_address`      VARCHAR(255) DEFAULT NULL,

  -- ── Education & Experience ──
  `education`        VARCHAR(80)  DEFAULT NULL,
  `field_of_study`   VARCHAR(120) DEFAULT NULL,
  `years_experience` VARCHAR(20)  DEFAULT NULL,
  `last_position`    VARCHAR(120) DEFAULT NULL,
  `last_employer`    VARCHAR(150) DEFAULT NULL,
  `expected_salary`  DECIMAL(12,2) DEFAULT NULL,
  `notice_period`    VARCHAR(40)  DEFAULT NULL,
  `available_start`  DATE         DEFAULT NULL,
  `hear_about`       VARCHAR(80)  DEFAULT NULL,
  `cover_message`    TEXT         DEFAULT NULL,

  -- ── Documents (file paths / names) ──
  `doc_passport`     VARCHAR(255) DEFAULT NULL,
  `doc_resume`       VARCHAR(255) DEFAULT NULL,
  `doc_cover_letter` VARCHAR(255) DEFAULT NULL,

  -- ── Meta ──
  `converted_employee_id` INT UNSIGNED DEFAULT NULL COMMENT 'set when Hired -> employee created',
  `submitted_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_application_no` (`application_no`),
  KEY `idx_posting` (`posting_id`),
  KEY `idx_app_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
