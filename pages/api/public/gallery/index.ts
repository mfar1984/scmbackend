import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Public: list active gallery albums with their photos.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const albums = await db('web_gallery_albums').where({ status: 'Active' })
      .select('id', 'title', 'subtitle', 'category', 'year', 'description',
        db.raw("(cover_path IS NOT NULL AND cover_path <> '') AS has_cover"))
      .orderBy('sort_order', 'asc').orderBy('id', 'desc');

    const ids = albums.map((a: any) => a.id);
    let photos: any[] = [];
    if (ids.length) {
      photos = await db('web_gallery_photos').whereIn('album_id', ids)
        .select('id', 'album_id', 'caption', 'detail')
        .orderBy('sort_order', 'asc').orderBy('id', 'asc');
    }
    const byAlbum: Record<number, any[]> = {};
    photos.forEach(p => { (byAlbum[p.album_id] = byAlbum[p.album_id] || []).push(p); });

    const data = albums.map((a: any) => ({
      ...a,
      photo_count: (byAlbum[a.id] || []).length,
      photos: byAlbum[a.id] || [],
    }));
    return res.status(200).json({ success: true, data });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
