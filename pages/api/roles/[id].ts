import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { requirePermission } from '@/lib/serverPermissions';
import { recycleFromReq } from '@/lib/recycleBin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  // ── GET /api/roles/:id ──────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const role = await db('roles').where({ id }).first();
      if (!role) return res.status(404).json({ success: false, message: 'Role not found.' });

      // Load permissions
      const perms = await db('role_permissions').where({ role_id: id });

      // Build matrix: { module: { permission: true } }
      const matrix: Record<string, Record<string, boolean>> = {};
      for (const p of perms) {
        if (!matrix[p.module]) matrix[p.module] = {};
        matrix[p.module][p.permission] = true;
      }

      // Count users
      const [{ users }] = await db('users').where({ role_id: id }).count('id as users');

      return res.status(200).json({ success: true, data: { ...role, matrix, users } });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── PUT /api/roles/:id ──────────────────────────────────────
  if (req.method === 'PUT') {
    if (!(await requirePermission(req, res, 'settings.roles', 'Update'))) return;
    const { name, description, status, permissions } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Role name is required.' });
    }

    try {
      const role = await db('roles').where({ id }).first();
      if (!role) return res.status(404).json({ success: false, message: 'Role not found.' });

      // Check duplicate name (exclude self)
      const dup = await db('roles').where({ name: name.trim() }).whereNot({ id }).first();
      if (dup) return res.status(409).json({ success: false, message: 'Role name already exists.' });

      await db('roles').where({ id }).update({
        name:        name.trim(),
        description: description?.trim() || null,
        status:      status || 'Active',
      });

      // Replace permissions
      await db('role_permissions').where({ role_id: id }).delete();

      if (permissions && typeof permissions === 'object') {
        const rows: { role_id: number; module: string; permission: string }[] = [];
        for (const [module, perms] of Object.entries(permissions)) {
          for (const [perm, granted] of Object.entries(perms as Record<string, boolean>)) {
            if (granted) rows.push({ role_id: id, module, permission: perm });
          }
        }
        if (rows.length > 0) await db('role_permissions').insert(rows);
      }

      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── DELETE /api/roles/:id ───────────────────────────────────
  if (req.method === 'DELETE') {
    if (!(await requirePermission(req, res, 'settings.roles', 'Delete'))) return;
    try {
      const role = await db('roles').where({ id }).first();
      if (!role) return res.status(404).json({ success: false, message: 'Role not found.' });

      // Check if users are assigned
      const [{ count }] = await db('users').where({ role_id: id }).count('id as count');
      if (Number(count) > 0) {
        return res.status(409).json({
          success: false,
          message: `Cannot delete. ${count} user(s) are assigned to this role.`,
        });
      }

      const perms = await db('role_permissions').where({ role_id: id });
      await recycleFromReq(req, {
        moduleKey: 'settings.roles', moduleLabel: 'Roles', table: 'roles', id,
        label: `Role: ${role.name || `#${id}`}`,
        children: [{ table: 'role_permissions', rows: perms }],
      });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
