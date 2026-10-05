import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { requirePermission } from '@/lib/serverPermissions';

/**
 * Generate the next employee_id using hr_settings (prefix/digits/next)
 * and increment the stored sequence. Runs inside a transaction so
 * concurrent inserts don't collide.
 */
async function generateEmployeeId(trx: any): Promise<string> {
  const rows = await trx('hr_settings')
    .whereIn('key', ['employee_id_prefix', 'employee_id_digits', 'employee_id_next'])
    .select('key', 'value');

  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value || '';

  const prefix = map.employee_id_prefix || 'ATL';
  const digits = parseInt(map.employee_id_digits || '4') || 4;
  const next   = parseInt(map.employee_id_next   || '1') || 1;

  const empId = `${prefix}${String(next).padStart(digits, '0')}`;

  // advance the sequence
  await trx.raw(
    'INSERT INTO `hr_settings` (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
    ['employee_id_next', String(next + 1)]
  );

  return empId;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // ── GET (list) ──
  if (req.method === 'GET') {
    try {
      const rows = await db('hr_employees as e')
        .select(
          'e.*',
          'd.name as department_name',
          'p.name as position_name',
          't.name as employment_type_name',
          'b.name as bank_name',
          db.raw('(SELECT COUNT(*) FROM users u WHERE u.employee_id = e.id) AS has_login')
        )
        .leftJoin('hr_departments as d',      'd.id', 'e.department_id')
        .leftJoin('hr_positions as p',        'p.id', 'e.position_id')
        .leftJoin('hr_employment_types as t', 't.id', 'e.employment_type_id')
        .leftJoin('hr_banks as b',            'b.id', 'e.bank_id')
        .orderBy('e.id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── POST (create) ──
  if (req.method === 'POST') {
    if (!(await requirePermission(req, res, 'hr.employee.list', 'Create'))) return;
    const b = req.body || {};
    if (!b.full_name?.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    try {
      const result = await db.transaction(async (trx) => {
        const employee_id = await generateEmployeeId(trx);
        const [id] = await trx('hr_employees').insert({
          employee_id,
          full_name:        b.full_name.trim(),
          nric_passport:    b.nric_passport?.trim() || null,
          gender:           b.gender || null,
          marital_status:   b.marital_status || null,
          race:             b.race || null,
          religion:         b.religion || null,
          nationality:      b.nationality || null,
          date_of_birth:    b.date_of_birth || null,
          email:            b.email?.trim() || null,
          phone:            b.phone?.trim() || null,
          address:          b.address?.trim() || null,
          city:             b.city?.trim() || null,
          state:            b.state?.trim() || null,
          postcode:         b.postcode?.trim() || null,
          country:          b.country?.trim() || null,
          emergency_name:         b.emergency_name?.trim() || null,
          emergency_relationship: b.emergency_relationship?.trim() || null,
          emergency_phone:        b.emergency_phone?.trim() || null,
          department_id:    b.department_id || null,
          position_id:      b.position_id || null,
          employment_type_id: b.employment_type_id || null,
          join_date:        b.join_date || null,
          confirm_date:     b.confirm_date || null,
          work_location:    b.work_location?.trim() || null,
          reporting_to:     b.reporting_to?.trim() || null,
          employee_status:  b.employee_status || 'Active',
          basic_salary:     b.basic_salary !== '' && b.basic_salary != null ? b.basic_salary : null,
          fixed_allowance:  b.fixed_allowance !== '' && b.fixed_allowance != null ? b.fixed_allowance : 0,
          bank_id:          b.bank_id || null,
          bank_account_no:  b.bank_account_no?.trim() || null,
          epf_no:           b.epf_no?.trim() || null,
          socso_no:         b.socso_no?.trim() || null,
          income_tax_no:    b.income_tax_no?.trim() || null,
          status:           b.status || 'Active',
        });
        return { id, employee_id };
      });
      return res.status(201).json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
