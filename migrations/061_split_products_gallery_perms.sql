-- ============================================================
-- Migration 061: Products & Gallery permission split
--   The flat module keys web.resources.products and
--   web.resources.gallery were replaced by tabbed sub-keys:
--     web.resources.products.content / .items
--     web.resources.gallery.content  / .albums
--   Migrate any existing role grants to the new sub-keys, then
--   drop the stale flat rows. Idempotent.
-- ============================================================

-- Carry an existing PRODUCTS grant onto both sub-keys (content gets
-- Read/Update; items gets the full CRUD set it had).
INSERT IGNORE INTO `role_permissions` (`role_id`, `module`, `permission`)
SELECT `role_id`, 'web.resources.products.content', `permission`
FROM `role_permissions`
WHERE `module` = 'web.resources.products' AND `permission` IN ('Read', 'Update');

INSERT IGNORE INTO `role_permissions` (`role_id`, `module`, `permission`)
SELECT `role_id`, 'web.resources.products.items', `permission`
FROM `role_permissions`
WHERE `module` = 'web.resources.products';

-- Same for GALLERY.
INSERT IGNORE INTO `role_permissions` (`role_id`, `module`, `permission`)
SELECT `role_id`, 'web.resources.gallery.content', `permission`
FROM `role_permissions`
WHERE `module` = 'web.resources.gallery' AND `permission` IN ('Read', 'Update');

INSERT IGNORE INTO `role_permissions` (`role_id`, `module`, `permission`)
SELECT `role_id`, 'web.resources.gallery.albums', `permission`
FROM `role_permissions`
WHERE `module` = 'web.resources.gallery';

-- Remove the stale flat rows.
DELETE FROM `role_permissions` WHERE `module` IN ('web.resources.products', 'web.resources.gallery');
