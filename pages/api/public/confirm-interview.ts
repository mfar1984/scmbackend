import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

function applyCors(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * PUBLIC — applicant confirms interview attendance via emailed token link.
 * GET  ?token=  → returns interview details (for the confirm page to display)
 * POST { token } → marks attendance confirmed
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = (req.method === 'GET' ? req.query.token : req.body?.token) as string;
  if (!token) return res.status(400).json({ success: false, message: 'Missing token.' });

  try {
    const a = await db('hr_applicants').where({ interview_token: token }).first();
    if (!a) return res.status(404).json({ success: false, message: 'Invalid or expired link.' });

    const details = {
      full_name: a.full_name,
      position_applied: a.position_applied,
      interview_date: a.interview_date,
      interview_time: a.interview_time,
      interview_location: a.interview_location,
      interview_notes: a.interview_notes,
      substatus: a.interview_substatus,
    };

    if (req.method === 'GET') {
      return res.status(200).json({ success: true, data: details });
    }

    if (req.method === 'POST') {
      if (a.interview_substatus === 'Confirmed') {
        return res.status(200).json({ success: true, alreadyConfirmed: true, data: details });
      }
      await db('hr_applicants').where({ id: a.id }).update({
        interview_substatus: 'Confirmed',
        interview_confirmed_at: db.fn.now(),
      });
      return res.status(200).json({ success: true, data: { ...details, substatus: 'Confirmed' } });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
