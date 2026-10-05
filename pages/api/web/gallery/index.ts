import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { parseUpload, saveUploadedFile, getMaxUploadMb } from '@/lib/uploads';
import { requirePermission } from '@/lib/serverPermissions';

// Albums list (GET) + create album (POST, optional cover image).
export const config = { api: { bodyParser: false } };

const TABLE = 'web_gallery_albums';
const PERM = 'web.resources.gallery.albums';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const albums = await db(TABLE)
        .select('id', 'title', 'subtitle', 'category', 'year', 'description', 'cover_name', 'status', 'sort_order', 'updated_at',
          db.raw("(cover_path IS NOT NULL AND cover_path <> '') AS has_cover"))
        .orderBy('sort_order', 'asc').orderBy('id', 'desc');
      // attach photo counts
      const counts = await db('web_gallery_photos').select('album_id').count({ c: 'id' }).groupBy('album_id');
      const map: Record<number, number> = {};
      counts.forEach((r: any) => { map[r.album_id] = Number(r.c); });
      const data = albums.map((a: any) => ({ ...a, photo_count: map[a.id] || 0 }));
      return res.status(200).json({ success: true, data });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    if (!(await requirePermission(req, res, PERM, 'Create'))) return;
    try {
      const maxMb = await getMaxUploadMb();
      const { fields, file } = await parseUpload(req, maxMb);
      if (!fields.title?.trim()) return res.status(400).json({ success: false, message: 'Album title is required.' });

      const row: any = {
        title: fields.title.trim(),
        subtitle: fields.subtitle?.trim() || null,
        category: fields.category?.trim() || 'Projects',
        year: fields.year?.trim() || null,
        description: fields.description?.trim() || null,
        status: fields.status || 'Active',
        sort_order: parseInt(fields.sort_order) || 0,
      };
      if (file) {
        row.cover_path = saveUploadedFile(file.tmpPath, 'gallery', file.originalName);
        row.cover_name = file.originalName;
      }
      const [id] = await db(TABLE).insert(row);
      return res.status(201).json({ success: true, id });
    } catch (err: any) {
      const max = await getMaxUploadMb().catch(() => 60);
      const msg = /maxFileSize|size/i.test(err.message) ? `Image too large (max ${max}MB).` : (err.message || 'Create failed.');
      return res.status(500).json({ success: false, message: msg });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
