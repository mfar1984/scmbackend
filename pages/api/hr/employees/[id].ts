import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { requirePermission, getAuth } from '@/lib/serverPermissions';
import { recycleDelete, pickLabel } from '@/lib/recycleBin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  // ── GET (single) ──
  if (req.method === 'GET') {
    try {
      const row = await db('hr_employees as e')
        .select(
          'e.*',
          'd.name as department_name',
          'p.name as position_name',
          't.name as employment_type_name',
          'b.name as bank_name'
        )
        .leftJoin('hr_departments as d',      'd.id', 'e.department_id')
        .leftJoin('hr_positions as p',        'p.id', 'e.position_id')
        .leftJoin('hr_employment_types as t', 't.id', 'e.employment_type_id')
        .leftJoin('hr_banks as b',            'b.id', 'e.bank_id')
        .where('e.id', id)
        .first();
      if (!row) return res.status(404).json({ success: false, message: 'Employee not found.' });
      return res.status(200).json({ success: true, data: row });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── PUT (update) ──
  if (req.method === 'PUT') {
    if (!(await requirePermission(req, res, 'hr.employee.list', 'Update'))) return;
    const b = req.body || {};
    if (!b.full_name?.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    try {
      await db('hr_employees').where({ id }).update({
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
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── DELETE ──
  if (req.method === 'DELETE') {
    if (!(await requirePermission(req, res, 'hr.employee.list', 'Delete'))) return;
    try {
      const row = await db('hr_employees').where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Employee not found.' });
      const auth = await getAuth(req);
      await recycleDelete({ moduleKey: 'hr.employee.list', moduleLabel: 'Employees', table: 'hr_employees', id, label: `Employee: ${pickLabel(row, ['full_name', 'employee_id'], id)}`, auth, req });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
