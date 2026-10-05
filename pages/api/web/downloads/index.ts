import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { parseUpload, saveUploadedFile, deleteUpload, humanSize, getMaxUploadMb } from '@/lib/uploads';
import { requirePermission } from '@/lib/serverPermissions';

// Disable body parser — POST uses multipart/form-data (file upload).
export const config = { api: { bodyParser: false } };

const TABLE = 'web_downloads';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const rows = await db(TABLE)
        .select('id', 'category', 'title', 'description', 'file_name', 'mime_type', 'file_size',
          'icon', 'require_email', 'status', 'download_count', 'sort_order', 'updated_at',
          db.raw("(file_path IS NOT NULL AND file_path <> '') AS has_file"))
        .orderBy('sort_order', 'asc').orderBy('id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    if (!(await requirePermission(req, res, 'web.resources.download.files', 'Create'))) return;
    try {
      const maxMb = await getMaxUploadMb();
      const { fields, file } = await parseUpload(req, maxMb);
      if (!fields.title?.trim()) return res.status(400).json({ success: false, message: 'Title is required.' });
      if (!file) return res.status(400).json({ success: false, message: 'Please upload a file.' });

      const relPath = saveUploadedFile(file.tmpPath, 'downloads', file.originalName);
      const [id] = await db(TABLE).insert({
        category: fields.category?.trim() || 'General',
        title: fields.title.trim(),
        description: fields.description?.trim() || null,
        file_path: relPath,
        file_name: file.originalName,
        mime_type: file.mime,
        file_size: humanSize(file.size),
        icon: fields.icon?.trim() || 'bi-file-earmark-text',
        require_email: fields.require_email === 'true' || fields.require_email === '1' ? 1 : 0,
        status: fields.status || 'Active',
        sort_order: parseInt(fields.sort_order) || 0,
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) {
      const max = await getMaxUploadMb().catch(() => 60);
      const msg = /maxFileSize|size/i.test(err.message) ? `File too large (max ${max}MB).` : (err.message || 'Upload failed.');
      return res.status(500).json({ success: false, message: msg });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
