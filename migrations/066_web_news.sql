-- ============================================================
-- Migration 066: Web News / Articles module
-- Idempotent: safe to re-run (migrate.js re-runs every file).
-- ============================================================

CREATE TABLE IF NOT EXISTS `web_news` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug`         VARCHAR(191) NOT NULL,
  `category`     VARCHAR(80)  DEFAULT NULL,
  `title`        VARCHAR(200) NOT NULL,
  `excerpt`      TEXT         DEFAULT NULL,
  `author`       VARCHAR(120) DEFAULT NULL,
  `article_date` DATE         DEFAULT NULL,
  `read_time`    VARCHAR(40)  DEFAULT NULL,
  `image`        VARCHAR(400) DEFAULT NULL COMMENT 'hero image URL/path',
  `intro`        TEXT         DEFAULT NULL,
  `sections`     LONGTEXT     DEFAULT NULL COMMENT 'JSON: [{heading, body:[..]}]',
  `gallery`      LONGTEXT     DEFAULT NULL COMMENT 'JSON: [url, ..]',
  `tags`         VARCHAR(400) DEFAULT NULL COMMENT 'comma separated',
  `status`       VARCHAR(20)  NOT NULL DEFAULT 'Published' COMMENT 'Published | Draft',
  `is_featured`  TINYINT(1)   NOT NULL DEFAULT 0,
  `sort_order`   INT          NOT NULL DEFAULT 0,
  `posted_date`  DATE         DEFAULT NULL,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_news_slug` (`slug`),
  KEY `idx_news_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed SCM articles (INSERT IGNORE keeps re-runs safe via unique slug) ──
INSERT IGNORE INTO `web_news`
  (`slug`, `category`, `title`, `excerpt`, `author`, `article_date`, `read_time`, `image`, `intro`, `sections`, `gallery`, `tags`, `status`, `is_featured`, `sort_order`, `posted_date`)
VALUES
(
  'iso-9001-recertification-2026', 'Company News',
  'SCM Achieves ISO 9001:2015 Recertification',
  'Ships Classification Malaysia has successfully renewed its ISO 9001:2015 Quality Management System certification, reaffirming our commitment to service excellence.',
  'SCM Communications', '2026-02-18', '4 min read', '/image/quality-policy.jpg',
  'SCM has successfully completed its ISO 9001:2015 recertification audit, reaffirming our dedication to delivering quality classification and statutory services to the maritime industry.',
  '[{"heading":"Overview","body":["Ships Classification Malaysia (SCM) is pleased to announce the successful renewal of its ISO 9001:2015 Quality Management System (QMS) certification. The recertification follows a comprehensive audit of our processes across survey, plan approval, certification and administrative functions.","This milestone reflects SCM\u2019s continued commitment to maintaining the highest standards of quality and consistency in every service we provide to shipowners, operators and government agencies."]},{"heading":"What This Means for Our Clients","body":["The ISO 9001:2015 certification assures our clients that SCM operates a documented, continuously improving quality system \u2014 from the way we plan surveys to how we handle certification and client feedback.","Our clients can expect consistent, reliable and transparent service delivery aligned with international best practices and R.O. Code requirements."]}]',
  '["/image/quality-policy.jpg","/image/core-value.jpg","/image/survey-inspection-min.png"]',
  'ISO 9001,Quality,Certification,Company News', 'Published', 1, 1, '2026-02-18'
),
(
  'ballast-water-management-guidance', 'Maritime Safety',
  'New Guidance on Ballast Water Management Compliance',
  'SCM issues updated guidance to help shipowners meet Ballast Water Management Convention requirements and BWMS commissioning testing.',
  'Technical Department', '2026-02-02', '5 min read', '/image/bg-compromise-on.jpg',
  'To support shipowners in meeting the IMO Ballast Water Management (BWM) Convention, SCM has released updated guidance covering compliance, BWMS installation and commissioning testing.',
  '[{"heading":"Overview","body":["The Ballast Water Management Convention aims to prevent the spread of harmful aquatic organisms from one region to another. Vessels are required to manage their ballast water to remove, render harmless, or avoid the uptake or discharge of such organisms.","SCM\u2019s updated guidance clarifies the survey, documentation and commissioning testing requirements for Malaysian-registered vessels fitting Ballast Water Management Systems (BWMS)."]},{"heading":"Commissioning Testing","body":["Commissioning testing validates the correct installation and operation of a BWMS. SCM works with approved service suppliers to witness and verify testing in line with IMO guidelines.","Owners are encouraged to plan commissioning testing early to avoid delays during scheduled surveys."]}]',
  '["/image/bg-compromise-on.jpg","/image/Slider1.jpg","/image/Slider2.jpg"]',
  'BWMS,Maritime Safety,IMO,Compliance', 'Published', 0, 2, '2026-02-02'
),
(
  'east-malaysia-survey-expansion', 'Company News',
  'SCM Expands Survey Operations in East Malaysia',
  'To better serve clients in Sabah and Sarawak, SCM strengthens its survey presence and response capabilities across East Malaysia.',
  'SCM Communications', '2026-01-20', '3 min read', '/image/Slider2.jpg',
  'SCM is expanding its survey operations in East Malaysia to provide faster, more responsive classification and statutory services to shipowners in Sabah and Sarawak.',
  '[{"heading":"Overview","body":["As part of our commitment to serving the nation, SCM continues to grow its operational footprint. The expansion in East Malaysia enhances our ability to attend vessels promptly at ports and shipyards across the region.","This initiative reduces waiting times and supports the growing maritime activity between East Malaysia, West Malaysia and the ASEAN region."]}]',
  '["/image/Slider2.jpg","/image/survey-inspection-min.png","/image/core-value.jpg"]',
  'Company News,East Malaysia,Surveys', 'Published', 0, 3, '2026-01-20'
),
(
  'understanding-eexi-cii', 'Industry Updates',
  'Understanding EEXI and CII: What Shipowners Need to Know',
  'A practical look at the Energy Efficiency Existing Ship Index (EEXI) and Carbon Intensity Indicator (CII) and their impact on the fleet.',
  'Technical Department', '2026-01-08', '6 min read', '/image/Plan-Approval-Newbuilding-min.png',
  'The EEXI and CII regulations are reshaping how the maritime industry approaches energy efficiency and decarbonisation. Here is what shipowners need to understand.',
  '[{"heading":"Overview","body":["The Energy Efficiency Existing Ship Index (EEXI) and the Carbon Intensity Indicator (CII) are key measures introduced by the IMO to reduce greenhouse gas emissions from international shipping.","EEXI applies a technical efficiency requirement to existing ships, while CII rates a ship\u2019s operational carbon intensity on an annual basis."]},{"heading":"How SCM Supports Compliance","body":["SCM provides EEXI verification, SEEMP review, and advisory services to help owners understand and meet these requirements.","Our technical team assists with calculations, documentation and verification to keep your fleet compliant with evolving regulations."]}]',
  '["/image/Plan-Approval-Newbuilding-min.png","/image/Slider1.jpg"]',
  'EEXI,CII,Decarbonisation,Industry Updates', 'Published', 0, 4, '2026-01-08'
),
(
  'asian-classification-society-forum', 'Events',
  'SCM Participates in Asian Classification Society Forum',
  'SCM joined fellow members of the Asian Classification Society (ACS) to discuss regional maritime safety and technical cooperation.',
  'SCM Communications', '2025-12-12', '3 min read', '/image/banner-about.jpg',
  'As a member of the Asian Classification Society (ACS), SCM participated in the latest ACS forum to strengthen regional cooperation on maritime safety and technical standards.',
  '[{"heading":"Overview","body":["The forum brought together classification societies across Asia to share knowledge, harmonise technical approaches and discuss emerging challenges in the maritime sector.","SCM contributed insights on classification of Malaysian-registered vessels and reaffirmed its commitment to regional collaboration."]}]',
  '["/image/banner-about.jpg","/image/core-value.jpg"]',
  'Events,ACS,Collaboration', 'Published', 0, 5, '2025-12-12'
),
(
  'digital-surveys-maritime-safety', 'Industry Updates',
  'Enhancing Maritime Safety Through Digital Surveys',
  'SCM embraces digital tools and remote survey techniques to improve efficiency while maintaining rigorous safety standards.',
  'Technical Department', '2025-11-28', '5 min read', '/image/survey-inspection-min.png',
  'Digital transformation is changing how surveys are conducted. SCM is adopting modern tools to enhance efficiency without compromising on safety.',
  '[{"heading":"Overview","body":["SCM is keeping pace with the latest technologies and developments in the digital revolution, incorporating digital tools and remote survey techniques where appropriate.","These innovations improve turnaround times and data accuracy while upholding the highest safety and quality standards."]}]',
  '["/image/survey-inspection-min.png","/image/Slider1.jpg","/image/quality-policy.jpg"]',
  'Digital,Surveys,Innovation,Industry Updates', 'Published', 0, 6, '2025-11-28'
);
