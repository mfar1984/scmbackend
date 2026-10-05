import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import db from '@/lib/db';
import { parseUpload, saveUploadedFile, deleteUpload, resolveUpload, getMaxUploadMb } from '@/lib/uploads';
import { getAuth, hasPermission } from '@/lib/serverPermissions';
import { recycleDelete } from '@/lib/recycleBin';

// Single album: GET (album + its photos), PUT (update + optional new cover),
// DELETE (remove album, its photos and files), and ?cover=1 to serve cover.
export const config = { api: { bodyParser: false } };

const TABLE = 'web_gallery_albums';
const PHOTOS = 'web_gallery_photos';
const PERM = 'web.resources.gallery.albums';

function readJson(req: NextApiRequest): Promise<any> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', c => { data += c; });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  if (req.method === 'PUT' || req.method === 'DELETE') {
    const auth = await getAuth(req);
    if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    const perm = req.method === 'DELETE' ? 'Delete' : 'Update';
    if (!(await hasPermission(auth, PERM, perm))) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
  }

  // serve cover image
  if (req.method === 'GET' && req.query.cover) {
    try {
      const row = await db(TABLE).where({ id }).select('cover_path').first();
      if (!row?.cover_path) return res.status(404).send('Not found.');
      const abs = resolveUpload(row.cover_path);
      if (!fs.existsSync(abs)) return res.status(404).send('File missing.');
      const stat = fs.statSync(abs);
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return fs.createReadStream(abs).pipe(res);
    } catch { return res.status(500).send('Error.'); }
  }

  if (req.method === 'GET') {
    try {
      const album = await db(TABLE).where({ id }).first();
      if (!album) return res.status(404).json({ success: false, message: 'Not found.' });
      const photos = await db(PHOTOS).where({ album_id: id }).orderBy('sort_order', 'asc').orderBy('id', 'asc');
      return res.status(200).json({ success: true, data: { ...album, has_cover: !!album.cover_path, photos } });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'PUT') {
    const ct = req.headers['content-type'] || '';
    try {
      const exists = await db(TABLE).where({ id }).first();
      if (!exists) return res.status(404).json({ success: false, message: 'Not found.' });

      let fields: Record<string, any> = {};
      let newRelPath: string | null = null;
      let newName: string | null = null;

      if (ct.includes('multipart/form-data')) {
        const maxMb = await getMaxUploadMb();
        const parsed = await parseUpload(req, maxMb);
        fields = parsed.fields;
        if (parsed.file) { newName = parsed.file.originalName; newRelPath = saveUploadedFile(parsed.file.tmpPath, 'gallery', parsed.file.originalName); }
      } else {
        fields = await readJson(req);
      }

      const upd: Record<string, any> = {};
      if (fields.title !== undefined) upd.title = fields.title?.trim() || exists.title;
      if (fields.subtitle !== undefined) upd.subtitle = fields.subtitle?.trim() || null;
      if (fields.category !== undefined) upd.category = fields.category?.trim() || 'Projects';
      if (fields.year !== undefined) upd.year = fields.year?.trim() || null;
      if (fields.description !== undefined) upd.description = fields.description?.trim() || null;
      if (fields.status !== undefined) upd.status = fields.status;
      if (fields.sort_order !== undefined) upd.sort_order = parseInt(fields.sort_order) || 0;
      if (newRelPath) {
        deleteUpload(exists.cover_path);
        upd.cover_path = newRelPath;
        upd.cover_name = newName;
      }
      await db(TABLE).where({ id }).update(upd);
      return res.status(200).json({ success: true });
    } catch (err: any) {
      const max = await getMaxUploadMb().catch(() => 60);
      const msg = /maxFileSize|size/i.test(err.message) ? `Image too large (max ${max}MB).` : (err.message || 'Update failed.');
      return res.status(500).json({ success: false, message: msg });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const album = await db(TABLE).where({ id }).first();
      if (!album) return res.status(404).json({ success: false, message: 'Not found.' });
      const photos = await db(PHOTOS).where({ album_id: id });
      const files = [album.cover_path, ...photos.map((p: any) => p.file_path)];
      const auth = await getAuth(req);
      await recycleDelete({
        moduleKey: 'web.resources.gallery.albums', moduleLabel: 'Gallery', table: TABLE, id,
        label: `Album: ${album.title || `#${id}`}`,
        children: [{ table: PHOTOS, rows: photos }],
        files,
        auth, req,
      });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
