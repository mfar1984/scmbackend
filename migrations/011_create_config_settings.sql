-- ============================================================
-- Migration 011: Config Settings table
-- ============================================================

CREATE TABLE IF NOT EXISTS `config_settings` (
  `id`         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `module`     VARCHAR(50)   NOT NULL COMMENT 'general | branding | social_seo | backup | maintenance',
  `key`        VARCHAR(100)  NOT NULL,
  `value`      TEXT          DEFAULT NULL,
  `updated_at` TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_module_key` (`module`, `key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed: General ──
INSERT INTO `config_settings` (`module`, `key`, `value`) VALUES
('general', 'site_name',     'ATLINE SDN BHD'),
('general', 'site_url',      'https://atline.com.my'),
('general', 'reg_no',        '201503318537 (002488335-X)'),
('general', 'admin_email',   'admin@atline.com.my'),
('general', 'support_email', 'support@atline.com.my'),
('general', 'phone',         '03-XXXX XXXX'),
('general', 'address',       'Unit 606, Block C, Kelana Square, 17, Jalan SS 7/26, SS7, 47301 Petaling Jaya, Selangor'),
('general', 'timezone',      'Asia/Kuala_Lumpur'),
('general', 'date_format',   'DD MMM YYYY'),
('general', 'time_format',   '12h'),
('general', 'language',      'en'),
('general', 'currency',      'MYR'),

-- ── Seed: Branding ──
('branding', 'primary_color',  '#3b82f6'),
('branding', 'accent_color',   '#6366f1'),
('branding', 'success_color',  '#22c55e'),
('branding', 'danger_color',   '#ef4444'),
('branding', 'sidebar_bg',     '#ffffff'),
('branding', 'topbar_bg',      '#ffffff'),
('branding', 'font_heading',   'Inter'),
('branding', 'font_body',      'Inter'),
('branding', 'login_bg',       'gradient'),
('branding', 'login_bg_color', '#0f1623'),

-- ── Seed: Social & SEO ──
('social_seo', 'facebook',      'https://www.facebook.com/atline'),
('social_seo', 'tiktok',        'https://www.tiktok.com/@atline'),
('social_seo', 'whatsapp',      '+60312345678'),
('social_seo', 'linkedin',      ''),
('social_seo', 'instagram',     ''),
('social_seo', 'twitter',       ''),
('social_seo', 'meta_title',    'ATLINE SDN BHD — ICT Infrastructure Solutions Malaysia'),
('social_seo', 'meta_desc',     'Professional ICT infrastructure and network engineering services for government and private sectors in Malaysia.'),
('social_seo', 'meta_keywords', 'ICT infrastructure Malaysia, network engineering, structured cabling'),
('social_seo', 'og_image',      ''),
('social_seo', 'ga_id',         ''),
('social_seo', 'gtm_id',        ''),
('social_seo', 'gsc_code',      ''),
('social_seo', 'robots_txt',    'User-agent: *\nAllow: /\nSitemap: https://atline.com.my/sitemap.xml'),

-- ── Seed: Backup ──
('backup', 'auto_backup',  '1'),
('backup', 'schedule',     'daily'),
('backup', 'backup_time',  '03:00'),
('backup', 'retention',    '30'),
('backup', 'storage',      'local'),
('backup', 's3_bucket',    ''),
('backup', 's3_key',       ''),
('backup', 's3_secret',    ''),

-- ── Seed: Maintenance ──
('maintenance', 'maintenance_mode', '0'),
('maintenance', 'maint_message',    'We are currently performing scheduled maintenance. We will be back shortly.'),
('maintenance', 'maint_allow_ip',   '127.0.0.1'),
('maintenance', 'debug_mode',       '0'),
('maintenance', 'log_level',        'INFO'),
('maintenance', 'log_retention',    '30');
