-- ============================================================
-- Migration 046: Drop Purchase Order / Goods Received tables
--   Procurement scope reduced to Vendor directory only
--   (no accounting / procure-to-pay). Safe & idempotent.
-- ============================================================

DROP TABLE IF EXISTS `ops_grn_items`;
DROP TABLE IF EXISTS `ops_goods_received`;
DROP TABLE IF EXISTS `ops_po_items`;
DROP TABLE IF EXISTS `ops_purchase_orders`;
