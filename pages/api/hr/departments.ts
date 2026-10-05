import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';
import { recycleFromReq, pickLabel } from '@/lib/recycleBin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'hr.employee.settings.departments'))) return;

  // ── GET ──
  if (req.method === 'GET') {
    try {
      const rows = await db('hr_departments').orderBy('name', 'asc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── POST ──
  if (req.method === 'POST') {
    const { name, code, description, status } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Department name is required.' });
    try {
      const dup = await db('hr_departments').where({ name: name.trim() }).first();
      if (dup) return res.status(409).json({ success: false, message: 'Department already exists.' });
      const [id] = await db('hr_departments').insert({
        name: name.trim(), code: code?.trim() || null,
        description: description?.trim() || null, status: status || 'Active',
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── PUT ?id= ──
  if (req.method === 'PUT') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const { name, code, description, status } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Department name is required.' });
    try {
      const dup = await db('hr_departments').where({ name: name.trim() }).whereNot({ id }).first();
      if (dup) return res.status(409).json({ success: false, message: 'Department name already exists.' });
      await db('hr_departments').where({ id }).update({
        name: name.trim(), code: code?.trim() || null,
        description: description?.trim() || null, status: status || 'Active',
      });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── DELETE ?id= ──
  if (req.method === 'DELETE') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    try {
      const row = await db('hr_departments').where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      await recycleFromReq(req, { moduleKey: 'hr.employee.settings.departments', moduleLabel: 'Departments', table: 'hr_departments', id, label: `Department: ${pickLabel(row, ['name'], id)}` });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
