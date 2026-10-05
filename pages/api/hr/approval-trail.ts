import type { NextApiRequest, NextApiResponse } from 'next';
import { getApprovalTrail } from '@/lib/approvalFlow';

// GET ?module=leave&id=123 → the approval action history for an application.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  const module = String(req.query.module || '');
  const id = parseInt(req.query.id as string);
  if (!['leave', 'claim', 'overtime', 'expenses'].includes(module)) return res.status(400).json({ success: false, message: 'Invalid module.' });
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
  try {
    const data = await getApprovalTrail(module, id);
    return res.status(200).json({ success: true, data });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
