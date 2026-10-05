-- ============================================================
-- Migration 060: Web Gallery — photo albums with real images
--   web_gallery_albums  : an album / collection card
--   web_gallery_photos  : the uploaded photos inside an album
--   Images are stored on disk (file_path) and served via API.
-- ============================================================

CREATE TABLE IF NOT EXISTS `web_gallery_albums` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`       VARCHAR(200) NOT NULL,
  `subtitle`    VARCHAR(200) DEFAULT NULL COMMENT 'location / client line',
  `category`    VARCHAR(80)  NOT NULL DEFAULT 'Projects' COMMENT 'Projects | Team | Events | Office',
  `year`        VARCHAR(12)  DEFAULT NULL,
  `description` TEXT         DEFAULT NULL,
  `cover_path`  VARCHAR(400) DEFAULT NULL COMMENT 'cover image on disk',
  `cover_name`  VARCHAR(255) DEFAULT NULL,
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'Active' COMMENT 'Active | Hidden',
  `sort_order`  INT          NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_galb_status` (`status`),
  KEY `idx_galb_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `web_gallery_photos` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `album_id`   INT UNSIGNED NOT NULL,
  `caption`    VARCHAR(200) DEFAULT NULL,
  `detail`     VARCHAR(400) DEFAULT NULL,
  `file_path`  VARCHAR(400) NOT NULL,
  `file_name`  VARCHAR(255) DEFAULT NULL,
  `mime_type`  VARCHAR(120) DEFAULT NULL,
  `sort_order` INT          NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_gphoto_album` (`album_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
