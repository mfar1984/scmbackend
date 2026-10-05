import type { NextApiRequest, NextApiResponse } from 'next';
import { getMaxUploadMb } from '@/lib/uploads';

// Lightweight read-only endpoint so the admin UI can show/enforce the limit.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  const maxMb = await getMaxUploadMb();
  return res.status(200).json({ success: true, maxMb });
}
