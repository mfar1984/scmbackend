import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { parseUpload, saveUploadedFile, getMaxUploadMb } from '@/lib/uploads';
import { getAuth, hasPermission } from '@/lib/serverPermissions';

// Add a photo to an album (POST, multipart). One file per request.
export const config = { api: { bodyParser: false } };

const PHOTOS = 'web_gallery_photos';
const ALBUMS = 'web_gallery_albums';
const PERM = 'web.resources.gallery.albums';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const albumId = parseInt(req.query.id as string);
  if (isNaN(albumId)) return res.status(400).json({ success: false, message: 'Invalid album ID.' });

  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  // Adding a photo is an Update on the album collection.
  const auth = await getAuth(req);
  if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  if (!(await hasPermission(auth, PERM, 'Update'))) {
    return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
  }

  try {
    const album = await db(ALBUMS).where({ id: albumId }).first();
    if (!album) return res.status(404).json({ success: false, message: 'Album not found.' });

    const maxMb = await getMaxUploadMb();
    const { fields, file } = await parseUpload(req, maxMb);
    if (!file) return res.status(400).json({ success: false, message: 'Please choose an image to upload.' });

    const relPath = saveUploadedFile(file.tmpPath, 'gallery', file.originalName);
    const maxOrder = await db(PHOTOS).where({ album_id: albumId }).max({ m: 'sort_order' }).first();
    const [id] = await db(PHOTOS).insert({
      album_id: albumId,
      caption: fields.caption?.trim() || null,
      detail: fields.detail?.trim() || null,
      file_path: relPath,
      file_name: file.originalName,
      mime_type: file.mime,
      sort_order: (Number((maxOrder as any)?.m) || 0) + 1,
    });
    return res.status(201).json({ success: true, id });
  } catch (err: any) {
    const max = await getMaxUploadMb().catch(() => 60);
    const msg = /maxFileSize|size/i.test(err.message) ? `Image too large (max ${max}MB).` : (err.message || 'Upload failed.');
    return res.status(500).json({ success: false, message: msg });
  }
}
