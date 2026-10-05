import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { applyApprovalAction } from '@/lib/approvalFlow';
import { getAuth, hasPermission } from '@/lib/serverPermissions';
import { recycleDelete } from '@/lib/recycleBin';

const VALID = ['Pending', 'Approved', 'Rejected'];
const MODULE = 'hr.expenses.application';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  // serve header receipt: ?doc=1
  if (req.method === 'GET' && req.query.doc) {
    try {
      const row = await db('hr_expense_applications').where({ id }).select('receipt', 'receipt_name').first();
      const dataUrl = row?.receipt;
      if (!dataUrl || !String(dataUrl).startsWith('data:')) return res.status(404).send('Not found.');
      const m = String(dataUrl).match(/^data:([^;]+);base64,([\s\S]*)$/);
      if (!m) return res.status(422).send('Invalid.');
      const buf = Buffer.from(m[2], 'base64');
      res.setHeader('Content-Type', m[1]);
      res.setHeader('Content-Disposition', `inline; filename="${(row.receipt_name || 'receipt').replace(/"/g, '')}"`);
      res.setHeader('Content-Length', buf.length);
      return res.status(200).send(buf);
    } catch (err: any) { return res.status(500).send('Error.'); }
  }

  // single expense with items
  if (req.method === 'GET') {
    try {
      const exp = await db('hr_expense_applications as a')
        .select('a.*', 'e.full_name as employee_name', 'e.employee_id as employee_code', 'c.name as category_name',
                db.raw("(a.receipt LIKE 'data:%') AS has_receipt"))
        .leftJoin('hr_employees as e', 'e.id', 'a.employee_id')
        .leftJoin('hr_expense_categories as c', 'c.id', 'a.category_id')
        .where('a.id', id).first();
      if (!exp) return res.status(404).json({ success: false, message: 'Not found.' });
      delete exp.receipt;
      const items = await db('hr_expense_items').where({ expense_id: id }).orderBy('id', 'asc');
      return res.status(200).json({ success: true, data: { ...exp, items } });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
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
        const r = await applyApprovalAction(req, 'expenses', id, status, remarks);
        return res.status(r.status).json(r.body);
      }
      await db('hr_expense_applications').where({ id }).update({ status: 'Pending', current_level: 0 });
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
      const row = await db('hr_expense_applications').where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      const items = await db('hr_expense_items').where({ expense_id: id });
      await recycleDelete({
        moduleKey: MODULE, moduleLabel: 'Expenses Application', table: 'hr_expense_applications', id,
        label: `Expense: ${row.reference_no || `#${id}`}`,
        children: [{ table: 'hr_expense_items', rows: items }],
        auth, req,
      });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
