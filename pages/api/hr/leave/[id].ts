import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { applyApprovalAction } from '@/lib/approvalFlow';
import { getAuth, hasPermission } from '@/lib/serverPermissions';
import { recycleDelete } from '@/lib/recycleBin';

const VALID = ['Pending', 'Approved', 'Rejected'];
const MODULE = 'hr.leave.application';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  // serve supporting document: ?doc=1
  if (req.method === 'GET' && req.query.doc) {
    try {
      const row = await db('hr_leave_applications').where({ id }).select('document', 'document_name').first();
      const dataUrl = row?.document;
      if (!dataUrl || !String(dataUrl).startsWith('data:')) return res.status(404).send('Not found.');
      const m = String(dataUrl).match(/^data:([^;]+);base64,([\s\S]*)$/);
      if (!m) return res.status(422).send('Invalid.');
      const buf = Buffer.from(m[2], 'base64');
      res.setHeader('Content-Type', m[1]);
      res.setHeader('Content-Disposition', `inline; filename="${(row.document_name || 'document').replace(/"/g, '')}"`);
      res.setHeader('Content-Length', buf.length);
      return res.status(200).send(buf);
    } catch { return res.status(500).send('Error.'); }
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const { status, remarks } = req.body || {};
    if (!VALID.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });
    const auth = await getAuth(req);
    if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    const need = status === 'Rejected' ? 'Reject' : status === 'Approved' ? 'Approve' : 'Update';
    if (!(await hasPermission(auth, MODULE, need))) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
    try {
      if (status === 'Approved' || status === 'Rejected') {
        const r = await applyApprovalAction(req, 'leave', id, status, remarks);
        return res.status(r.status).json(r.body);
      }
      // reset to Pending (admin override)
      await db('hr_leave_applications').where({ id }).update({ status: 'Pending', current_level: 0 });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'DELETE') {
    const auth = await getAuth(req);
    if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    if (!(await hasPermission(auth, MODULE, 'Delete'))) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
    try {
      const row = await db('hr_leave_applications').where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      await recycleDelete({ moduleKey: MODULE, moduleLabel: 'Leave Application', table: 'hr_leave_applications', id, label: `Leave: ${row.reference_no || `#${id}`}`, auth, req });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
