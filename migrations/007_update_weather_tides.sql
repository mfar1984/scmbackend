-- ============================================================
-- Migration 007: Add Tides settings to weather module
-- ============================================================

INSERT IGNORE INTO `integration_settings` (`module`, `key`, `value`) VALUES
('weather', 'tides_enabled',  '0'),
('weather', 'tides_api_key',  ''),
('weather', 'tides_location', 'Pelabuhan Kelang'),
('weather', 'tides_data',     ''),
('weather', 'tides_last_sync','');
