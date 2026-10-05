import type { NextApiRequest, NextApiResponse } from 'next';
import { parseUpload, saveUploadedFile, getMaxUploadMb } from '@/lib/uploads';
import { getAuth, hasPermission } from '@/lib/serverPermissions';

// multipart/form-data (single file under field "file")
export const config = { api: { bodyParser: false } };

const PERM = 'web.news';
const IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  // Allow if the user can create or update News.
  const auth = await getAuth(req);
  if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  const allowed = (await hasPermission(auth, PERM, 'Create')) || (await hasPermission(auth, PERM, 'Update'));
  if (!allowed) return res.status(403).json({ success: false, message: 'You do not have permission to upload.' });

  try {
    const maxMb = await getMaxUploadMb();
    const { file } = await parseUpload(req, maxMb);
    if (!file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    if (!IMAGE_MIME.includes(file.mime)) {
      return res.status(400).json({ success: false, message: 'Only image files are allowed (PNG, JPG, WEBP, GIF, SVG).' });
    }
    const relPath = saveUploadedFile(file.tmpPath, 'news', file.originalName);
    // Public URL served by /api/public/asset/<relPath> (news folder is whitelisted).
    return res.status(201).json({ success: true, url: `/api/public/asset/${relPath}`, name: file.originalName });
  } catch (err: any) {
    const max = await getMaxUploadMb().catch(() => 60);
    const msg = /maxFileSize|size/i.test(err.message) ? `Image too large (max ${max}MB).` : (err.message || 'Upload failed.');
    return res.status(500).json({ success: false, message: msg });
  }
}
