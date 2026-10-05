import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import db from '@/lib/db';
import { parseUpload, saveUploadedFile, deleteUpload, resolveUpload, getMaxUploadMb } from '@/lib/uploads';
import { getAuth, hasPermission } from '@/lib/serverPermissions';
import { recycleDelete } from '@/lib/recycleBin';

export const config = { api: { bodyParser: false } };

const TABLE = 'web_circulars';
const PERM = 'web.resources.circulars';

function readJson(req: NextApiRequest): Promise<any> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', c => { data += c; });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}
const ymd = (d: any): string | null => {
  if (!d) return null;
  if (typeof d === 'string') return d.slice(0, 10);
  if (d instanceof Date) return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
  return null;
};

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

  // admin download / preview
  if (req.method === 'GET' && req.query.file) {
    try {
      const row = await db(TABLE).where({ id }).select('file_path', 'file_name', 'mime_type').first();
      if (!row?.file_path) return res.status(404).send('Not found.');
      const abs = resolveUpload(row.file_path);
      if (!fs.existsSync(abs)) return res.status(404).send('File missing.');
      const stat = fs.statSync(abs);
      res.setHeader('Content-Type', row.mime_type || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${(row.file_name || 'circular.pdf').replace(/"/g, '')}"`);
      res.setHeader('Content-Length', stat.size);
      return fs.createReadStream(abs).pipe(res);
    } catch { return res.status(500).send('Error.'); }
  }

  if (req.method === 'GET') {
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      return res.status(200).json({ success: true, data: { ...row, release_date: ymd(row.release_date), effective_date: ymd(row.effective_date), has_file: !!row.file_path } });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'PUT') {
    const ct = req.headers['content-type'] || '';
    try {
      const exists = await db(TABLE).where({ id }).first();
      if (!exists) return res.status(404).json({ success: false, message: 'Not found.' });

      let fields: Record<string, string> = {};
      let newRelPath: string | null = null;
      let newFile: any = null;
      if (ct.includes('multipart/form-data')) {
        const maxMb = await getMaxUploadMb();
        const parsed = await parseUpload(req, maxMb);
        fields = parsed.fields;
        if (parsed.file) { newFile = parsed.file; newRelPath = saveUploadedFile(parsed.file.tmpPath, 'circulars', parsed.file.originalName); }
      } else {
        fields = await readJson(req);
      }

      const upd: Record<string, any> = {};
      if (fields.no !== undefined) upd.no = fields.no?.trim() || exists.no;
      if (fields.title !== undefined) upd.title = fields.title?.trim() || exists.title;
      if (fields.release_date !== undefined) upd.release_date = fields.release_date?.trim() || null;
      if (fields.effective_date !== undefined) upd.effective_date = fields.effective_date?.trim() || null;
      if (fields.year !== undefined) upd.year = parseInt(fields.year) || exists.year;
      if (fields.status !== undefined) upd.status = fields.status;
      if (fields.sort_order !== undefined) upd.sort_order = parseInt(fields.sort_order) || 0;
      if (newRelPath && newFile) {
        deleteUpload(exists.file_path);
        upd.file_path = newRelPath;
        upd.file_name = newFile.originalName;
        upd.mime_type = newFile.mime;
      }
      await db(TABLE).where({ id }).update(upd);
      return res.status(200).json({ success: true });
    } catch (err: any) {
      const max = await getMaxUploadMb().catch(() => 60);
      const msg = /maxFileSize|size/i.test(err.message) ? `File too large (max ${max}MB).` : (err.message || 'Update failed.');
      return res.status(500).json({ success: false, message: msg });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      const auth = await getAuth(req);
      await recycleDelete({
        moduleKey: PERM, moduleLabel: 'Circulars', table: TABLE, id,
        label: `Circular: No. ${row.no} — ${row.title}`,
        files: [row.file_path],
        auth, req,
      });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
