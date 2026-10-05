-- ============================================================
-- Migration 064: Extend activity_logs for rich activity + audit
--   Adds user_id (filter by account), path (page visited) and
--   portal (admin | ess) so we can trace exactly where a user
--   navigated and what they did, across both portals.
-- ============================================================

-- activity_logs.user_id
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='activity_logs' AND COLUMN_NAME='user_id');
SET @s := IF(@c=0, "ALTER TABLE `activity_logs` ADD COLUMN `user_id` INT UNSIGNED DEFAULT NULL AFTER `user`", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- activity_logs.path (page / link visited)
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='activity_logs' AND COLUMN_NAME='path');
SET @s := IF(@c=0, "ALTER TABLE `activity_logs` ADD COLUMN `path` VARCHAR(255) DEFAULT NULL AFTER `ip`", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- activity_logs.portal (admin | ess)
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='activity_logs' AND COLUMN_NAME='portal');
SET @s := IF(@c=0, "ALTER TABLE `activity_logs` ADD COLUMN `portal` VARCHAR(20) DEFAULT NULL AFTER `path`", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- index on user_id
SET @c := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='activity_logs' AND INDEX_NAME='idx_act_user_id');
SET @s := IF(@c=0, "ALTER TABLE `activity_logs` ADD INDEX `idx_act_user_id` (`user_id`)", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- audit_logs.user_id (filter the audit trail by account)
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='audit_logs' AND COLUMN_NAME='user_id');
SET @s := IF(@c=0, "ALTER TABLE `audit_logs` ADD COLUMN `user_id` INT UNSIGNED DEFAULT NULL AFTER `user`", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='audit_logs' AND INDEX_NAME='idx_aud_user_id');
SET @s := IF(@c=0, "ALTER TABLE `audit_logs` ADD INDEX `idx_aud_user_id` (`user_id`)", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
