import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { parseUpload, saveUploadedFile, humanSize, getMaxUploadMb } from '@/lib/uploads';
import { requirePermission } from '@/lib/serverPermissions';

// Disable body parser — POST uses multipart/form-data (image upload).
export const config = { api: { bodyParser: false } };

const TABLE = 'web_products';
const PERM = 'web.resources.products.items';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const rows = await db(TABLE)
        .select('id', 'title', 'tag', 'category', 'description', 'specs', 'brands', 'icon',
          'image_name', 'mime_type', 'status', 'sort_order', 'updated_at',
          db.raw("(image_path IS NOT NULL AND image_path <> '') AS has_image"))
        .orderBy('sort_order', 'asc').orderBy('id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    if (!(await requirePermission(req, res, PERM, 'Create'))) return;
    try {
      const maxMb = await getMaxUploadMb();
      const { fields, file } = await parseUpload(req, maxMb);
      if (!fields.title?.trim()) return res.status(400).json({ success: false, message: 'Title is required.' });

      const row: any = {
        title: fields.title.trim(),
        tag: fields.tag?.trim() || null,
        category: fields.category?.trim() || 'General',
        description: fields.description?.trim() || null,
        specs: fields.specs?.trim() || null,
        brands: fields.brands?.trim() || null,
        icon: fields.icon?.trim() || 'bi-box-seam',
        status: fields.status || 'Active',
        sort_order: parseInt(fields.sort_order) || 0,
      };
      if (file) {
        row.image_path = saveUploadedFile(file.tmpPath, 'products', file.originalName);
        row.image_name = file.originalName;
        row.mime_type = file.mime;
      }
      const [id] = await db(TABLE).insert(row);
      return res.status(201).json({ success: true, id });
    } catch (err: any) {
      const max = await getMaxUploadMb().catch(() => 60);
      const msg = /maxFileSize|size/i.test(err.message) ? `Image too large (max ${max}MB).` : (err.message || 'Upload failed.');
      return res.status(500).json({ success: false, message: msg });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
