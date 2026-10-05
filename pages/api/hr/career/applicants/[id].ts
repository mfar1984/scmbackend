import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { requirePermission, getAuth } from '@/lib/serverPermissions';
import { recycleDelete, pickLabel } from '@/lib/recycleBin';

const VALID_STATUS = ['Pending', 'Shortlisted', 'Interview Scheduled', 'Offered', 'Rejected', 'Hired'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  // ── GET (single) ──
  if (req.method === 'GET') {
    try {
      const row = await db('hr_applicants').where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Applicant not found.' });
      return res.status(200).json({ success: true, data: row });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── PATCH (update status) ──
  // When status -> "Hired", auto-create an employee record (once).
  if (req.method === 'PATCH' || req.method === 'PUT') {
    const { status } = req.body || {};
    if (!VALID_STATUS.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const need = status === 'Rejected' ? 'Reject' : 'Approve';
    if (!(await requirePermission(req, res, 'hr.career.applicants', need))) return;
    try {
      const applicant = await db('hr_applicants').where({ id }).first();
      if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found.' });

      // Non-hire status: simple update
      if (status !== 'Hired') {
        await db('hr_applicants').where({ id }).update({ status });
        return res.status(200).json({ success: true });
      }

      // Hire: create employee inside a transaction (idempotent — skip if already converted)
      if (applicant.converted_employee_id) {
        await db('hr_applicants').where({ id }).update({ status: 'Hired' });
        return res.status(200).json({ success: true, employee_id: applicant.converted_employee_id, already: true });
      }

      const result = await db.transaction(async (trx) => {
        // generate employee_id from hr_settings
        const rows = await trx('hr_settings')
          .whereIn('key', ['employee_id_prefix', 'employee_id_digits', 'employee_id_next'])
          .select('key', 'value');
        const map: Record<string, string> = {};
        for (const r of rows) map[r.key] = r.value || '';
        const prefix = map.employee_id_prefix || 'ATL';
        const digits = parseInt(map.employee_id_digits || '4') || 4;
        const next   = parseInt(map.employee_id_next   || '1') || 1;
        const empCode = `${prefix}${String(next).padStart(digits, '0')}`;
        await trx.raw(
          'INSERT INTO `hr_settings` (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
          ['employee_id_next', String(next + 1)]
        );

        // map applicant -> employee (use current address; fall back to IC address)
        const [empId] = await trx('hr_employees').insert({
          employee_id:      empCode,
          full_name:        applicant.full_name,
          nric_passport:    applicant.ic_number || null,
          gender:           applicant.gender || null,
          marital_status:   applicant.marital_status || null,
          religion:         applicant.religion || null,
          nationality:      applicant.nationality || null,
          date_of_birth:    applicant.date_of_birth || null,
          email:            applicant.email || null,
          phone:            applicant.phone || null,
          address:          applicant.cur_address || applicant.ic_address || null,
          city:             applicant.cur_city || applicant.ic_city || null,
          state:            applicant.cur_state || applicant.ic_state || null,
          postcode:         applicant.cur_postcode || applicant.ic_postcode || null,
          country:          applicant.cur_country || applicant.ic_country || null,
          emergency_name:         applicant.emg_name || null,
          emergency_relationship: applicant.emg_relationship || null,
          emergency_phone:        applicant.emg_phone || null,
          department_id:      applicant.department_id || null,
          position_id:        applicant.position_id || null,
          employment_type_id: applicant.employment_type_id || null,
          employee_status:  'Probation',
          join_date:        applicant.available_start || null,
          status:           'Active',
        });

        await trx('hr_applicants').where({ id }).update({
          status: 'Hired',
          converted_employee_id: empId,
        });

        return { empId, empCode };
      });

      return res.status(200).json({ success: true, employee_id: result.empId, employee_code: result.empCode });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── DELETE ──
  if (req.method === 'DELETE') {
    try {
      const row = await db('hr_applicants').where({ id }).first();
      if (!row) return res.status(404).json({ success: false, message: 'Applicant not found.' });
      const auth = await getAuth(req);
      await recycleDelete({ moduleKey: 'hr.career.applicants', moduleLabel: 'Applicants', table: 'hr_applicants', id, label: `Applicant: ${pickLabel(row, ['full_name', 'email'], id)}`, auth, req });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
