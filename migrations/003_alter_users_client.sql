-- ============================================================
-- Migration 003: Add client-specific columns to users
-- ============================================================

ALTER TABLE `users`
  ADD COLUMN `contact_person` VARCHAR(150) DEFAULT NULL AFTER `name`,
  ADD COLUMN `sector`         VARCHAR(50)  DEFAULT NULL AFTER `contact_person`,
  ADD COLUMN `address`        VARCHAR(255) DEFAULT NULL AFTER `sector`,
  ADD COLUMN `website`        VARCHAR(150) DEFAULT NULL AFTER `address`;
