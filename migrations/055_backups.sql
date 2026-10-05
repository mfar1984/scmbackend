-- Backup history + extra storage settings for Cloudflare R2 / FTP
CREATE TABLE IF NOT EXISTS `backups` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `file_name`   VARCHAR(255) NOT NULL,
  `file_path`   VARCHAR(512) DEFAULT NULL COMMENT 'relative path under uploads/ for local, or remote key',
  `storage`     VARCHAR(20)  NOT NULL DEFAULT 'local' COMMENT 'local | r2 | ftp',
  `size_bytes`  BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `type`        VARCHAR(10)  NOT NULL DEFAULT 'Manual' COMMENT 'Auto | Manual',
  `status`      VARCHAR(15)  NOT NULL DEFAULT 'Complete' COMMENT 'Complete | Failed | Running',
  `note`        VARCHAR(255) DEFAULT NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_backups_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed additional backup storage settings (idempotent)
INSERT INTO `config_settings` (`module`, `key`, `value`)
SELECT * FROM (SELECT 'backup' AS m, 'r2_account_id' AS k, '' AS v) AS t
WHERE NOT EXISTS (SELECT 1 FROM `config_settings` WHERE `module`='backup' AND `key`='r2_account_id');

INSERT INTO `config_settings` (`module`, `key`, `value`)
SELECT * FROM (SELECT 'backup', 'r2_bucket', '') AS t
WHERE NOT EXISTS (SELECT 1 FROM `config_settings` WHERE `module`='backup' AND `key`='r2_bucket');

INSERT INTO `config_settings` (`module`, `key`, `value`)
SELECT * FROM (SELECT 'backup', 'r2_access_key', '') AS t
WHERE NOT EXISTS (SELECT 1 FROM `config_settings` WHERE `module`='backup' AND `key`='r2_access_key');

INSERT INTO `config_settings` (`module`, `key`, `value`)
SELECT * FROM (SELECT 'backup', 'r2_secret', '') AS t
WHERE NOT EXISTS (SELECT 1 FROM `config_settings` WHERE `module`='backup' AND `key`='r2_secret');

INSERT INTO `config_settings` (`module`, `key`, `value`)
SELECT * FROM (SELECT 'backup', 'ftp_host', '') AS t
WHERE NOT EXISTS (SELECT 1 FROM `config_settings` WHERE `module`='backup' AND `key`='ftp_host');

INSERT INTO `config_settings` (`module`, `key`, `value`)
SELECT * FROM (SELECT 'backup', 'ftp_port', '21') AS t
WHERE NOT EXISTS (SELECT 1 FROM `config_settings` WHERE `module`='backup' AND `key`='ftp_port');

INSERT INTO `config_settings` (`module`, `key`, `value`)
SELECT * FROM (SELECT 'backup', 'ftp_user', '') AS t
WHERE NOT EXISTS (SELECT 1 FROM `config_settings` WHERE `module`='backup' AND `key`='ftp_user');

INSERT INTO `config_settings` (`module`, `key`, `value`)
SELECT * FROM (SELECT 'backup', 'ftp_pass', '') AS t
WHERE NOT EXISTS (SELECT 1 FROM `config_settings` WHERE `module`='backup' AND `key`='ftp_pass');

INSERT INTO `config_settings` (`module`, `key`, `value`)
SELECT * FROM (SELECT 'backup', 'ftp_secure', '0') AS t
WHERE NOT EXISTS (SELECT 1 FROM `config_settings` WHERE `module`='backup' AND `key`='ftp_secure');

INSERT INTO `config_settings` (`module`, `key`, `value`)
SELECT * FROM (SELECT 'backup', 'ftp_dir', '/backups') AS t
WHERE NOT EXISTS (SELECT 1 FROM `config_settings` WHERE `module`='backup' AND `key`='ftp_dir');

INSERT INTO `config_settings` (`module`, `key`, `value`)
SELECT * FROM (SELECT 'backup' AS m, 'ftp_protocol' AS k, 'ftp' AS v) AS t
WHERE NOT EXISTS (SELECT 1 FROM `config_settings` WHERE `module`='backup' AND `key`='ftp_protocol');
