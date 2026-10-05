import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getAuth, hasPermission } from '@/lib/serverPermissions';
import { logAudit } from '@/lib/logger';

const TYPE_PERM: Record<string, string> = {
  administrator: 'settings.users.administrator',
  staff: 'settings.users.staff',
  client: 'settings.users.client',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // ── GET /api/users?type=administrator|staff|client ──────────
  if (req.method === 'GET') {
    try {
      const { type } = req.query;

      // Staff accounts are employee-linked: pull live data from hr_employees
      if (type === 'staff') {
        const staff = await db('users as u')
          .select(
            'u.id', 'u.name', 'u.email', 'u.phone', 'u.user_type', 'u.status',
            'u.employee_id', 'u.last_login', 'u.created_at',
            'e.employee_id as employee_code',
            'e.full_name as employee_name',
            'd.name as department', 'p.name as position',
            'e.join_date'
          )
          .leftJoin('hr_employees as e', 'e.id', 'u.employee_id')
          .leftJoin('hr_departments as d', 'd.id', 'e.department_id')
          .leftJoin('hr_positions as p', 'p.id', 'e.position_id')
          .where('u.user_type', 'staff')
          .orderBy('u.id', 'asc');
        return res.status(200).json({ success: true, data: staff });
      }

      const query = db('users')
        .select(
          'users.id', 'users.name', 'users.email', 'users.phone',
          'users.user_type', 'users.status', 'users.department',
          'users.position', 'users.join_date', 'users.last_login',
          'users.created_at', 'roles.name as role', 'roles.id as role_id'
        )
        .leftJoin('roles', 'roles.id', 'users.role_id')
        .orderBy('users.id', 'asc');

      if (type && ['administrator', 'client'].includes(type as string)) {
        query.where('users.user_type', type);
      }

      const users = await query;
      return res.status(200).json({ success: true, data: users });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── POST /api/users ─────────────────────────────────────────
  if (req.method === 'POST') {
    const { name, email, phone, password, role_id, user_type, status,
            department, position, join_date,
            contact_person, sector, address, website } = req.body;

    const permKey = TYPE_PERM[user_type as string] || 'settings.users.administrator';
    const auth = await getAuth(req);
    if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    if (!(await hasPermission(auth, permKey, 'Create'))) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }

    if (!name?.trim())  return res.status(400).json({ success: false, message: 'Name is required.' });
    if (!email?.trim()) return res.status(400).json({ success: false, message: 'Email is required.' });
    if (!password || password.length < 6) return res.status(400).json({ success: false, message: 'Password min 6 characters.' });

    try {
      const existing = await db('users').where({ email: email.trim().toLowerCase() }).first();
      if (existing) return res.status(409).json({ success: false, message: 'Email already exists.' });

      const hashed = await bcrypt.hash(password, 10);

      const [id] = await db('users').insert({
        name:           name.trim(),
        email:          email.trim().toLowerCase(),
        phone:          phone?.trim() || null,
        password:       hashed,
        role_id:        role_id || null,
        user_type:      user_type || 'staff',
        status:         status || 'Active',
        department:     department?.trim() || null,
        position:       position?.trim() || null,
        join_date:      join_date || null,
        contact_person: contact_person?.trim() || null,
        sector:         sector?.trim() || null,
        address:        address?.trim() || null,
        website:        website?.trim() || null,
      });

      await logAudit(req, {
        action: 'CREATE', module: 'Users',
        target: `User: ${email.trim().toLowerCase()}`,
        description: `Created ${user_type || 'staff'} account ${name.trim()}`,
        after: { name: name.trim(), email: email.trim().toLowerCase(), user_type: user_type || 'staff', status: status || 'Active' },
      });

      return res.status(201).json({ success: true, id });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
