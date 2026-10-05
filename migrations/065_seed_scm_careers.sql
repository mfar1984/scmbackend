-- ============================================================
-- Migration 065: Seed SCM career master data + sample postings
-- Idempotent: safe to re-run (migrate.js re-runs every file).
-- ============================================================

-- ── Departments (SCM / maritime) ──
INSERT IGNORE INTO `hr_departments` (`name`, `code`, `description`) VALUES
('Survey & Inspection',          'SVY',   'Classification and statutory surveys'),
('Certification',                'CERT',  'Statutory and management system certification'),
('Consultancy & Advisory',       'CONS',  'Technical consultancy and advisory services'),
('Plan Approval & Newbuilding',  'PLAN',  'Design review and newbuilding supervision'),
('Operations',                   'OPS',   'Operations and coordination'),
('Health, Safety & Environment', 'HSE',   'Health, safety and environmental management'),
('Corporate / Admin',            'ADMIN', 'Corporate administration'),
('Finance',                      'FIN',   'Finance and accounts'),
('Human Resources',              'HR',    'Human resources');

-- ── Employment types ──
INSERT IGNORE INTO `hr_employment_types` (`name`) VALUES ('Permanent'), ('Contract');

-- ── Positions (guarded against duplicates) ──
INSERT INTO `hr_positions` (`name`, `department_id`)
SELECT 'Ship Surveyor', d.id
FROM `hr_departments` d
WHERE d.name = 'Survey & Inspection'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1 FROM `hr_positions` WHERE `name` = 'Ship Surveyor') AS _c);

INSERT INTO `hr_positions` (`name`, `department_id`)
SELECT 'HSE Safety Officer', d.id
FROM `hr_departments` d
WHERE d.name = 'Health, Safety & Environment'
  AND NOT EXISTS (SELECT 1 FROM (SELECT 1 FROM `hr_positions` WHERE `name` = 'HSE Safety Officer') AS _c);

-- ── Posting: Ship Surveyor ──
INSERT INTO `hr_career_postings`
  (`title`, `position_id`, `department`, `department_id`, `location`, `job_type`,
   `employment_type`, `employment_type_id`, `experience_level`, `min_experience`,
   `icon_theme`, `overview`, `responsibilities`, `requirements`, `benefits`, `skills`,
   `is_featured`, `status`, `posted_date`)
SELECT
  'Ship Surveyor',
  (SELECT id FROM `hr_positions`         WHERE `name` = 'Ship Surveyor'        LIMIT 1),
  'Survey & Inspection',
  (SELECT id FROM `hr_departments`       WHERE `name` = 'Survey & Inspection'  LIMIT 1),
  'Shah Alam, HQ', 'Full Time',
  'Permanent',
  (SELECT id FROM `hr_employment_types`  WHERE `name` = 'Permanent'            LIMIT 1),
  'Fresh Graduates Welcome', 0,
  'engineering',
  'Join SCM as a Ship Surveyor and carry out classification and statutory surveys on Malaysian-registered vessels, ensuring compliance with SCM Rules and international maritime conventions. Fresh graduates are encouraged to apply. Please state your field of study, institution, and highest qualification in your application message.',
  CONCAT_WS(CHAR(10),
    'Conduct classification, statutory and occasional surveys on ships and floating structures.',
    'Verify compliance with SCM Rules, SOLAS, MARPOL, Load Line and other applicable conventions.',
    'Prepare accurate survey reports and recommend corrective actions.',
    'Liaise with shipowners, shipyards and flag administration representatives.'),
  CONCAT_WS(CHAR(10),
    'Degree or Diploma in Marine Engineering, Naval Architecture, Nautical Studies or a related field.',
    'Fresh graduates are encouraged to apply; relevant marine experience is an added advantage.',
    'Willingness to travel and attend vessels at ports and shipyards.',
    'Good report-writing and communication skills.',
    'Please state your field of study, institution and highest qualification in your application message.'),
  CONCAT_WS(CHAR(10),
    'Structured training and sponsorship for professional certifications.',
    'Medical coverage and performance bonuses.',
    'Clear career progression within a national classification society.',
    'Meaningful work upholding maritime safety.'),
  'Ship Survey, SOLAS, MARPOL, Class Rules, Report Writing',
  1, 'Published', CURDATE()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM (SELECT 1 FROM `hr_career_postings` WHERE `title` = 'Ship Surveyor') AS _c);

-- ── Posting: HSE Safety Officer ──
INSERT INTO `hr_career_postings`
  (`title`, `position_id`, `department`, `department_id`, `location`, `job_type`,
   `employment_type`, `employment_type_id`, `experience_level`, `min_experience`,
   `icon_theme`, `overview`, `responsibilities`, `requirements`, `benefits`, `skills`,
   `is_featured`, `status`, `posted_date`)
SELECT
  'HSE Safety Officer',
  (SELECT id FROM `hr_positions`         WHERE `name` = 'HSE Safety Officer'          LIMIT 1),
  'Health, Safety & Environment',
  (SELECT id FROM `hr_departments`       WHERE `name` = 'Health, Safety & Environment' LIMIT 1),
  'Shah Alam, HQ', 'Full Time',
  'Permanent',
  (SELECT id FROM `hr_employment_types`  WHERE `name` = 'Permanent'                   LIMIT 1),
  '2-4 years', 2,
  'technical',
  'SCM is seeking an HSE Safety Officer to develop, implement and monitor health, safety and environmental practices across our operations and survey activities. Please state your field of study, institution, and highest qualification in your application message.',
  CONCAT_WS(CHAR(10),
    'Develop, implement and monitor HSE policies and procedures.',
    'Conduct risk assessments, safety inspections and incident investigations.',
    'Ensure compliance with OSHA 1994 and relevant safety regulations.',
    'Deliver safety briefings and training to staff and surveyors.'),
  CONCAT_WS(CHAR(10),
    'Degree or Diploma in Occupational Safety & Health, Environmental Science or a related field.',
    'Green Book / NIOSH certification is an added advantage.',
    'Knowledge of OSHA 1994 and relevant HSE regulations.',
    'Strong attention to detail and communication skills.',
    'Please state your field of study, institution and highest qualification in your application message.'),
  CONCAT_WS(CHAR(10),
    'Competitive salary and medical coverage.',
    'Professional development and HSE certification support.',
    'A supportive, safety-first work culture.'),
  'HSE, Risk Assessment, OSHA 1994, Safety Audit, Incident Investigation',
  0, 'Published', CURDATE()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM (SELECT 1 FROM `hr_career_postings` WHERE `title` = 'HSE Safety Officer') AS _c);
