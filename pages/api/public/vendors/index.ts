import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// DB connection uses timezone +08:00, so a DATE comes back as a JS Date at
// local midnight (16:00 UTC the previous day). Shift by +8h before formatting
// so we recover the exact stored YYYY-MM-DD regardless of the Node server TZ.
function ymd(d: any): string {
  if (!d) return '';
  if (typeof d === 'string') return d.slice(0, 10);
  if (d instanceof Date) return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

// Public: list active approved vendors / service suppliers,
// shaped for the website (/resources/technical-information/vendors).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed.' });
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const rows = await db('ops_vendors')
      .where({ status: 'Active', published: 1 })
      .select('id', 'category', 'manufacturer', 'name', 'contact_person', 'phone', 'fax', 'email', 'address', 'state', 'expiry_date')
      .orderBy('category', 'asc')
      .orderBy('name', 'asc');

    const data = rows.map((r: any) => ({
      id: r.id,
      category: r.category || 'Others',
      company: r.name,
      contact_person: r.contact_person || '',
      tel: r.phone || '',
      fax: r.fax || '',
      email: r.email || '',
      address: r.address || '',
      state: r.state || '',
      expiry_date: ymd(r.expiry_date),
      ...(r.manufacturer ? { manufacturer: r.manufacturer } : {}),
    }));

    return res.status(200).json({ success: true, data });
  } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
}
