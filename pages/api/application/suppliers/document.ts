import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

const FIELD_MAP: Record<string, { col: string; nameCol: string }> = {
  ssm:       { col: 'doc_ssm',       nameCol: 'doc_ssm_name' },
  profile:   { col: 'doc_profile',   nameCol: 'doc_profile_name' },
  mof:       { col: 'doc_mof',       nameCol: 'doc_mof_name' },
  cidb:      { col: 'doc_cidb',      nameCol: 'doc_cidb_name' },
  financial: { col: 'doc_financial', nameCol: 'doc_financial_name' },
  bank:      { col: 'doc_bank',      nameCol: 'doc_bank_name' },
};

function serveDataUrl(res: NextApiResponse, dataUrl: string, filename: string, download: boolean) {
  const match = dataUrl.match(/^data:([^;]+);base64,([\s\S]*)$/);
  if (!match) { res.status(422).send('Invalid document data.'); return; }
  const buffer = Buffer.from(match[2], 'base64');
  res.setHeader('Content-Type', match[1]);
  res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${filename.replace(/"/g, '')}"`);
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).send(buffer);
}

/**
 * Streams a stored supplier document.
 * GET ?id=1&type=ssm|profile|mof|cidb|financial|bank
 * GET ?id=1&type=other&index=0   (for the "other certificates" JSON array)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  const id = parseInt(req.query.id as string);
  const type = req.query.type as string;
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

  try {
    if (type === 'other') {
      const index = parseInt(req.query.index as string) || 0;
      const row = await db('supplier_registrations').where({ id }).select('doc_other').first();
      if (!row?.doc_other) return res.status(404).send('Document not found.');
      let arr: any[] = [];
      try { arr = JSON.parse(row.doc_other) || []; } catch { return res.status(422).send('Invalid data.'); }
      const item = arr[index];
      if (!item?.data) return res.status(404).send('Document not found.');
      return serveDataUrl(res, item.data, item.name || `certificate-${index + 1}`, !!req.query.download);
    }

    const map = FIELD_MAP[type];
    if (!map) return res.status(400).json({ success: false, message: 'Invalid type.' });
    const row = await db('supplier_registrations').where({ id }).select(map.col, map.nameCol).first();
    const dataUrl: string | null = row?.[map.col] || null;
    if (!dataUrl || !dataUrl.startsWith('data:')) return res.status(404).send('Document not found.');
    return serveDataUrl(res, dataUrl, row[map.nameCol] || type, !!req.query.download);
  } catch (err: any) {
    return res.status(500).send('Error loading document.');
  }
}
