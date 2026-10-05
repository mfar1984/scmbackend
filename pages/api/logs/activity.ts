import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { requirePermission } from '@/lib/serverPermissions';
import { logActivity } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // ── GET /api/logs/activity ─────────────────────────────────
  if (req.method === 'GET') {
    if (!(await requirePermission(req, res, 'settings.logs.activity', 'Read'))) return;
    try {
      const { level, category, search, user_id, portal, from, to, limit = '100', offset = '0' } = req.query;

      let query = db('activity_logs').orderBy('timestamp', 'desc');

      if (level && level !== 'All')       query = query.where({ level });
      if (category && category !== 'All') query = query.where({ category });
      if (portal && portal !== 'All')     query = query.where({ portal });
      if (user_id) query = query.where({ user_id: parseInt(user_id as string) });
      if (from)  query = query.where('timestamp', '>=', from as string);
      if (to)    query = query.where('timestamp', '<=', `${to} 23:59:59`);
      if (search) {
        const q = `%${search}%`;
        query = query.where(function() {
          this.where('message', 'like', q)
              .orWhere('user', 'like', q)
              .orWhere('ip', 'like', q)
              .orWhere('path', 'like', q)
              .orWhere('category', 'like', q);
        });
      }

      const total = await query.clone().count('id as count').first();
      const logs  = await query.limit(parseInt(limit as string)).offset(parseInt(offset as string));

      return res.status(200).json({
        success: true,
        data:    logs,
        total:   Number((total as any)?.count || 0),
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── POST /api/logs/activity — write a log entry (server-resolved actor) ──
  if (req.method === 'POST') {
    const { level = 'INFO', category = 'System', message, details, path } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }
    await logActivity(req, { level, category, message: message.trim(), details, path });
    return res.status(201).json({ success: true });
  }

  // ── DELETE /api/logs/activity — clear logs (requires Export perm) ──
  if (req.method === 'DELETE') {
    if (!(await requirePermission(req, res, 'settings.logs.activity', 'Export'))) return;
    try {
      const { before } = req.query;
      let query = db('activity_logs');
      if (before) query = query.where('timestamp', '<', before as string);
      const deleted = await query.delete();
      return res.status(200).json({ success: true, deleted });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
