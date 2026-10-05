import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getAuth, hasAnyPermission } from '@/lib/serverPermissions';
import { recycleDelete } from '@/lib/recycleBin';

const TABLE = 'hr_kpi_assignments';
const num = (v: any) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  // Scoring (PATCH) is reachable from both Assignments and Reviews pages.
  if (req.method === 'PATCH' || req.method === 'DELETE') {
    const auth = await getAuth(req);
    if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    const perm = req.method === 'DELETE' ? 'Delete' : 'Update';
    const mods = req.method === 'DELETE' ? ['hr.kpi.assignments'] : ['hr.kpi.assignments', 'hr.kpi.reviews'];
    if (!(await hasAnyPermission(auth, mods, perm))) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
  }

  // ── GET: assignment + competencies (from template) merged with any saved scores ──
  if (req.method === 'GET') {
    try {
      const a = await db(`${TABLE} as a`)
        .select('a.*', 'e.full_name as employee_name', 'e.employee_id as employee_code',
          'p.name as period_name', 't.name as template_name')
        .leftJoin('hr_employees as e', 'e.id', 'a.employee_id')
        .leftJoin('hr_kpi_periods as p', 'p.id', 'a.period_id')
        .leftJoin('hr_kpi_templates as t', 't.id', 'a.template_id')
        .where('a.id', id).first();
      if (!a) return res.status(404).json({ success: false, message: 'Assignment not found.' });

      const saved = await db('hr_kpi_review_items').where({ assignment_id: id });
      let items: any[];
      if (saved.length > 0) {
        items = saved;
      } else {
        const tplItems = await db('hr_kpi_template_items').where({ template_id: a.template_id }).orderBy('sort_order', 'asc');
        items = tplItems.map(ti => ({ competency_name: ti.competency_name, weight: ti.weight, score: 0, comments: '' }));
      }
      const result = await db('hr_kpi_results').where({ assignment_id: id }).first();
      return res.status(200).json({ success: true, data: { ...a, items, result } });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  // ── PATCH: save review scores → compute final score → map to grade band → write result ──
  if (req.method === 'PATCH') {
    const b = req.body || {};
    const items = Array.isArray(b.items) ? b.items : [];
    if (items.length === 0) return res.status(400).json({ success: false, message: 'No competencies to score.' });
    try {
      const a = await db(TABLE).where({ id }).first();
      if (!a) return res.status(404).json({ success: false, message: 'Assignment not found.' });

      // weighted score = sum(score * weight) / sum(weight)
      let weightSum = 0, weighted = 0;
      for (const it of items) { const w = num(it.weight); weightSum += w; weighted += num(it.score) * w; }
      const finalScore = weightSum > 0 ? r2(weighted / weightSum) : 0;

      // find matching grade band
      const band = await db('hr_kpi_grade_bands')
        .where('status', 'Active')
        .where('min_score', '<=', finalScore).where('max_score', '>=', finalScore)
        .first();

      await db.transaction(async (trx) => {
        await trx('hr_kpi_review_items').where({ assignment_id: id }).delete();
        for (const it of items) {
          await trx('hr_kpi_review_items').insert({
            assignment_id: id, competency_name: it.competency_name?.trim() || null,
            weight: num(it.weight), score: num(it.score), comments: it.comments?.trim() || null,
          });
        }
        const finalize = b.finalize === true;
        // upsert result
        const existing = await trx('hr_kpi_results').where({ assignment_id: id }).first();
        const payload = {
          assignment_id: id, employee_id: a.employee_id, period_id: a.period_id,
          final_score: finalScore, grade: band?.grade || null, grade_label: band?.label || null,
          bonus_multiplier: band?.bonus_multiplier || 0, reviewer_remarks: b.remarks?.trim() || null,
        };
        if (existing) await trx('hr_kpi_results').where({ assignment_id: id }).update(payload);
        else await trx('hr_kpi_results').insert(payload);

        await trx(TABLE).where({ id }).update({ status: finalize ? 'Completed' : 'Reviewed' });
      });

      return res.status(200).json({ success: true, final_score: finalScore, grade: band?.grade || null });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'DELETE') {
    try {
      const row = await db(`${TABLE} as a`)
        .select('a.*', 'e.full_name as employee_name', 'p.name as period_name')
        .leftJoin('hr_employees as e', 'e.id', 'a.employee_id')
        .leftJoin('hr_kpi_periods as p', 'p.id', 'a.period_id')
        .where('a.id', id).first();
      if (!row) return res.status(404).json({ success: false, message: 'Assignment not found.' });
      const reviewItems = await db('hr_kpi_review_items').where({ assignment_id: id });
      const results = await db('hr_kpi_results').where({ assignment_id: id });
      const auth = await getAuth(req);
      await recycleDelete({
        moduleKey: 'hr.kpi.assignments', moduleLabel: 'KPI Assignments', table: TABLE, id,
        label: `KPI: ${row.employee_name || ''}${row.period_name ? ` — ${row.period_name}` : ''}`,
        children: [
          { table: 'hr_kpi_review_items', rows: reviewItems },
          { table: 'hr_kpi_results', rows: results },
        ],
        auth, req,
      });
      return res.status(200).json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
