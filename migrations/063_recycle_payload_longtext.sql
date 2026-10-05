-- ============================================================
-- Migration 063: Widen recycle_bin.payload to LONGTEXT
--   Some records embed base64 files in-row (proposals.doc_data,
--   ops_tenders.compiled_doc, ops_tender_documents.file_data up
--   to ~18MB; supplier_registrations has up to 7 base64 doc
--   columns; payroll payment_proof ~11MB). A full snapshot can
--   exceed MEDIUMTEXT (16MB), so use LONGTEXT (4GB) to be safe.
-- ============================================================

ALTER TABLE `recycle_bin` MODIFY COLUMN `payload` LONGTEXT NOT NULL;
