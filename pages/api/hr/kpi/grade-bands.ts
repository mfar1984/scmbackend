import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { guardCrud } from '@/lib/serverPermissions';
import { recycleFromReq, pickLabel } from '@/lib/recycleBin';

const TABLE = 'hr_kpi_grade_bands';
const num = (v: any) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await guardCrud(req, res, 'hr.kpi.grade_bands'))) return;
  if (req.method === 'GET') {
    try {
      const rows = await db(TABLE).orderBy('min_score', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }
  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.grade?.trim()) return res.status(400).json({ success: false, message: 'Grade is required.' });
    try {
      const dup = await db(TABLE).where({ grade: b.grade.trim() }).first();
      if (dup) return res.status(409).json({ success: false, message: 'Grade already exists.' });
      const [id] = await db(TABLE).insert({
        grade: b.grade.trim(), label: b.label?.trim() || null,
        min_score: num(b.min_score), max_score: num(b.max_score),
        bonus_multiplier: num(b.bonus_multiplier), color: b.color || '#3b82f6', status: b.status || 'Active',
      });
      return res.status(201).json({ success: true, id });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }
  if (req.method === 'PUT') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const b = req.body || {};
    try {
      await db(TABLE).where({ id }).update({
        grade: b.grade?.trim(), label: b.label?.trim() || null,
        min_score: num(b.min_score), max_score: num(b.max_score),
        bonus_multiplier: num(b.bonus_multiplier), color: b.color || '#3b82f6', status: b.status || 'Active',
      });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }
  if (req.method === 'DELETE') {
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    try {
      const row = await db(TABLE).where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Not found.' });
      await recycleFromReq(req, { moduleKey: 'hr.kpi.grade_bands', moduleLabel: 'KPI Grade Bands', table: TABLE, id, label: `Grade Band: ${pickLabel(row, ['grade', 'label'], id)}` });
      return res.status(200).json({ success: true });
    }
    catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }
  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
