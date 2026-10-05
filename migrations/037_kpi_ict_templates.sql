-- ============================================================
-- Migration 037: KPI templates for ICT Division roles
--   - ICT Division (General)
--   - Project Manager
--   - Senior Manager
--   - Senior Engineer
-- Idempotent: INSERT IGNORE + NOT EXISTS guards.
-- ============================================================

-- ── Senior/leadership-oriented competencies ──
INSERT IGNORE INTO `hr_kpi_competencies` (`name`, `category`, `description`) VALUES
('Strategic Planning & Decision Making', 'Leadership', 'Setting direction, prioritising and making sound decisions'),
('Stakeholder & Client Management', 'Leadership', 'Managing relationships with clients, vendors and stakeholders'),
('Budget & Cost Management', 'Functional', 'Managing budgets, cost control and resource efficiency'),
('Risk Management', 'Functional', 'Identifying, assessing and mitigating project and operational risks'),
('Mentoring & Coaching', 'Leadership', 'Developing, guiding and upskilling team members'),
('Technical Expertise & Innovation', 'Functional', 'Depth of technical mastery and applying new technologies');

-- ── Templates ──
INSERT IGNORE INTO `hr_kpi_templates` (`name`, `description`, `status`) VALUES
('ICT Division Staff Appraisal', 'General KPI for ICT division staff across technical and support functions.', 'Active'),
('Project Manager Appraisal', 'KPI for project managers focused on delivery, budget, risk and stakeholders.', 'Active'),
('Senior Manager Appraisal', 'KPI for senior management with strategic and leadership emphasis.', 'Active'),
('Senior Engineer Appraisal', 'KPI for senior engineers focused on technical mastery and mentoring.', 'Active');

-- ===== ICT Division Staff (sums to 100) =====
INSERT INTO `hr_kpi_template_items` (`template_id`, `competency_id`, `competency_name`, `weight`, `sort_order`)
SELECT t.id, c.id, c.name, w.weight, w.so FROM `hr_kpi_templates` t
JOIN ( SELECT 'Job Knowledge' nm, 20 weight, 0 so
  UNION ALL SELECT 'Quality of Work', 20, 1
  UNION ALL SELECT 'Project Delivery & Timeliness', 15, 2
  UNION ALL SELECT 'Problem Solving & Troubleshooting', 15, 3
  UNION ALL SELECT 'Productivity', 10, 4
  UNION ALL SELECT 'Teamwork', 10, 5
  UNION ALL SELECT 'Punctuality & Attendance', 10, 6 ) w
JOIN `hr_kpi_competencies` c ON c.name = w.nm
WHERE t.name = 'ICT Division Staff Appraisal'
  AND NOT EXISTS (SELECT 1 FROM `hr_kpi_template_items` i WHERE i.template_id = t.id AND i.competency_name = w.nm);

-- ===== Project Manager (sums to 100) =====
INSERT INTO `hr_kpi_template_items` (`template_id`, `competency_id`, `competency_name`, `weight`, `sort_order`)
SELECT t.id, c.id, c.name, w.weight, w.so FROM `hr_kpi_templates` t
JOIN ( SELECT 'Project Delivery & Timeliness' nm, 25 weight, 0 so
  UNION ALL SELECT 'Goal / Target Achievement', 20, 1
  UNION ALL SELECT 'Budget & Cost Management', 15, 2
  UNION ALL SELECT 'Stakeholder & Client Management', 12, 3
  UNION ALL SELECT 'Risk Management', 10, 4
  UNION ALL SELECT 'Leadership', 10, 5
  UNION ALL SELECT 'Communication', 8, 6 ) w
JOIN `hr_kpi_competencies` c ON c.name = w.nm
WHERE t.name = 'Project Manager Appraisal'
  AND NOT EXISTS (SELECT 1 FROM `hr_kpi_template_items` i WHERE i.template_id = t.id AND i.competency_name = w.nm);

-- ===== Senior Manager (sums to 100) =====
INSERT INTO `hr_kpi_template_items` (`template_id`, `competency_id`, `competency_name`, `weight`, `sort_order`)
SELECT t.id, c.id, c.name, w.weight, w.so FROM `hr_kpi_templates` t
JOIN ( SELECT 'Strategic Planning & Decision Making' nm, 25 weight, 0 so
  UNION ALL SELECT 'Leadership', 20, 1
  UNION ALL SELECT 'Goal / Target Achievement', 20, 2
  UNION ALL SELECT 'Stakeholder & Client Management', 12, 3
  UNION ALL SELECT 'Budget & Cost Management', 11, 4
  UNION ALL SELECT 'Mentoring & Coaching', 7, 5
  UNION ALL SELECT 'Communication', 5, 6 ) w
JOIN `hr_kpi_competencies` c ON c.name = w.nm
WHERE t.name = 'Senior Manager Appraisal'
  AND NOT EXISTS (SELECT 1 FROM `hr_kpi_template_items` i WHERE i.template_id = t.id AND i.competency_name = w.nm);

-- ===== Senior Engineer (sums to 100) =====
INSERT INTO `hr_kpi_template_items` (`template_id`, `competency_id`, `competency_name`, `weight`, `sort_order`)
SELECT t.id, c.id, c.name, w.weight, w.so FROM `hr_kpi_templates` t
JOIN ( SELECT 'Technical Expertise & Innovation' nm, 25 weight, 0 so
  UNION ALL SELECT 'Quality of Work', 18, 1
  UNION ALL SELECT 'Problem Solving & Troubleshooting', 17, 2
  UNION ALL SELECT 'Project Delivery & Timeliness', 15, 3
  UNION ALL SELECT 'Mentoring & Coaching', 10, 4
  UNION ALL SELECT 'Goal / Target Achievement', 10, 5
  UNION ALL SELECT 'Initiative', 5, 6 ) w
JOIN `hr_kpi_competencies` c ON c.name = w.nm
WHERE t.name = 'Senior Engineer Appraisal'
  AND NOT EXISTS (SELECT 1 FROM `hr_kpi_template_items` i WHERE i.template_id = t.id AND i.competency_name = w.nm);
