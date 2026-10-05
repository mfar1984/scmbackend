import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getAuth, hasAnyPermission } from '@/lib/serverPermissions';
import { recycleDelete, pickLabel } from '@/lib/recycleBin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  // ── GET (single) ──
  if (req.method === 'GET') {
    try {
      const row = await db('hr_career_postings').where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Posting not found.' });
      return res.status(200).json({ success: true, data: row });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── PUT (update) ──
  if (req.method === 'PUT') {
    const auth = await getAuth(req);
    if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    // Edit from Postings OR re-open from Archive both use PUT.
    if (!(await hasAnyPermission(auth, ['hr.career.postings', 'hr.career.archive'], 'Update'))) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
    const b = req.body || {};
    if (!b.title?.trim()) return res.status(400).json({ success: false, message: 'Job title is required.' });
    try {
      await db('hr_career_postings').where({ id }).update({
        title:           b.title.trim(),
        position_id:     b.position_id || null,
        department:      b.department?.trim() || null,
        department_id:   b.department_id || null,
        location:        b.location?.trim() || null,
        job_type:        b.job_type || 'Full Time',
        employment_type: b.employment_type || 'Permanent',
        employment_type_id: b.employment_type_id || null,
        min_salary:      b.min_salary !== '' && b.min_salary != null ? b.min_salary : null,
        max_salary:      b.max_salary !== '' && b.max_salary != null ? b.max_salary : null,
        salary_notes:    b.salary_notes?.trim() || null,
        min_experience:  b.min_experience !== '' && b.min_experience != null ? b.min_experience : null,
        max_experience:  b.max_experience !== '' && b.max_experience != null ? b.max_experience : null,
        experience_level: b.experience_level?.trim() || null,
        icon_theme:      b.icon_theme || 'general',
        overview:        b.overview?.trim() || null,
        responsibilities: b.responsibilities?.trim() || null,
        requirements:    b.requirements?.trim() || null,
        benefits:        b.benefits?.trim() || null,
        skills:          b.skills?.trim() || null,
        is_featured:     b.is_featured ? 1 : 0,
        status:          b.status || 'Draft',
        posted_date:     b.posted_date || null,
        closing_date:    b.closing_date || null,
      });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── DELETE ──
  if (req.method === 'DELETE') {
    const auth = await getAuth(req);
    if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    if (!(await hasAnyPermission(auth, ['hr.career.postings', 'hr.career.archive'], 'Delete'))) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
    try {
      const row = await db('hr_career_postings').where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Posting not found.' });
      await recycleDelete({ moduleKey: 'hr.career.postings', moduleLabel: 'Career Postings', table: 'hr_career_postings', id, label: `Posting: ${pickLabel(row, ['title'], id)}`, auth, req });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
