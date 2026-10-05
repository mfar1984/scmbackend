import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { parseUpload, saveUploadedFile, humanSize, getMaxUploadMb } from '@/lib/uploads';
import { requirePermission } from '@/lib/serverPermissions';

export const config = { api: { bodyParser: false } };

const TABLE = 'web_tenders';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const rows = await db(TABLE)
        .select('id', 'ref_no', 'title', 'category', 'cat_icon', 'sector', 'value', 'issued_date', 'deadline',
          'tender_status', 'description', 'file_name', 'mime_type', 'file_size', 'require_email',
          'download_count', 'status', 'sort_order', 'updated_at',
          db.raw("(file_path IS NOT NULL AND file_path <> '') AS has_file"))
        .orderBy('sort_order', 'asc').orderBy('id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    if (!(await requirePermission(req, res, 'web.business.tender.tenders', 'Create'))) return;
    try {
      const maxMb = await getMaxUploadMb();
      const { fields, file } = await parseUpload(req, maxMb);
      if (!fields.title?.trim()) return res.status(400).json({ success: false, message: 'Title is required.' });

      const row: any = {
        ref_no: fields.ref_no?.trim() || null,
        title: fields.title.trim(),
        category: fields.category?.trim() || 'Network Infrastructure',
        cat_icon: fields.cat_icon?.trim() || 'bi-ethernet',
        sector: fields.sector || 'Government',
        value: fields.value?.trim() || null,
        issued_date: fields.issued_date?.trim() || null,
        deadline: fields.deadline?.trim() || null,
        tender_status: fields.tender_status || 'open',
        description: fields.description?.trim() || null,
        require_email: fields.require_email === 'true' || fields.require_email === '1' ? 1 : 0,
        status: fields.status || 'Active',
        sort_order: parseInt(fields.sort_order) || 0,
      };
      if (file) {
        row.file_path = saveUploadedFile(file.tmpPath, 'tenders', file.originalName);
        row.file_name = file.originalName;
        row.mime_type = file.mime;
        row.file_size = humanSize(file.size);
      }
      const [id] = await db(TABLE).insert(row);
      return res.status(201).json({ success: true, id });
    } catch (err: any) {
      const max = await getMaxUploadMb().catch(() => 60);
      const msg = /maxFileSize|size/i.test(err.message) ? `File too large (max ${max}MB).` : (err.message || 'Upload failed.');
      return res.status(500).json({ success: false, message: msg });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
