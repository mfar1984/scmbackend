-- ============================================================
-- Migration 036: Seed realistic KPI competencies + role-based templates
-- (ICT Infrastructure company — ATLINE)
-- Idempotent: INSERT IGNORE for unique rows, NOT EXISTS guards for items.
-- ============================================================

-- ── Additional result/output-oriented competencies ──
INSERT IGNORE INTO `hr_kpi_competencies` (`name`, `category`, `description`) VALUES
('Goal / Target Achievement', 'Functional', 'Achievement of agreed individual targets and deliverables'),
('Customer Service Orientation', 'Functional', 'Responsiveness and quality of service to clients'),
('Project Delivery & Timeliness', 'Functional', 'Completing assignments on time and within scope'),
('Problem Solving & Troubleshooting', 'Functional', 'Diagnosing issues and implementing effective solutions'),
('Safety & Compliance', 'Core', 'Adherence to OSH, SOP and regulatory requirements');

-- ── Templates (name is unique → INSERT IGNORE) ──
INSERT IGNORE INTO `hr_kpi_templates` (`name`, `description`, `status`) VALUES
('Non-Executive / General Staff Annual Appraisal', 'Annual performance review for general and support staff.', 'Active'),
('Executive / Network Engineer Annual Appraisal', 'Annual review for executives and technical engineering staff.', 'Active'),
('Managerial / Head of Department Appraisal', 'Annual review for managers and department heads with leadership focus.', 'Active'),
('Probation Confirmation Appraisal', 'End-of-probation assessment to confirm a new employee.', 'Active'),
('Sales / Business Development Appraisal', 'Target-driven review for sales and business development roles.', 'Active'),
('Technician / Site Operations Appraisal', 'Field/site operations review with safety and delivery focus.', 'Active');

-- ── Helper pattern: insert a template item linking by names, with weight + order ──
-- Repeated per (template, competency).

-- ===== 1) Non-Executive / General Staff (sums to 100) =====
INSERT INTO `hr_kpi_template_items` (`template_id`, `competency_id`, `competency_name`, `weight`, `sort_order`)
SELECT t.id, c.id, c.name, w.weight, w.so FROM `hr_kpi_templates` t
JOIN ( SELECT 'Quality of Work' nm, 25 weight, 0 so
  UNION ALL SELECT 'Productivity', 20, 1
  UNION ALL SELECT 'Job Knowledge', 15, 2
  UNION ALL SELECT 'Teamwork', 15, 3
  UNION ALL SELECT 'Communication', 10, 4
  UNION ALL SELECT 'Punctuality & Attendance', 15, 5 ) w
JOIN `hr_kpi_competencies` c ON c.name = w.nm
WHERE t.name = 'Non-Executive / General Staff Annual Appraisal'
  AND NOT EXISTS (SELECT 1 FROM `hr_kpi_template_items` i WHERE i.template_id = t.id AND i.competency_name = w.nm);

-- ===== 2) Executive / Network Engineer (sums to 100) =====
INSERT INTO `hr_kpi_template_items` (`template_id`, `competency_id`, `competency_name`, `weight`, `sort_order`)
SELECT t.id, c.id, c.name, w.weight, w.so FROM `hr_kpi_templates` t
JOIN ( SELECT 'Goal / Target Achievement' nm, 25 weight, 0 so
  UNION ALL SELECT 'Quality of Work', 20, 1
  UNION ALL SELECT 'Project Delivery & Timeliness', 15, 2
  UNION ALL SELECT 'Problem Solving & Troubleshooting', 15, 3
  UNION ALL SELECT 'Job Knowledge', 10, 4
  UNION ALL SELECT 'Initiative', 8, 5
  UNION ALL SELECT 'Teamwork', 7, 6 ) w
JOIN `hr_kpi_competencies` c ON c.name = w.nm
WHERE t.name = 'Executive / Network Engineer Annual Appraisal'
  AND NOT EXISTS (SELECT 1 FROM `hr_kpi_template_items` i WHERE i.template_id = t.id AND i.competency_name = w.nm);

-- ===== 3) Managerial / Head of Department (sums to 100) =====
INSERT INTO `hr_kpi_template_items` (`template_id`, `competency_id`, `competency_name`, `weight`, `sort_order`)
SELECT t.id, c.id, c.name, w.weight, w.so FROM `hr_kpi_templates` t
JOIN ( SELECT 'Goal / Target Achievement' nm, 25 weight, 0 so
  UNION ALL SELECT 'Leadership', 25, 1
  UNION ALL SELECT 'Project Delivery & Timeliness', 15, 2
  UNION ALL SELECT 'Communication', 10, 3
  UNION ALL SELECT 'Problem Solving & Troubleshooting', 10, 4
  UNION ALL SELECT 'Initiative', 8, 5
  UNION ALL SELECT 'Customer Service Orientation', 7, 6 ) w
JOIN `hr_kpi_competencies` c ON c.name = w.nm
WHERE t.name = 'Managerial / Head of Department Appraisal'
  AND NOT EXISTS (SELECT 1 FROM `hr_kpi_template_items` i WHERE i.template_id = t.id AND i.competency_name = w.nm);

-- ===== 4) Probation Confirmation (sums to 100) =====
INSERT INTO `hr_kpi_template_items` (`template_id`, `competency_id`, `competency_name`, `weight`, `sort_order`)
SELECT t.id, c.id, c.name, w.weight, w.so FROM `hr_kpi_templates` t
JOIN ( SELECT 'Job Knowledge' nm, 25 weight, 0 so
  UNION ALL SELECT 'Quality of Work', 20, 1
  UNION ALL SELECT 'Punctuality & Attendance', 20, 2
  UNION ALL SELECT 'Teamwork', 15, 3
  UNION ALL SELECT 'Initiative', 10, 4
  UNION ALL SELECT 'Communication', 10, 5 ) w
JOIN `hr_kpi_competencies` c ON c.name = w.nm
WHERE t.name = 'Probation Confirmation Appraisal'
  AND NOT EXISTS (SELECT 1 FROM `hr_kpi_template_items` i WHERE i.template_id = t.id AND i.competency_name = w.nm);

-- ===== 5) Sales / Business Development (sums to 100) =====
INSERT INTO `hr_kpi_template_items` (`template_id`, `competency_id`, `competency_name`, `weight`, `sort_order`)
SELECT t.id, c.id, c.name, w.weight, w.so FROM `hr_kpi_templates` t
JOIN ( SELECT 'Goal / Target Achievement' nm, 40 weight, 0 so
  UNION ALL SELECT 'Customer Service Orientation', 20, 1
  UNION ALL SELECT 'Communication', 15, 2
  UNION ALL SELECT 'Initiative', 15, 3
  UNION ALL SELECT 'Teamwork', 10, 4 ) w
JOIN `hr_kpi_competencies` c ON c.name = w.nm
WHERE t.name = 'Sales / Business Development Appraisal'
  AND NOT EXISTS (SELECT 1 FROM `hr_kpi_template_items` i WHERE i.template_id = t.id AND i.competency_name = w.nm);

-- ===== 6) Technician / Site Operations (sums to 100) =====
INSERT INTO `hr_kpi_template_items` (`template_id`, `competency_id`, `competency_name`, `weight`, `sort_order`)
SELECT t.id, c.id, c.name, w.weight, w.so FROM `hr_kpi_templates` t
JOIN ( SELECT 'Quality of Work' nm, 20 weight, 0 so
  UNION ALL SELECT 'Project Delivery & Timeliness', 20, 1
  UNION ALL SELECT 'Safety & Compliance', 20, 2
  UNION ALL SELECT 'Problem Solving & Troubleshooting', 15, 3
  UNION ALL SELECT 'Productivity', 15, 4
  UNION ALL SELECT 'Punctuality & Attendance', 10, 5 ) w
JOIN `hr_kpi_competencies` c ON c.name = w.nm
WHERE t.name = 'Technician / Site Operations Appraisal'
  AND NOT EXISTS (SELECT 1 FROM `hr_kpi_template_items` i WHERE i.template_id = t.id AND i.competency_name = w.nm);
