import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getAuth, hasPermission } from '@/lib/serverPermissions';
import { recycleDelete } from '@/lib/recycleBin';
import { logAudit } from '@/lib/logger';

const VALID_STATUS = ['Pending', 'On Progress', 'Approved', 'Active', 'Rejected'];
const MODULE = 'app.procurement';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  if (req.method === 'GET') {
    try {
      const row = await db('supplier_registrations').where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      return res.status(200).json({ success: true, data: row });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Update status
  if (req.method === 'PATCH' || req.method === 'PUT') {
    const { status } = req.body || {};
    if (!VALID_STATUS.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    // Permission: Rejected → Reject; Approved/Active → Approve; else Update.
    const auth = await getAuth(req);
    if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    const need = status === 'Rejected' ? 'Reject' : (status === 'Approved' || status === 'Active') ? 'Approve' : 'Update';
    if (!(await hasPermission(auth, MODULE, need))) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
    try {
      const exists = await db('supplier_registrations').where({ id }).first();
      if (!exists) return res.status(404).json({ success: false, message: 'Not found.' });
      await db('supplier_registrations').where({ id }).update({ status });
      const act = status === 'Rejected' ? 'REJECT' : (status === 'Approved' || status === 'Active') ? 'APPROVE' : 'UPDATE';
      await logAudit(req, {
        action: act, module: 'Procurement',
        target: `Supplier: ${exists.company_name || `#${id}`}`,
        description: `Supplier registration ${exists.company_name || `#${id}`} set to ${status}`,
        before: { status: exists.status }, after: { status },
      });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === 'DELETE') {
    const auth = await getAuth(req);
    if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    if (!(await hasPermission(auth, MODULE, 'Delete'))) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
    try {
      const row = await db('supplier_registrations').where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      await recycleDelete({
        moduleKey: MODULE,
        moduleLabel: 'Procurement',
        table: 'supplier_registrations',
        id,
        label: `Supplier: ${row.company_name || row.name || row.email || `#${id}`}`,
        auth, req,
      });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
