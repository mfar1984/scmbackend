-- ============================================================
-- Migration 070: Clean ATLINE junk + seed SCM Forms & Documents
--   Idempotent. PDF files live in uploads/downloads/ (committed).
-- ============================================================

-- ── Remove leftover ATLINE/junk downloads (e.g. software test data) ──
DELETE FROM `web_downloads`
WHERE `title` LIKE '%Internet Download Manager%'
   OR `category` = 'Software';

-- ── Doc 1: SCM Company Profile ──────────────────────────────
INSERT INTO `web_downloads` (`category`, `title`, `description`, `file_path`, `file_name`, `mime_type`, `file_size`, `icon`, `require_email`, `status`, `sort_order`)
SELECT * FROM (SELECT
  'Company Documents' AS category,
  'SCM Company Profile' AS title,
  'Overview of Ships Classification Malaysia — our history, services and accreditations.' AS description,
  'downloads/scm-company-profile.pdf' AS file_path,
  'scm-company-profile.pdf' AS file_name,
  'application/pdf' AS mime_type,
  '1 KB' AS file_size,
  'bi-file-earmark-pdf-fill' AS icon,
  0 AS require_email,
  'Active' AS status,
  1 AS sort_order
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `web_downloads` WHERE `title` = 'SCM Company Profile');

-- ── Doc 2: Survey Request Form ──────────────────────────────
INSERT INTO `web_downloads` (`category`, `title`, `description`, `file_path`, `file_name`, `mime_type`, `file_size`, `icon`, `require_email`, `status`, `sort_order`)
SELECT * FROM (SELECT
  'Forms' AS category,
  'Survey Request Form' AS title,
  'Application form to request a classification or statutory survey for your vessel.' AS description,
  'downloads/scm-survey-request-form.pdf' AS file_path,
  'scm-survey-request-form.pdf' AS file_name,
  'application/pdf' AS mime_type,
  '1 KB' AS file_size,
  'bi-file-earmark-text-fill' AS icon,
  0 AS require_email,
  'Active' AS status,
  2 AS sort_order
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `web_downloads` WHERE `title` = 'Survey Request Form');

-- ── Doc 3: Vendor Registration Form (email-gated) ───────────
INSERT INTO `web_downloads` (`category`, `title`, `description`, `file_path`, `file_name`, `mime_type`, `file_size`, `icon`, `require_email`, `status`, `sort_order`)
SELECT * FROM (SELECT
  'Forms' AS category,
  'Vendor Registration Form' AS title,
  'Register as an approved SCM vendor or service supplier.' AS description,
  'downloads/scm-vendor-registration-form.pdf' AS file_path,
  'scm-vendor-registration-form.pdf' AS file_name,
  'application/pdf' AS mime_type,
  '1 KB' AS file_size,
  'bi-file-earmark-text-fill' AS icon,
  1 AS require_email,
  'Active' AS status,
  3 AS sort_order
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `web_downloads` WHERE `title` = 'Vendor Registration Form');

-- ── Doc 4: Classification Rules Summary (email-gated) ───────
INSERT INTO `web_downloads` (`category`, `title`, `description`, `file_path`, `file_name`, `mime_type`, `file_size`, `icon`, `require_email`, `status`, `sort_order`)
SELECT * FROM (SELECT
  'Guidelines' AS category,
  'Classification Rules Summary' AS title,
  'Summary of SCM classification rules and applicable IMO conventions.' AS description,
  'downloads/scm-classification-rules-summary.pdf' AS file_path,
  'scm-classification-rules-summary.pdf' AS file_name,
  'application/pdf' AS mime_type,
  '1 KB' AS file_size,
  'bi-file-earmark-richtext-fill' AS icon,
  1 AS require_email,
  'Active' AS status,
  4 AS sort_order
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `web_downloads` WHERE `title` = 'Classification Rules Summary');
