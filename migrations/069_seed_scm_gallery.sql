-- ============================================================
-- Migration 069: Seed SCM gallery albums (maritime)
--   Idempotent — only inserts albums/photos that don't exist yet.
--   Image files are copied to uploads/gallery/ (stable names).
-- ============================================================

-- ── Album 1: Vessel Classification Surveys ──────────────────
INSERT INTO `web_gallery_albums` (`title`, `subtitle`, `category`, `year`, `description`, `cover_path`, `cover_name`, `status`, `sort_order`)
SELECT * FROM (SELECT
  'Vessel Classification Surveys' AS title,
  'Port Klang, Selangor'         AS subtitle,
  'Surveys'                      AS category,
  '2026'                         AS year,
  'A look at our surveyors conducting classification and statutory surveys aboard Malaysian-registered vessels.' AS description,
  'gallery/scm-survey-hull.jpg'  AS cover_path,
  'scm-survey-hull.jpg'          AS cover_name,
  'Active'                       AS status,
  1                              AS sort_order
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `web_gallery_albums` WHERE `title` = 'Vessel Classification Surveys');

-- ── Album 2: Maritime Events & Ceremonies ───────────────────
INSERT INTO `web_gallery_albums` (`title`, `subtitle`, `category`, `year`, `description`, `cover_path`, `cover_name`, `status`, `sort_order`)
SELECT * FROM (SELECT
  'Maritime Events & Ceremonies' AS title,
  'Kuala Lumpur'                 AS subtitle,
  'Events'                       AS category,
  '2026'                         AS year,
  'Highlights from industry conferences, partner engagements and company milestones.' AS description,
  'gallery/scm-event-conf.jpg'   AS cover_path,
  'scm-event-conf.jpg'           AS cover_name,
  'Active'                       AS status,
  2                              AS sort_order
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `web_gallery_albums` WHERE `title` = 'Maritime Events & Ceremonies');

-- ── Album 3: Our Team at Work ───────────────────────────────
INSERT INTO `web_gallery_albums` (`title`, `subtitle`, `category`, `year`, `description`, `cover_path`, `cover_name`, `status`, `sort_order`)
SELECT * FROM (SELECT
  'Our Team at Work'              AS title,
  'Shah Alam HQ'                  AS subtitle,
  'Team'                          AS category,
  '2026'                          AS year,
  'The people behind SCM — collaboration, expertise and dedication in action.' AS description,
  'gallery/scm-team-briefing.jpg' AS cover_path,
  'scm-team-briefing.jpg'         AS cover_name,
  'Active'                        AS status,
  3                               AS sort_order
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `web_gallery_albums` WHERE `title` = 'Our Team at Work');

-- ── Photos for Album 1 ──────────────────────────────────────
INSERT INTO `web_gallery_photos` (`album_id`, `caption`, `detail`, `file_path`, `file_name`, `mime_type`, `sort_order`)
SELECT a.id, 'Hull inspection', 'Verifying structural compliance with SCM Rules.', 'gallery/scm-survey-hull.jpg', 'scm-survey-hull.jpg', 'image/jpeg', 1
FROM `web_gallery_albums` a
WHERE a.title = 'Vessel Classification Surveys'
  AND NOT EXISTS (SELECT 1 FROM `web_gallery_photos` p WHERE p.album_id = a.id AND p.file_path = 'gallery/scm-survey-hull.jpg');

INSERT INTO `web_gallery_photos` (`album_id`, `caption`, `detail`, `file_path`, `file_name`, `mime_type`, `sort_order`)
SELECT a.id, 'On-site survey', 'Field assessment of onboard systems.', 'gallery/scm-survey-onsite.jpg', 'scm-survey-onsite.jpg', 'image/jpeg', 2
FROM `web_gallery_albums` a
WHERE a.title = 'Vessel Classification Surveys'
  AND NOT EXISTS (SELECT 1 FROM `web_gallery_photos` p WHERE p.album_id = a.id AND p.file_path = 'gallery/scm-survey-onsite.jpg');

INSERT INTO `web_gallery_photos` (`album_id`, `caption`, `detail`, `file_path`, `file_name`, `mime_type`, `sort_order`)
SELECT a.id, 'Documentation review', 'Checking certificates and records.', 'gallery/scm-survey-docs.jpg', 'scm-survey-docs.jpg', 'image/jpeg', 3
FROM `web_gallery_albums` a
WHERE a.title = 'Vessel Classification Surveys'
  AND NOT EXISTS (SELECT 1 FROM `web_gallery_photos` p WHERE p.album_id = a.id AND p.file_path = 'gallery/scm-survey-docs.jpg');

-- ── Photos for Album 2 ──────────────────────────────────────
INSERT INTO `web_gallery_photos` (`album_id`, `caption`, `detail`, `file_path`, `file_name`, `mime_type`, `sort_order`)
SELECT a.id, 'Industry conference', NULL, 'gallery/scm-event-conf.jpg', 'scm-event-conf.jpg', 'image/jpeg', 1
FROM `web_gallery_albums` a
WHERE a.title = 'Maritime Events & Ceremonies'
  AND NOT EXISTS (SELECT 1 FROM `web_gallery_photos` p WHERE p.album_id = a.id AND p.file_path = 'gallery/scm-event-conf.jpg');

INSERT INTO `web_gallery_photos` (`album_id`, `caption`, `detail`, `file_path`, `file_name`, `mime_type`, `sort_order`)
SELECT a.id, 'Partner engagement', NULL, 'gallery/scm-event-partner.jpg', 'scm-event-partner.jpg', 'image/jpeg', 2
FROM `web_gallery_albums` a
WHERE a.title = 'Maritime Events & Ceremonies'
  AND NOT EXISTS (SELECT 1 FROM `web_gallery_photos` p WHERE p.album_id = a.id AND p.file_path = 'gallery/scm-event-partner.jpg');

-- ── Photos for Album 3 ──────────────────────────────────────
INSERT INTO `web_gallery_photos` (`album_id`, `caption`, `detail`, `file_path`, `file_name`, `mime_type`, `sort_order`)
SELECT a.id, 'Team briefing', NULL, 'gallery/scm-team-briefing.jpg', 'scm-team-briefing.jpg', 'image/jpeg', 1
FROM `web_gallery_albums` a
WHERE a.title = 'Our Team at Work'
  AND NOT EXISTS (SELECT 1 FROM `web_gallery_photos` p WHERE p.album_id = a.id AND p.file_path = 'gallery/scm-team-briefing.jpg');

INSERT INTO `web_gallery_photos` (`album_id`, `caption`, `detail`, `file_path`, `file_name`, `mime_type`, `sort_order`)
SELECT a.id, 'Field operations', NULL, 'gallery/scm-team-field.jpg', 'scm-team-field.jpg', 'image/jpeg', 2
FROM `web_gallery_albums` a
WHERE a.title = 'Our Team at Work'
  AND NOT EXISTS (SELECT 1 FROM `web_gallery_photos` p WHERE p.album_id = a.id AND p.file_path = 'gallery/scm-team-field.jpg');
