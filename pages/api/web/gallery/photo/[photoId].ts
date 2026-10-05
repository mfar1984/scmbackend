import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import db from '@/lib/db';
import { deleteUpload, resolveUpload } from '@/lib/uploads';
import { getAuth, hasPermission } from '@/lib/serverPermissions';

// Single gallery photo: GET ?image=1 serves the file (admin preview),
// PATCH updates caption/detail, DELETE removes the photo + file.
export const config = { api: { bodyParser: true } };

const PHOTOS = 'web_gallery_photos';
const PERM = 'web.resources.gallery.albums';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const photoId = parseInt(req.query.photoId as string);
  if (isNaN(photoId)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  if (req.method === 'PATCH' || req.method === 'DELETE') {
    const auth = await getAuth(req);
    if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    const perm = req.method === 'DELETE' ? 'Delete' : 'Update';
    if (!(await hasPermission(auth, PERM, perm))) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
  }

  if (req.method === 'GET' && req.query.image) {
    try {
      const row = await db(PHOTOS).where({ id: photoId }).select('file_path', 'mime_type').first();
      if (!row?.file_path) return res.status(404).send('Not found.');
      const abs = resolveUpload(row.file_path);
      if (!fs.existsSync(abs)) return res.status(404).send('File missing.');
      const stat = fs.statSync(abs);
      res.setHeader('Content-Type', row.mime_type || 'image/jpeg');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return fs.createReadStream(abs).pipe(res);
    } catch { return res.status(500).send('Error.'); }
  }

  if (req.method === 'PATCH') {
    try {
      const b = req.body || {};
      const upd: Record<string, any> = {};
      if (b.caption !== undefined) upd.caption = String(b.caption).trim() || null;
      if (b.detail !== undefined) upd.detail = String(b.detail).trim() || null;
      if (b.sort_order !== undefined) upd.sort_order = parseInt(b.sort_order) || 0;
      if (Object.keys(upd).length) await db(PHOTOS).where({ id: photoId }).update(upd);
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'DELETE') {
    try {
      const row = await db(PHOTOS).where({ id: photoId }).first();
      deleteUpload(row?.file_path);
      await db(PHOTOS).where({ id: photoId }).delete();
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
