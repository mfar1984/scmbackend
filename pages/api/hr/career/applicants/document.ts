import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

const FIELD_MAP: Record<string, { col: string; nameCol: string }> = {
  passport:     { col: 'doc_passport',     nameCol: 'doc_passport_name' },
  resume:       { col: 'doc_resume',       nameCol: 'doc_resume_name' },
  cover_letter: { col: 'doc_cover_letter', nameCol: 'doc_cover_letter_name' },
};

/**
 * Streams a stored applicant document (base64 data URL) as a real file.
 * GET /api/hr/career/applicants/document?id=123&type=resume[&download=1]
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  const id = parseInt(req.query.id as string);
  const type = req.query.type as string;
  if (isNaN(id) || !FIELD_MAP[type]) {
    return res.status(400).json({ success: false, message: 'Invalid request.' });
  }

  try {
    const { col, nameCol } = FIELD_MAP[type];
    const row = await db('hr_applicants').where({ id }).select(col, nameCol).first();
    const dataUrl: string | null = row?.[col] || null;
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return res.status(404).send('Document not found.');
    }

    // Parse data URL: data:<mime>;base64,<data>
    const match = dataUrl.match(/^data:([^;]+);base64,([\s\S]*)$/);
    if (!match) return res.status(422).send('Invalid document data.');

    const mime = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    const filename = row[nameCol] || `${type}`;

    const disposition = req.query.download ? 'attachment' : 'inline';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename.replace(/"/g, '')}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).send(buffer);
  } catch (err: any) {
    return res.status(500).send('Error loading document.');
  }
}
