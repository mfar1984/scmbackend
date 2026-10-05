import fs from 'fs';
import path from 'path';
import db from '@/lib/db';

/**
 * Storage drivers for backup archives.
 *  - local : <project>/backups/
 *  - r2    : Cloudflare R2 (S3-compatible) via SigV4
 *  - ftp   : FTP / FTPS
 */

export const BACKUP_ROOT = path.join(process.cwd(), 'backups');

export function ensureBackupDir(): string {
  fs.mkdirSync(BACKUP_ROOT, { recursive: true });
  return BACKUP_ROOT;
}

export function localPath(fileName: string): string {
  return path.join(BACKUP_ROOT, fileName);
}

async function getBackupSettings(): Promise<Record<string, string>> {
  const rows = await db('config_settings').where({ module: 'backup' }).select('key', 'value');
  const m: Record<string, string> = {};
  for (const r of rows) m[r.key] = r.value || '';
  return m;
}

// ── Cloudflare R2 (S3-compatible) ───────────────────────────
async function r2Request(method: string, key: string, body: Buffer | null, cfg: Record<string, string>) {
  const aws4 = (await import('aws4')).default;
  const host = `${cfg.r2_account_id}.r2.cloudflarestorage.com`;
  const pathName = `/${cfg.r2_bucket}/${key}`;
  const opts: any = {
    host, path: pathName, method, service: 's3', region: 'auto',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: body || undefined,
  };
  aws4.sign(opts, { accessKeyId: cfg.r2_access_key, secretAccessKey: cfg.r2_secret });
  const res = await fetch(`https://${host}${pathName}`, {
    method, headers: opts.headers as any, body: body as any,
  });
  return res;
}

async function r2Upload(fileName: string, absLocalPath: string, cfg: Record<string, string>) {
  const body = fs.readFileSync(absLocalPath);
  const res = await r2Request('PUT', fileName, body, cfg);
  if (!res.ok) throw new Error(`R2 upload failed (${res.status}): ${await res.text()}`);
}

async function r2Download(key: string, cfg: Record<string, string>): Promise<Buffer> {
  const res = await r2Request('GET', key, null, cfg);
  if (!res.ok) throw new Error(`R2 download failed (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

async function r2Delete(key: string, cfg: Record<string, string>) {
  const res = await r2Request('DELETE', key, null, cfg);
  if (!res.ok && res.status !== 404) throw new Error(`R2 delete failed (${res.status})`);
}

// ── FTP / FTPS ──────────────────────────────────────────────
function ftpProtocol(cfg: Record<string, string>): string {
  // 'sftp' | 'ftps' | 'ftp' — back-compat: ftp_secure=1 means FTPS.
  return cfg.ftp_protocol || (cfg.ftp_secure === '1' ? 'ftps' : 'ftp');
}

async function ftpUpload(fileName: string, absLocalPath: string, cfg: Record<string, string>) {
  if (ftpProtocol(cfg) === 'sftp') return sftpUpload(fileName, absLocalPath, cfg);
  const { Client } = await import('basic-ftp');
  const client = new Client(30000);
  try {
    await client.access({
      host: cfg.ftp_host, port: parseInt(cfg.ftp_port || '21'),
      user: cfg.ftp_user, password: cfg.ftp_pass, secure: ftpProtocol(cfg) === 'ftps',
    });
    const dir = cfg.ftp_dir || '/backups';
    await client.ensureDir(dir);
    await client.uploadFrom(absLocalPath, `${dir.replace(/\/$/, '')}/${fileName}`);
  } finally { client.close(); }
}

async function ftpDownload(key: string, cfg: Record<string, string>): Promise<Buffer> {
  if (ftpProtocol(cfg) === 'sftp') return sftpDownload(key, cfg);
  const { Client } = await import('basic-ftp');
  const client = new Client(30000);
  const tmp = path.join(ensureBackupDir(), `_dl_${Date.now()}_${key}`);
  try {
    await client.access({
      host: cfg.ftp_host, port: parseInt(cfg.ftp_port || '21'),
      user: cfg.ftp_user, password: cfg.ftp_pass, secure: ftpProtocol(cfg) === 'ftps',
    });
    const dir = (cfg.ftp_dir || '/backups').replace(/\/$/, '');
    await client.downloadTo(tmp, `${dir}/${key}`);
    const buf = fs.readFileSync(tmp);
    return buf;
  } finally {
    client.close();
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
  }
}

async function ftpDelete(key: string, cfg: Record<string, string>) {
  if (ftpProtocol(cfg) === 'sftp') return sftpDelete(key, cfg);
  const { Client } = await import('basic-ftp');
  const client = new Client(30000);
  try {
    await client.access({
      host: cfg.ftp_host, port: parseInt(cfg.ftp_port || '21'),
      user: cfg.ftp_user, password: cfg.ftp_pass, secure: ftpProtocol(cfg) === 'ftps',
    });
    const dir = (cfg.ftp_dir || '/backups').replace(/\/$/, '');
    await client.remove(`${dir}/${key}`).catch(() => { /* ignore missing */ });
  } finally { client.close(); }
}

// ── SFTP (SSH) ──────────────────────────────────────────────
function joinRemote(dir: string, file: string): string {
  return `${(dir || '/').replace(/\/$/, '')}/${file}`;
}

async function sftpConnect(cfg: Record<string, string>) {
  const SftpClient = (await import('ssh2-sftp-client')).default;
  const client = new SftpClient();
  await client.connect({
    host: cfg.ftp_host,
    port: parseInt(cfg.ftp_port || '22'),
    username: cfg.ftp_user,
    password: cfg.ftp_pass,
    readyTimeout: 30000,
  });
  return client;
}

async function sftpUpload(fileName: string, absLocalPath: string, cfg: Record<string, string>) {
  const client = await sftpConnect(cfg);
  try {
    const dir = cfg.ftp_dir || '/backups';
    if (!(await client.exists(dir))) await client.mkdir(dir, true);
    await client.fastPut(absLocalPath, joinRemote(dir, fileName));
  } finally { await client.end(); }
}

async function sftpDownload(key: string, cfg: Record<string, string>): Promise<Buffer> {
  const client = await sftpConnect(cfg);
  try {
    const data = await client.get(joinRemote(cfg.ftp_dir || '/backups', key));
    return Buffer.isBuffer(data) ? data : Buffer.from(data as any);
  } finally { await client.end(); }
}

async function sftpDelete(key: string, cfg: Record<string, string>) {
  const client = await sftpConnect(cfg);
  try {
    await client.delete(joinRemote(cfg.ftp_dir || '/backups', key)).catch(() => { /* ignore missing */ });
  } finally { await client.end(); }
}

// ── Public API ──────────────────────────────────────────────

/** Push a freshly-created local archive to the configured destination. */
export async function pushToStorage(storage: string, fileName: string, absLocalPath: string): Promise<void> {
  if (storage === 'local') return; // already on disk
  const cfg = await getBackupSettings();
  if (storage === 'r2') await r2Upload(fileName, absLocalPath, cfg);
  else if (storage === 'ftp') await ftpUpload(fileName, absLocalPath, cfg);
  else throw new Error(`Unknown storage type: ${storage}`);
}

/** Fetch a backup archive as a Buffer regardless of where it lives. */
export async function fetchArchive(storage: string, fileName: string, filePath: string | null): Promise<Buffer> {
  // A local copy is always kept (even for remote storage), so prefer it.
  const absLocal = filePath ? path.join(BACKUP_ROOT, path.basename(filePath)) : localPath(fileName);
  if (fs.existsSync(absLocal)) return fs.readFileSync(absLocal);

  if (storage === 'local') throw new Error('Backup file not found on local disk.');
  const cfg = await getBackupSettings();
  if (storage === 'r2') return r2Download(fileName, cfg);
  if (storage === 'ftp') return ftpDownload(fileName, cfg);
  throw new Error(`Unknown storage type: ${storage}`);
}

/** Remove a backup archive from its storage location (local copy + remote). */
export async function removeArchive(storage: string, fileName: string, filePath: string | null): Promise<void> {
  // Always remove the local copy first (kept for every storage type).
  const absLocal = filePath ? path.join(BACKUP_ROOT, path.basename(filePath)) : localPath(fileName);
  try { fs.unlinkSync(absLocal); } catch { /* ignore missing */ }

  if (storage === 'local') return;
  const cfg = await getBackupSettings();
  if (storage === 'r2') return r2Delete(fileName, cfg);
  if (storage === 'ftp') return ftpDelete(fileName, cfg);
}

/** Validate that the chosen storage is configured; returns an error message or null. */
export async function validateStorage(storage: string): Promise<string | null> {
  if (storage === 'local') return null;
  const cfg = await getBackupSettings();
  if (storage === 'r2') {
    if (!cfg.r2_account_id || !cfg.r2_bucket || !cfg.r2_access_key || !cfg.r2_secret)
      return 'Cloudflare R2 is not fully configured (account ID, bucket, access key, secret).';
    return null;
  }
  if (storage === 'ftp') {
    if (!cfg.ftp_host || !cfg.ftp_user || !cfg.ftp_pass)
      return 'FTP is not fully configured (host, user, password).';
    return null;
  }
  return `Unknown storage type: ${storage}`;
}
