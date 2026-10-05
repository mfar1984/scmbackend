import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { UPLOAD_ROOT } from '@/lib/uploads';

// Serves public, inline assets (e.g. SEO/OG images, notification sounds) from
// safe upload subfolders. Restricted to whitelisted top-level folders.
const PUBLIC_DIRS = ['seo', 'sounds', 'news'];
const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4',
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed.');

  const parts = (req.query.path as string[] | undefined) || [];
  if (parts.length < 2 || !PUBLIC_DIRS.includes(parts[0]) || parts.includes('..')) {
    return res.status(404).send('Not found.');
  }

  const rel = parts.join('/');
  const abs = path.join(UPLOAD_ROOT, rel);
  // Ensure the resolved path stays inside the uploads root.
  if (!abs.startsWith(UPLOAD_ROOT) || !fs.existsSync(abs)) return res.status(404).send('Not found.');

  const ext = path.extname(abs).toLowerCase();
  const mime = MIME[ext];
  if (!mime) return res.status(404).send('Not found.');

  const stat = fs.statSync(abs);
  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return fs.createReadStream(abs).pipe(res);
}
