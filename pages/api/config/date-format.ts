import type { NextApiRequest, NextApiResponse } from 'next';
import { getDateConfig, clearDateConfigCache } from '@/lib/dateFormat';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const config = await getDateConfig();
      return res.status(200).json({ success: true, data: config });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // POST — clear cache (called after saving general config)
  if (req.method === 'POST') {
    clearDateConfigCache();
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
