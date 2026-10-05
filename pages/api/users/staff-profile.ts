import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Full integrated profile for a staff user (joins their hr_employees record).
// GET ?id=<user_id>
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  try {
    const user = await db('users').where({ id }).select('id', 'name', 'email', 'phone', 'status', 'employee_id', 'last_login').first();
    if (!user) return res.status(404).json({ success: false, message: 'Staff not found.' });

    let employee = null;
    if (user.employee_id) {
      employee = await db('hr_employees as e')
        .select(
          'e.id', 'e.employee_id', 'e.full_name', 'e.nric_passport', 'e.gender', 'e.marital_status',
          'e.race', 'e.religion', 'e.nationality', 'e.date_of_birth', 'e.email', 'e.phone',
          'e.address', 'e.city', 'e.state', 'e.postcode', 'e.country',
          'e.join_date', 'e.confirm_date', 'e.work_location', 'e.reporting_to', 'e.employee_status',
          'e.basic_salary', 'e.fixed_allowance', 'e.bank_account_no', 'e.epf_no', 'e.socso_no', 'e.income_tax_no',
          'd.name as department_name', 'p.name as position_name',
          't.name as employment_type_name', 'b.name as bank_name'
        )
        .leftJoin('hr_departments as d', 'd.id', 'e.department_id')
        .leftJoin('hr_positions as p', 'p.id', 'e.position_id')
        .leftJoin('hr_employment_types as t', 't.id', 'e.employment_type_id')
        .leftJoin('hr_banks as b', 'b.id', 'e.bank_id')
        .where('e.id', user.employee_id)
        .first();
    }
    return res.status(200).json({ success: true, data: { user, employee } });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
