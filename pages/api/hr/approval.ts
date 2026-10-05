import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { recycleFromReq } from '@/lib/recycleBin';

const TABLE = 'hr_approval_workflow';
const VALID_MODULES = ['leave', 'claim', 'overtime', 'expenses'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ── GET ?module= (optional) — joins the administrator account name ──
  if (req.method === 'GET') {
    try {
      const { module: mod } = req.query;
      let query = db(`${TABLE} as w`)
        .select('w.*', 'u.name as approver_name', 'u.email as approver_email')
        .leftJoin('users as u', 'u.id', 'w.approver_user_id')
        .orderBy([{ column: 'w.module' }, { column: 'w.level' }]);
      if (mod) query = query.where('w.module', mod);
      const rows = await query;
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  // ── POST ──
  if (req.method === 'POST') {
    const { module: mod, level, approver_user_id } = req.body;
    if (!VALID_MODULES.includes(mod)) {
      return res.status(400).json({ success: false, message: 'Invalid module.' });
    }
    if (!approver_user_id) return res.status(400).json({ success: false, message: 'Approver account is required.' });
    try {
      // store the account's role name as a snapshot label too
      const user = await db('users').select('users.name', 'roles.name as role')
        .leftJoin('roles', 'roles.id', 'users.role_id')
        .where('users.id', approver_user_id).first();
      const [id] = await db(TABLE).insert({
        module: mod, level: level || 1,
        approver_user_id,
        approver_role: user?.role || user?.name || '',
        status: 'Active',
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  // ── PUT ?id= ──
  if (req.method === 'PUT') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const { level, approver_user_id, status } = req.body;
    if (!approver_user_id) return res.status(400).json({ success: false, message: 'Approver account is required.' });
    try {
      const user = await db('users').select('users.name', 'roles.name as role')
        .leftJoin('roles', 'roles.id', 'users.role_id')
        .where('users.id', approver_user_id).first();
      await db(TABLE).where({ id }).update({
        level: level || 1,
        approver_user_id,
        approver_role: user?.role || user?.name || '',
        status: status || 'Active',
      });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  // ── DELETE ?id= ──
  if (req.method === 'DELETE') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      const modKey = `hr.${row.module}.settings.approval`;
      await recycleFromReq(req, { moduleKey: modKey, moduleLabel: 'Approval Workflow', table: TABLE, id, label: `Approval (${row.module} L${row.level}): ${row.approver_role || ''}` });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
