import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { parseUpload, saveUploadedFile } from '@/lib/uploads';

export const config = { api: { bodyParser: false } };

const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Uploads an OG/social share image to uploads/seo and returns its public URL.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  try {
    const { file } = await parseUpload(req, 5); // 5MB cap for images
    if (!file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    if (!IMAGE_MIME.includes(file.mime)) return res.status(400).json({ success: false, message: 'Please upload a JPG, PNG, WebP or GIF image.' });

    const relPath = saveUploadedFile(file.tmpPath, 'seo', file.originalName);

    // Build an absolute URL using the configured site/back-end base.
    const gen = await db('config_settings').where({ module: 'general', key: 'site_url' }).first();
    const backendBase = (process.env.NEXT_PUBLIC_BACKEND_API_URL || `http://${req.headers.host}`).replace(/\/$/, '');
    const url = `${backendBase}/api/public/asset/${relPath}`;

    return res.status(200).json({ success: true, url });
  } catch (err: any) {
    const msg = /maxFileSize|size/i.test(err.message || '') ? 'Image too large (max 5MB).' : (err.message || 'Upload failed.');
    return res.status(500).json({ success: false, message: msg });
  }
}
