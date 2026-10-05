import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import db from '@/lib/db';
import { resolveUpload } from '@/lib/uploads';

// Public: serve a gallery photo image (only if its album is Active).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed.');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const photoId = parseInt(req.query.photoId as string);
  if (isNaN(photoId)) return res.status(400).send('Invalid ID.');
  try {
    const row = await db('web_gallery_photos as p')
      .join('web_gallery_albums as a', 'a.id', 'p.album_id')
      .where('p.id', photoId).andWhere('a.status', 'Active')
      .select('p.file_path', 'p.mime_type').first();
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
