-- ============================================================
-- Migration 022: Seed "job_type" dropdown options (used by career postings)
-- ============================================================

INSERT IGNORE INTO `hr_dropdown_options` (`category`, `value`, `sort_order`) VALUES
('job_type', 'Full Time',  1),
('job_type', 'Part Time',  2),
('job_type', 'Contract',   3),
('job_type', 'Internship', 4),
('job_type', 'Temporary',  5);
