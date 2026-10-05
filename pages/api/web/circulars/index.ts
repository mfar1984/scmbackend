import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { parseUpload, saveUploadedFile, getMaxUploadMb } from '@/lib/uploads';
import { requirePermission } from '@/lib/serverPermissions';

// POST uses multipart/form-data (PDF upload).
export const config = { api: { bodyParser: false } };

const TABLE = 'web_circulars';
const PERM = 'web.resources.circulars';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const rows = await db(TABLE)
        .select('id', 'no', 'title', 'year', 'release_date', 'effective_date', 'file_name', 'mime_type', 'status', 'sort_order', 'updated_at',
          db.raw("(file_path IS NOT NULL AND file_path <> '') AS has_file"))
        .orderBy('year', 'desc').orderBy('release_date', 'desc').orderBy('id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    if (!(await requirePermission(req, res, PERM, 'Create'))) return;
    try {
      const maxMb = await getMaxUploadMb();
      const { fields, file } = await parseUpload(req, maxMb);
      if (!fields.no?.trim()) return res.status(400).json({ success: false, message: 'Circular number is required.' });
      if (!fields.title?.trim()) return res.status(400).json({ success: false, message: 'Title is required.' });

      const releaseDate = fields.release_date?.trim() || null;
      const effectiveDate = fields.effective_date?.trim() || null;
      const year = parseInt(fields.year) || (releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear());

      const row: any = {
        no: fields.no.trim(),
        title: fields.title.trim(),
        year,
        release_date: releaseDate,
        effective_date: effectiveDate,
        status: fields.status || 'Active',
        sort_order: parseInt(fields.sort_order) || 0,
      };
      if (file) {
        row.file_path = saveUploadedFile(file.tmpPath, 'circulars', file.originalName);
        row.file_name = file.originalName;
        row.mime_type = file.mime;
      }
      const [id] = await db(TABLE).insert(row);
      return res.status(201).json({ success: true, id });
    } catch (err: any) {
      const max = await getMaxUploadMb().catch(() => 60);
      const msg = /maxFileSize|size/i.test(err.message) ? `File too large (max ${max}MB).` : (err.message || 'Create failed.');
      return res.status(500).json({ success: false, message: msg });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
