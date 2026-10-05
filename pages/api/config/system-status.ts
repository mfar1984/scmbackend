import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import db from '@/lib/db';
import { UPLOAD_ROOT } from '@/lib/uploads';

// Real system health checks + recent log feed for the Maintenance page.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  const health: { label: string; status: string; ok: 'up' | 'warn' | 'down'; icon: string }[] = [];

  // ── Database ──
  try {
    await db.raw('SELECT 1');
    health.push({ label: 'Database', status: 'Online', ok: 'up', icon: 'bi-database-fill' });
  } catch {
    health.push({ label: 'Database', status: 'Offline', ok: 'down', icon: 'bi-database-fill' });
  }

  // ── File Storage (uploads writable) ──
  try {
    fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
    const probe = path.join(UPLOAD_ROOT, '.health_check');
    fs.writeFileSync(probe, 'ok');
    fs.unlinkSync(probe);
    health.push({ label: 'File Storage', status: 'Writable', ok: 'up', icon: 'bi-hdd-fill' });
  } catch {
    health.push({ label: 'File Storage', status: 'Not Writable', ok: 'down', icon: 'bi-hdd-fill' });
  }

  // ── Email (SMTP configured?) ──
  try {
    const rows = await db('integration_settings').where({ module: 'email' }).select('key', 'value');
    const m: Record<string, string> = {};
    for (const r of rows) m[r.key] = r.value || '';
    const configured = !!(m.smtp_host && m.smtp_port);
    health.push({
      label: 'Email (SMTP)',
      status: configured ? 'Configured' : 'Not Configured',
      ok: configured ? 'up' : 'warn',
      icon: 'bi-envelope-fill',
    });
  } catch {
    health.push({ label: 'Email (SMTP)', status: 'Unknown', ok: 'warn', icon: 'bi-envelope-fill' });
  }

  // ── Maintenance mode ──
  try {
    const row = await db('config_settings').where({ module: 'maintenance', key: 'maintenance_mode' }).first();
    const on = row?.value === '1';
    health.push({
      label: 'Maintenance Mode',
      status: on ? 'Active' : 'Inactive',
      ok: on ? 'warn' : 'up',
      icon: 'bi-cone-striped',
    });
  } catch {
    health.push({ label: 'Maintenance Mode', status: 'Unknown', ok: 'warn', icon: 'bi-cone-striped' });
  }

  // ── Backup (last run) ──
  try {
    const last = await db('backups').orderBy('created_at', 'desc').first();
    if (!last) health.push({ label: 'Backup', status: 'No backups yet', ok: 'warn', icon: 'bi-cloud-arrow-up' });
    else if (last.status === 'Complete') health.push({ label: 'Backup', status: 'Last: Complete', ok: 'up', icon: 'bi-cloud-arrow-up' });
    else if (last.status === 'Running') health.push({ label: 'Backup', status: 'Running…', ok: 'warn', icon: 'bi-cloud-arrow-up' });
    else health.push({ label: 'Backup', status: 'Last: Failed', ok: 'down', icon: 'bi-cloud-arrow-up' });
  } catch {
    health.push({ label: 'Backup', status: 'Unknown', ok: 'warn', icon: 'bi-cloud-arrow-up' });
  }

  // ── Website reachability ──
  try {
    const base = (process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch(`${base}/api/revalidate`, { method: 'OPTIONS', signal: ctrl.signal }).catch(() => null);
    clearTimeout(t);
    health.push({
      label: 'Website',
      status: r ? 'Reachable' : 'Unreachable',
      ok: r ? 'up' : 'down',
      icon: 'bi-globe',
    });
  } catch {
    health.push({ label: 'Website', status: 'Unreachable', ok: 'down', icon: 'bi-globe' });
  }

  // ── Recent logs (from activity_logs) ──
  let logs: any[] = [];
  try {
    logs = await db('activity_logs').orderBy('timestamp', 'desc').limit(20)
      .select('timestamp', 'level', 'message', 'user', 'category');
  } catch { logs = []; }

  return res.status(200).json({ success: true, data: { health, logs } });
}
