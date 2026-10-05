import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { requirePermission } from '@/lib/serverPermissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // ── GET (list) ──
  // ?scope=active   → not Closed and not past closing date (default)
  // ?scope=archived → Closed OR past closing date
  // ?scope=all      → everything
  if (req.method === 'GET') {
    try {
      const scope = (req.query.scope as string) || 'active';
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const query = db('hr_career_postings as p')
        .select('p.*')
        .select(db.raw('(SELECT COUNT(*) FROM hr_applicants a WHERE a.posting_id = p.id) AS applicant_count'))
        .orderBy('p.id', 'desc');

      if (scope === 'active') {
        query.whereNot('p.status', 'Closed').andWhere(function (this: any) {
          this.whereNull('p.closing_date').orWhere('p.closing_date', '>=', todayStr);
        });
      } else if (scope === 'archived') {
        query.where(function (this: any) {
          this.where('p.status', 'Closed').orWhere(function (this: any) {
            this.whereNotNull('p.closing_date').andWhere('p.closing_date', '<', todayStr);
          });
        });
      }

      const rows = await query;
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── POST (create) ──
  if (req.method === 'POST') {
    if (!(await requirePermission(req, res, 'hr.career.postings', 'Create'))) return;
    const b = req.body || {};
    if (!b.title?.trim()) return res.status(400).json({ success: false, message: 'Job title is required.' });
    try {
      const [id] = await db('hr_career_postings').insert({
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
      return res.status(201).json({ success: true, id });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
