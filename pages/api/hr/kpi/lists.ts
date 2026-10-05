import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Lightweight lists for KPI dropdowns: templates, periods (open), competencies.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  try {
    const [templates, periods, competencies] = await Promise.all([
      db('hr_kpi_templates').where('status', 'Active').select('id', 'name').orderBy('name', 'asc'),
      db('hr_kpi_periods').where('status', 'Open').select('id', 'name', 'cycle').orderBy('id', 'desc'),
      db('hr_kpi_competencies').where('status', 'Active').select('id', 'name', 'category').orderBy('name', 'asc'),
    ]);
    return res.status(200).json({ success: true, data: { templates, periods, competencies } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
