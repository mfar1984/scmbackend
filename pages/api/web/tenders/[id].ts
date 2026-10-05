import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import db from '@/lib/db';
import { parseUpload, saveUploadedFile, deleteUpload, resolveUpload, humanSize, getMaxUploadMb } from '@/lib/uploads';
import { getAuth, hasPermission } from '@/lib/serverPermissions';
import { recycleDelete } from '@/lib/recycleBin';

export const config = { api: { bodyParser: false } };

const TABLE = 'web_tenders';

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

  // Mutations require permission; GET (incl. ?file=1 download) stays open to readers.
  if (req.method === 'PUT' || req.method === 'DELETE') {
    const auth = await getAuth(req);
    if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    const perm = req.method === 'DELETE' ? 'Delete' : 'Update';
    if (!(await hasPermission(auth, 'web.business.tender.tenders', perm))) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
  }

  if (req.method === 'GET' && req.query.file) {
    try {
      const row = await db(TABLE).where({ id }).select('file_path', 'file_name', 'mime_type').first();
      if (!row?.file_path) return res.status(404).send('Not found.');
      const abs = resolveUpload(row.file_path);
      if (!fs.existsSync(abs)) return res.status(404).send('File missing.');
      const stat = fs.statSync(abs);
      res.setHeader('Content-Type', row.mime_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${(row.file_name || 'tender').replace(/"/g, '')}"`);
      res.setHeader('Content-Length', stat.size);
      return fs.createReadStream(abs).pipe(res);
    } catch { return res.status(500).send('Error.'); }
  }

  if (req.method === 'GET') {
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      const logs = await db('web_download_logs').where({ download_id: id, kind: 'tender' }).orderBy('id', 'desc').limit(100);
      return res.status(200).json({ success: true, data: { ...row, has_file: !!row.file_path, logs } });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'PUT') {
    const ct = req.headers['content-type'] || '';
    try {
      const exists = await db(TABLE).where({ id }).first();
      if (!exists) return res.status(404).json({ success: false, message: 'Not found.' });

      let fields: Record<string, any> = {};
      let newRelPath: string | null = null;
      let newFile: any = null;

      if (ct.includes('multipart/form-data')) {
        const maxMb = await getMaxUploadMb();
        const parsed = await parseUpload(req, maxMb);
        fields = parsed.fields;
        if (parsed.file) { newFile = parsed.file; newRelPath = saveUploadedFile(parsed.file.tmpPath, 'tenders', parsed.file.originalName); }
      } else {
        fields = await readJson(req);
      }

      const upd: Record<string, any> = {};
      if (fields.ref_no !== undefined) upd.ref_no = fields.ref_no?.trim() || null;
      if (fields.title !== undefined) upd.title = fields.title?.trim() || exists.title;
      if (fields.category !== undefined) upd.category = fields.category?.trim() || 'Network Infrastructure';
      if (fields.cat_icon !== undefined) upd.cat_icon = fields.cat_icon?.trim() || 'bi-ethernet';
      if (fields.sector !== undefined) upd.sector = fields.sector || 'Government';
      if (fields.value !== undefined) upd.value = fields.value?.trim() || null;
      if (fields.issued_date !== undefined) upd.issued_date = fields.issued_date?.trim() || null;
      if (fields.deadline !== undefined) upd.deadline = fields.deadline?.trim() || null;
      if (fields.tender_status !== undefined) upd.tender_status = fields.tender_status || 'open';
      if (fields.description !== undefined) upd.description = fields.description?.trim() || null;
      if (fields.require_email !== undefined) { const v = String(fields.require_email); upd.require_email = (v === 'true' || v === '1') ? 1 : 0; }
      if (fields.status !== undefined) upd.status = fields.status;
      if (fields.sort_order !== undefined) upd.sort_order = parseInt(fields.sort_order) || 0;
      if (newRelPath && newFile) {
        deleteUpload(exists.file_path);
        upd.file_path = newRelPath;
        upd.file_name = newFile.originalName;
        upd.mime_type = newFile.mime;
        upd.file_size = humanSize(newFile.size);
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
      const logs = await db('web_download_logs').where({ download_id: id, kind: 'tender' });
      const auth = await getAuth(req);
      await recycleDelete({
        moduleKey: 'web.business.tender.tenders', moduleLabel: 'Tender', table: TABLE, id,
        label: `Tender: ${row.title || row.ref_no || `#${id}`}`,
        children: [{ table: 'web_download_logs', rows: logs }],
        files: [row.file_path],
        auth, req,
      });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
