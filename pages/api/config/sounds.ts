import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import db from '@/lib/db';
import { parseUpload, saveUploadedFile, UPLOAD_ROOT } from '@/lib/uploads';

export const config = { api: { bodyParser: false } };

const SOUND_EXT = ['.mp3', '.wav', '.ogg', '.m4a'];
const SOUNDS_DIR = path.join(UPLOAD_ROOT, 'sounds');

function listSounds(): { name: string; file: string; url: string }[] {
  if (!fs.existsSync(SOUNDS_DIR)) return [];
  return fs.readdirSync(SOUNDS_DIR)
    .filter(f => SOUND_EXT.includes(path.extname(f).toLowerCase()))
    .map(f => ({
      // Strip the "<timestamp>_<rand>_" prefix added on upload for a friendly label.
      name: f.replace(/^\d+_[a-z0-9]+_/i, ''),
      file: f,
      url: `/api/public/asset/sounds/${f}`,
    }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET — list uploaded sounds + the currently selected one
  if (req.method === 'GET') {
    try {
      const sel = await db('config_settings').where({ module: 'branding', key: 'notif_sound' }).first();
      return res.status(200).json({ success: true, data: listSounds(), selected: sel?.value || '' });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  // POST — upload a new sound file
  if (req.method === 'POST') {
    try {
      const { file } = await parseUpload(req, 5); // 5MB cap
      if (!file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
      const ext = path.extname(file.originalName).toLowerCase();
      if (!SOUND_EXT.includes(ext)) return res.status(400).json({ success: false, message: 'Please upload an MP3, WAV, OGG or M4A file.' });
      const rel = saveUploadedFile(file.tmpPath, 'sounds', file.originalName);
      const fileName = path.basename(rel);
      return res.status(201).json({ success: true, file: fileName, url: `/api/public/asset/sounds/${fileName}` });
    } catch (err: any) {
      const msg = /maxFileSize|size/i.test(err.message || '') ? 'Sound file too large (max 5MB).' : (err.message || 'Upload failed.');
      return res.status(500).json({ success: false, message: msg });
    }
  }

  // DELETE — remove a sound file (?file=...)
  if (req.method === 'DELETE') {
    try {
      const file = String(req.query.file || '');
      if (!file || file.includes('/') || file.includes('..')) return res.status(400).json({ success: false, message: 'Invalid file.' });
      const abs = path.join(SOUNDS_DIR, file);
      if (abs.startsWith(SOUNDS_DIR) && fs.existsSync(abs)) fs.unlinkSync(abs);
      // If the deleted sound was selected, clear the selection.
      const sel = await db('config_settings').where({ module: 'branding', key: 'notif_sound' }).first();
      if (sel?.value === file) {
        await db.raw("INSERT INTO `config_settings` (`module`,`key`,`value`) VALUES ('branding','notif_sound','') ON DUPLICATE KEY UPDATE `value`=''");
      }
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
