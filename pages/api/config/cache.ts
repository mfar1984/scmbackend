import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

/**
 * Real cache management.
 *  - Revalidates the public website's ISR/content cache via its
 *    /api/revalidate endpoint (so CMS edits appear immediately).
 *  - Clears the backend's own Next.js fetch/data cache folder
 *    (.next/cache/fetch-cache) where applicable.
 */

function rmDir(dir: string): number {
  let count = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    try {
      if (entry.isDirectory()) { count += rmDir(full); fs.rmdirSync(full); }
      else { fs.unlinkSync(full); count++; }
    } catch { /* ignore locked files */ }
  }
  return count;
}

async function revalidateWebsite(): Promise<{ ok: boolean; message: string }> {
  const base = (process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const secret = process.env.REVALIDATE_SECRET || 'atline-revalidate';
  try {
    const res = await fetch(`${base}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
    });
    if (res.ok) return { ok: true, message: 'Website content cache revalidated.' };
    return { ok: false, message: `Website revalidate returned ${res.status}.` };
  } catch (err: any) {
    return { ok: false, message: `Could not reach website: ${err?.message || 'network error'}.` };
  }
}

function clearLocalDataCache(): number {
  // Next's fetch/data cache lives under .next/cache. Clearing it forces
  // fresh data on next request. Safe to remove; Next rebuilds it.
  const cacheDir = path.join(process.cwd(), '.next', 'cache', 'fetch-cache');
  return rmDir(cacheDir);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  const type = String(req.body?.type || 'all');
  const messages: string[] = [];
  let anyWarning = false;

  try {
    if (type === 'app' || type === 'all') {
      const r = await revalidateWebsite();
      messages.push(r.message);
      if (!r.ok) anyWarning = true;
    }

    if (type === 'data' || type === 'all') {
      const n = clearLocalDataCache();
      messages.push(`Cleared ${n} cached data file${n !== 1 ? 's' : ''}.`);
    }

    if (type === 'assets' || type === 'all') {
      // Asset cache is controlled by content hashing + browser cache; the most
      // useful action here is to revalidate so new asset URLs are served.
      if (type === 'assets') {
        const r = await revalidateWebsite();
        messages.push(r.ok ? 'Asset references revalidated on the website.' : r.message);
        if (!r.ok) anyWarning = true;
      }
    }

    return res.status(200).json({
      success: !anyWarning,
      warning: anyWarning,
      message: messages.join(' '),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Cache operation failed.' });
  }
}
