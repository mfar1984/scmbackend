import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getEssSession } from '@/lib/essAuth';

// Returns the logged-in staff's own employee record (read-only for ESS).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  const sess = await getEssSession(req);
  if (!sess) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  if (!sess.employeeId) return res.status(403).json({ success: false, message: 'Your account is not linked to an employee record. Contact HR.' });

  try {
    const emp = await db('hr_employees as e')
      .select(
        'e.id', 'e.employee_id', 'e.full_name', 'e.nric_passport', 'e.gender',
        'e.email', 'e.phone', 'e.address', 'e.city', 'e.state', 'e.postcode',
        'e.date_of_birth', 'e.join_date', 'e.basic_salary', 'e.bank_account_no',
        'e.epf_no', 'e.socso_no', 'e.income_tax_no',
        'd.name as department_name', 'p.name as position_name',
        't.name as employment_type_name', 'b.name as bank_name',
      )
      .leftJoin('hr_departments as d', 'd.id', 'e.department_id')
      .leftJoin('hr_positions as p', 'p.id', 'e.position_id')
      .leftJoin('hr_employment_types as t', 't.id', 'e.employment_type_id')
      .leftJoin('hr_banks as b', 'b.id', 'e.bank_id')
      .where('e.id', sess.employeeId)
      .first();
    if (!emp) return res.status(404).json({ success: false, message: 'Employee record not found.' });
    return res.status(200).json({ success: true, data: emp });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
