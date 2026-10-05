-- ============================================================
-- Migration 040: Approval action records + approval tracking
-- Records WHO approved/rejected each application and WHEN.
-- ============================================================

CREATE TABLE IF NOT EXISTS `hr_approval_records` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `module`        VARCHAR(50)  NOT NULL COMMENT 'leave | claim | overtime | expenses',
  `application_id` INT UNSIGNED NOT NULL,
  `level`         INT          NOT NULL DEFAULT 1,
  `action`        VARCHAR(20)  NOT NULL COMMENT 'Approved | Rejected',
  `actor_user_id` INT UNSIGNED DEFAULT NULL,
  `actor_name`    VARCHAR(150) DEFAULT NULL,
  `remarks`       VARCHAR(500) DEFAULT NULL,
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ar_app` (`module`, `application_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Track current approval progress on each application ──
-- leave
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_leave_applications' AND COLUMN_NAME='current_level');
SET @s := IF(@c=0,'ALTER TABLE `hr_leave_applications` ADD COLUMN `current_level` INT NOT NULL DEFAULT 0 AFTER `status`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- claim
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_claim_applications' AND COLUMN_NAME='current_level');
SET @s := IF(@c=0,'ALTER TABLE `hr_claim_applications` ADD COLUMN `current_level` INT NOT NULL DEFAULT 0 AFTER `status`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- overtime
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_overtime_applications' AND COLUMN_NAME='current_level');
SET @s := IF(@c=0,'ALTER TABLE `hr_overtime_applications` ADD COLUMN `current_level` INT NOT NULL DEFAULT 0 AFTER `status`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- expenses
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hr_expense_applications' AND COLUMN_NAME='current_level');
SET @s := IF(@c=0,'ALTER TABLE `hr_expense_applications` ADD COLUMN `current_level` INT NOT NULL DEFAULT 0 AFTER `status`','SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
