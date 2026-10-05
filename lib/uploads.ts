import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import type { NextApiRequest } from 'next';
import db from './db';

/**
 * Filesystem-based uploads for large files (downloads, tender docs).
 * Files are stored under <project>/uploads/<subdir> and streamed back
 * via API endpoints. This avoids the 16MB DB column / 4MB API limits.
 */

export const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

const DEFAULT_MAX_MB = 60;

/** Read the configurable upload size limit (MB) from General config. */
export async function getMaxUploadMb(): Promise<number> {
  try {
    const row = await db('config_settings').where({ module: 'general', key: 'max_upload_mb' }).first();
    const n = parseInt(row?.value);
    return (!isNaN(n) && n > 0 && n <= 1024) ? n : DEFAULT_MAX_MB;
  } catch {
    return DEFAULT_MAX_MB;
  }
}

export function ensureDir(subdir: string): string {
  const dir = path.join(UPLOAD_ROOT, subdir);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export type ParsedUpload = {
  fields: Record<string, string>;
  file: { tmpPath: string; originalName: string; mime: string; size: number } | null;
};

/** Parse a multipart/form-data request (single file under field "file"). */
export function parseUpload(req: NextApiRequest, maxMb?: number): Promise<ParsedUpload> {
  const limit = (maxMb && maxMb > 0) ? maxMb : DEFAULT_MAX_MB;
  const form = formidable({ maxFileSize: limit * 1024 * 1024, keepExtensions: true, multiples: false });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      const flat: Record<string, string> = {};
      for (const k of Object.keys(fields)) {
        const v = (fields as any)[k];
        flat[k] = Array.isArray(v) ? String(v[0] ?? '') : String(v ?? '');
      }
      let f: any = (files as any).file;
      if (Array.isArray(f)) f = f[0];
      const file = f ? {
        tmpPath: f.filepath,
        originalName: f.originalFilename || 'upload',
        mime: f.mimetype || 'application/octet-stream',
        size: f.size || 0,
      } : null;
      resolve({ fields: flat, file });
    });
  });
}

/** Move a parsed temp file into the uploads dir, returning the relative path. */
export function saveUploadedFile(tmpPath: string, subdir: string, originalName: string): string {
  const dir = ensureDir(subdir);
  const safeBase = (originalName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
  const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeBase}`;
  const dest = path.join(dir, unique);
  fs.copyFileSync(tmpPath, dest);
  try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
  return path.posix.join(subdir, unique); // relative path stored in DB
}

/** Absolute path from a stored relative path. */
export function resolveUpload(relPath: string): string {
  return path.join(UPLOAD_ROOT, relPath);
}

export function deleteUpload(relPath?: string | null): void {
  if (!relPath) return;
  try { fs.unlinkSync(resolveUpload(relPath)); } catch { /* ignore */ }
}

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
