import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

/**
 * PUBLIC endpoint — consumed by the atlinewebsite (port 3000).
 * Returns only Published postings, shaped for the public career page.
 */
function applyCors(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const splitLines = (v: string | null) =>
  (v || '').split('\n').map(s => s.trim()).filter(Boolean);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  try {
    // Today (date only, server local) for closing-date comparison
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const rows = await db('hr_career_postings')
      .where({ status: 'Published' })
      // Auto-hide expired postings: keep only those with no closing date
      // or a closing date that is today or later.
      .andWhere(function (this: any) {
        this.whereNull('closing_date').orWhere('closing_date', '>=', todayStr);
      })
      .orderBy([{ column: 'is_featured', order: 'desc' }, { column: 'id', order: 'desc' }]);

    const data = rows.map((p: any) => ({
      id:            p.id,
      title:         p.title,
      position_id:   p.position_id,
      department:    p.department,
      department_id: p.department_id,
      location:      p.location,
      job_type:      p.job_type,
      employment_type: p.employment_type,
      employment_type_id: p.employment_type_id,
      min_salary:    p.min_salary,
      max_salary:    p.max_salary,
      salary_notes:  p.salary_notes,
      min_experience: p.min_experience,
      max_experience: p.max_experience,
      experience_level: p.experience_level,
      icon_theme:    p.icon_theme,
      overview:      p.overview,
      responsibilities: splitLines(p.responsibilities),
      requirements:  splitLines(p.requirements),
      benefits:      splitLines(p.benefits),
      skills:        (p.skills || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      is_featured:   !!p.is_featured,
      posted_date:   p.posted_date,
      closing_date:  p.closing_date,
    }));

    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
