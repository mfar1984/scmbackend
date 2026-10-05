import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { requirePermission } from '@/lib/serverPermissions';
import { logAudit } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // ── GET /api/logs/audit ────────────────────────────────────
  if (req.method === 'GET') {
    if (!(await requirePermission(req, res, 'settings.logs.audit', 'Read'))) return;
    try {
      const { action, module: mod, search, user_id, from, to, limit = '100', offset = '0' } = req.query;

      let query = db('audit_logs').orderBy('timestamp', 'desc');

      // Filter by action
      if (action && action !== 'All' && typeof action === 'string') {
        query = query.where({ action });
      }

      // Filter by module
      if (mod && mod !== 'All' && typeof mod === 'string') {
        query = query.where({ module: mod });
      }

      // Filter by user_id
      if (user_id && typeof user_id === 'string') {
        const userId = parseInt(user_id);
        if (!isNaN(userId)) {
          query = query.where({ user_id: userId });
        }
      }

      // Filter by date range
      if (from && typeof from === 'string') {
        query = query.where('timestamp', '>=', from);
      }
      if (to && typeof to === 'string') {
        query = query.where('timestamp', '<=', `${to} 23:59:59`);
      }

      // Search filter
      if (search && typeof search === 'string' && search.trim()) {
        const q = `%${search.trim()}%`;
        query = query.where(function() {
          this.where('description', 'like', q)
              .orWhere('user', 'like', q)
              .orWhere('target', 'like', q)
              .orWhere('module', 'like', q);
        });
      }

      const total = await query.clone().count('id as count').first();
      const logs  = await query.limit(parseInt(limit as string)).offset(parseInt(offset as string));

      const parsed = logs.map((l: any) => ({
        ...l,
        before_data: l.before_data
          ? (typeof l.before_data === 'string' ? JSON.parse(l.before_data) : l.before_data)
          : null,
        after_data: l.after_data
          ? (typeof l.after_data === 'string' ? JSON.parse(l.after_data) : l.after_data)
          : null,
      }));

      return res.status(200).json({
        success: true,
        data:    parsed,
        total:   Number((total as any)?.count || 0),
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── POST /api/logs/audit — write an audit entry (server-resolved actor) ──
  if (req.method === 'POST') {
    const { action, module: mod, target, description, before_data, after_data } = req.body;
    if (!action || !mod || !target || !description) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }
    await logAudit(req, { action, module: mod, target, description, before: before_data, after: after_data });
    return res.status(201).json({ success: true });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
