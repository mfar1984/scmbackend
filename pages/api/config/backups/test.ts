import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// POST { storage } → quick connectivity test for the chosen storage destination.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  const storage = String(req.body?.storage || 'local');

  try {
    const rows = await db('config_settings').where({ module: 'backup' }).select('key', 'value');
    const cfg: Record<string, string> = {};
    for (const r of rows) cfg[r.key] = r.value || '';

    if (storage === 'local') {
      return res.status(200).json({ success: true, message: 'Local server storage is always available.' });
    }

    if (storage === 'r2') {
      if (!cfg.r2_account_id || !cfg.r2_bucket || !cfg.r2_access_key || !cfg.r2_secret)
        return res.status(400).json({ success: false, message: 'Please fill in all Cloudflare R2 fields and save first.' });
      const aws4 = (await import('aws4')).default;
      const host = `${cfg.r2_account_id}.r2.cloudflarestorage.com`;
      // HEAD bucket
      const opts: any = { host, path: `/${cfg.r2_bucket}`, method: 'HEAD', service: 's3', region: 'auto', headers: {} };
      aws4.sign(opts, { accessKeyId: cfg.r2_access_key, secretAccessKey: cfg.r2_secret });
      const r = await fetch(`https://${host}/${cfg.r2_bucket}`, { method: 'HEAD', headers: opts.headers });
      if (r.ok || r.status === 200) return res.status(200).json({ success: true, message: 'Connected to Cloudflare R2 bucket.' });
      return res.status(400).json({ success: false, message: `R2 responded with ${r.status}. Check account ID, bucket and keys.` });
    }

    if (storage === 'ftp') {
      if (!cfg.ftp_host || !cfg.ftp_user || !cfg.ftp_pass)
        return res.status(400).json({ success: false, message: 'Please fill in host, user and password and save first.' });
      const protocol = cfg.ftp_protocol || (cfg.ftp_secure === '1' ? 'ftps' : 'ftp');
      if (protocol === 'sftp') {
        const SftpClient = (await import('ssh2-sftp-client')).default;
        const client = new SftpClient();
        try {
          await client.connect({
            host: cfg.ftp_host, port: parseInt(cfg.ftp_port || '22'),
            username: cfg.ftp_user, password: cfg.ftp_pass, readyTimeout: 15000,
          });
          await client.cwd();
          return res.status(200).json({ success: true, message: 'Connected to SFTP server.' });
        } finally { await client.end().catch(() => {}); }
      }
      const { Client } = await import('basic-ftp');
      const client = new Client(15000);
      try {
        await client.access({
          host: cfg.ftp_host, port: parseInt(cfg.ftp_port || '21'),
          user: cfg.ftp_user, password: cfg.ftp_pass, secure: protocol === 'ftps',
        });
        await client.pwd();
        return res.status(200).json({ success: true, message: 'Connected to FTP server.' });
      } finally { client.close(); }
    }

    return res.status(400).json({ success: false, message: 'Unknown storage type.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Connection test failed.' });
  }
}
