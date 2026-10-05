import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import db from '@/lib/db';
import { resolveUpload } from '@/lib/uploads';

// Public: serve an active album's cover image.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed.');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).send('Invalid ID.');
  try {
    const row = await db('web_gallery_albums').where({ id, status: 'Active' }).select('cover_path').first();
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
