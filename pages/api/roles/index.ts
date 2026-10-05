import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { requirePermission } from '@/lib/serverPermissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // ── GET /api/roles ──────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const roles = await db('roles')
        .select(
          'roles.id',
          'roles.name',
          'roles.description',
          'roles.status',
          'roles.created_at',
          db.raw('COUNT(users.id) as users')
        )
        .leftJoin('users', 'users.role_id', 'roles.id')
        .groupBy('roles.id')
        .orderBy('roles.id', 'asc');

      return res.status(200).json({ success: true, data: roles });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── POST /api/roles ─────────────────────────────────────────
  if (req.method === 'POST') {
    if (!(await requirePermission(req, res, 'settings.roles', 'Create'))) return;
    const { name, description, status, permissions } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Role name is required.' });
    }

    try {
      // Check duplicate name
      const existing = await db('roles').where({ name: name.trim() }).first();
      if (existing) {
        return res.status(409).json({ success: false, message: 'Role name already exists.' });
      }

      const [id] = await db('roles').insert({
        name:        name.trim(),
        description: description?.trim() || null,
        status:      status || 'Active',
      });

      // Insert permissions
      if (permissions && typeof permissions === 'object') {
        const rows: { role_id: number; module: string; permission: string }[] = [];
        for (const [module, perms] of Object.entries(permissions)) {
          for (const [perm, granted] of Object.entries(perms as Record<string, boolean>)) {
            if (granted) rows.push({ role_id: id, module, permission: perm });
          }
        }
        if (rows.length > 0) await db('role_permissions').insert(rows);
      }

      return res.status(201).json({ success: true, id });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
