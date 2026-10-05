-- ============================================================
-- Migration 021: Email Profiles + Interview scheduling fields
-- ============================================================

-- ── Email Profiles ──
CREATE TABLE IF NOT EXISTS `email_profiles` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `profile_key`     VARCHAR(50)  NOT NULL COMMENT 'slug e.g. hr | support',
  `name`            VARCHAR(100) NOT NULL,
  `from_name`       VARCHAR(120) DEFAULT NULL,
  `from_email`      VARCHAR(150) DEFAULT NULL,
  `reply_to`        VARCHAR(150) DEFAULT NULL,
  `smtp_host`       VARCHAR(150) DEFAULT NULL,
  `smtp_port`       VARCHAR(10)  DEFAULT '587',
  `smtp_encryption` VARCHAR(10)  DEFAULT 'TLS',
  `smtp_user`       VARCHAR(150) DEFAULT NULL,
  `smtp_pass`       VARCHAR(255) DEFAULT NULL,
  `status`          ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_profile_key` (`profile_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed default profiles ──
INSERT IGNORE INTO `email_profiles`
  (`profile_key`, `name`, `from_name`, `from_email`, `reply_to`, `smtp_host`, `smtp_port`, `smtp_encryption`, `smtp_user`, `smtp_pass`)
VALUES
('hr', 'HR Department Email', 'ATLINE HR Department', 'hr@atline.com.my', 'hr@atline.com.my',
  'mail.atline.com.my', '587', 'TLS', 'hr@atline.com.my', ''),
('support', 'Support Email', 'ATLINE Support', 'support@atline.com.my', 'support@atline.com.my',
  'mail.atline.com.my', '587', 'TLS', 'support@atline.com.my', '');

-- ── Interview scheduling columns on hr_applicants ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_applicants' AND COLUMN_NAME='interview_date');
SET @s := IF(@c=0, 'ALTER TABLE `hr_applicants` ADD COLUMN `interview_date` DATE DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_applicants' AND COLUMN_NAME='interview_time');
SET @s := IF(@c=0, 'ALTER TABLE `hr_applicants` ADD COLUMN `interview_time` VARCHAR(20) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_applicants' AND COLUMN_NAME='interview_location');
SET @s := IF(@c=0, 'ALTER TABLE `hr_applicants` ADD COLUMN `interview_location` VARCHAR(255) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_applicants' AND COLUMN_NAME='interview_notes');
SET @s := IF(@c=0, 'ALTER TABLE `hr_applicants` ADD COLUMN `interview_notes` TEXT DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_applicants' AND COLUMN_NAME='interview_substatus');
SET @s := IF(@c=0, "ALTER TABLE `hr_applicants` ADD COLUMN `interview_substatus` VARCHAR(20) DEFAULT NULL COMMENT 'Pending | Confirmed'", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_applicants' AND COLUMN_NAME='interview_token');
SET @s := IF(@c=0, 'ALTER TABLE `hr_applicants` ADD COLUMN `interview_token` VARCHAR(64) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_applicants' AND COLUMN_NAME='interview_confirmed_at');
SET @s := IF(@c=0, 'ALTER TABLE `hr_applicants` ADD COLUMN `interview_confirmed_at` TIMESTAMP NULL DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_applicants' AND COLUMN_NAME='interview_email_profile');
SET @s := IF(@c=0, 'ALTER TABLE `hr_applicants` ADD COLUMN `interview_email_profile` VARCHAR(50) DEFAULT NULL', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
