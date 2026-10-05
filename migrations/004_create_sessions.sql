-- ============================================================
-- Migration 004: User Sessions
-- ============================================================

CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED  NOT NULL,
  `token_hash`  VARCHAR(64)   NOT NULL COMMENT 'SHA-256 hash of JWT token',
  `ip_address`  VARCHAR(45)   DEFAULT NULL,
  `user_agent`  VARCHAR(255)  DEFAULT NULL,
  `expires_at`  DATETIME      NOT NULL,
  `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token_hash` (`token_hash`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
