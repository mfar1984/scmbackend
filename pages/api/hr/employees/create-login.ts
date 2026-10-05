import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { requirePermission } from '@/lib/serverPermissions';

// Create (or reset) a staff Self-Service login for an employee.
// Body: { employee_id, password? }  → if no password, a random one is generated.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  if (!(await requirePermission(req, res, 'hr.employee.list', 'Update'))) return;
  const b = req.body || {};
  const employeeId = parseInt(b.employee_id);
  if (isNaN(employeeId)) return res.status(400).json({ success: false, message: 'Employee is required.' });

  try {
    const emp = await db('hr_employees').where({ id: employeeId }).first();
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found.' });
    if (!emp.email?.trim()) return res.status(400).json({ success: false, message: 'This employee has no email address. Add one in the employee record first.' });

    const email = emp.email.trim().toLowerCase();
    const password = (b.password?.trim()) || Math.random().toString(36).slice(-10) + 'A1';
    const hash = await bcrypt.hash(password, 10);

    // already linked to this employee?
    const existingByEmp = await db('users').where({ employee_id: employeeId }).first();
    if (existingByEmp) {
      await db('users').where({ id: existingByEmp.id }).update({ password: hash, status: 'Active' });
      return res.status(200).json({ success: true, reset: true, email: existingByEmp.email, password, message: 'Login password reset.' });
    }

    // email already used by another account?
    const existingByEmail = await db('users').where({ email }).first();
    if (existingByEmail) {
      // link that account to this employee, make it staff, reset password
      await db('users').where({ id: existingByEmail.id }).update({
        employee_id: employeeId, user_type: 'staff', password: hash, status: 'Active',
      });
      return res.status(200).json({ success: true, linked: true, email, password, message: 'Existing account linked to employee.' });
    }

    // create a fresh staff login
    await db('users').insert({
      name: emp.full_name, email, phone: emp.phone || null,
      password: hash, role_id: null, user_type: 'staff', employee_id: employeeId,
      status: 'Active', department: null, position: null,
    });
    return res.status(201).json({ success: true, created: true, email, password, message: 'Staff login created.' });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
