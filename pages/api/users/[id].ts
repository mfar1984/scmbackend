import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getAuth, hasPermission } from '@/lib/serverPermissions';
import { recycleDelete } from '@/lib/recycleBin';
import { logAudit } from '@/lib/logger';

const TYPE_PERM: Record<string, string> = {
  administrator: 'settings.users.administrator',
  staff: 'settings.users.staff',
  client: 'settings.users.client',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  // Enforce permission for mutations based on the target user's type.
  if (req.method === 'PUT' || req.method === 'DELETE') {
    const target = await db('users').where({ id }).select('user_type').first();
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });
    const permKey = TYPE_PERM[target.user_type as string] || 'settings.users.administrator';
    const auth = await getAuth(req);
    if (!auth) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    const perm = req.method === 'DELETE' ? 'Delete' : 'Update';
    if (!(await hasPermission(auth, permKey, perm))) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
  }

  // ── GET /api/users/:id ──────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const user = await db('users')
        .select(
          'users.id', 'users.name', 'users.email', 'users.phone',
          'users.user_type', 'users.status', 'users.department',
          'users.position', 'users.join_date', 'users.last_login',
          'users.created_at', 'roles.name as role', 'roles.id as role_id'
        )
        .leftJoin('roles', 'roles.id', 'users.role_id')
        .where('users.id', id)
        .first();

      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      return res.status(200).json({ success: true, data: user });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── PUT /api/users/:id ──────────────────────────────────────
  if (req.method === 'PUT') {
    const { name, email, phone, password, role_id, status,
            department, position, join_date,
            contact_person, sector, address, website } = req.body;

    if (!name?.trim())  return res.status(400).json({ success: false, message: 'Name is required.' });
    if (!email?.trim()) return res.status(400).json({ success: false, message: 'Email is required.' });

    try {
      const user = await db('users').where({ id }).first();
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      const dup = await db('users').where({ email: email.trim().toLowerCase() }).whereNot({ id }).first();
      if (dup) return res.status(409).json({ success: false, message: 'Email already exists.' });

      // Only update fields that are explicitly provided (partial-safe).
      // Prevents wiping employee-linked fields when a minimal update (e.g. status) is sent.
      const updateData: Record<string, any> = {
        name:  name.trim(),
        email: email.trim().toLowerCase(),
        status: status || 'Active',
      };
      if (phone !== undefined)          updateData.phone = phone?.trim() || null;
      if (role_id !== undefined)        updateData.role_id = role_id || null;
      if (department !== undefined)     updateData.department = department?.trim() || null;
      if (position !== undefined)       updateData.position = position?.trim() || null;
      if (join_date !== undefined)      updateData.join_date = join_date || null;
      if (contact_person !== undefined) updateData.contact_person = contact_person?.trim() || null;
      if (sector !== undefined)         updateData.sector = sector?.trim() || null;
      if (address !== undefined)        updateData.address = address?.trim() || null;
      if (website !== undefined)        updateData.website = website?.trim() || null;

      if (password && password.trim().length >= 6) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      await db('users').where({ id }).update(updateData);
      await logAudit(req, {
        action: 'UPDATE', module: 'Users',
        target: `User: ${updateData.email || `#${id}`}`,
        description: `Updated account ${updateData.name || updateData.email || `#${id}`}${updateData.password ? ' (password changed)' : ''}`,
        after: { name: updateData.name, email: updateData.email, status: updateData.status },
      });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── DELETE /api/users/:id ───────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      const user = await db('users').where({ id }).first();
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      const permKey = TYPE_PERM[user.user_type as string] || 'settings.users.administrator';
      const auth = await getAuth(req);
      await recycleDelete({
        moduleKey: permKey, moduleLabel: 'Users', table: 'users', id,
        label: `User: ${user.name || user.email || `#${id}`}`,
        auth, req,
      });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
