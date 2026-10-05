import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { notifyTelegramTrigger } from '@/lib/telegram';

function applyCors(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function nextRef(trx: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PART-${year}-`;
  const last = await trx('partner_applications')
    .where('reference_no', 'like', `${prefix}%`).orderBy('id', 'desc').first();
  let seq = 1;
  if (last?.reference_no) {
    const n = parseInt(String(last.reference_no).split('-').pop() || '0');
    if (!isNaN(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

const arr = (v: any) => Array.isArray(v) ? v.join(', ') : (v || null);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  const b = req.body || {};
  if (!b.company?.trim()) return res.status(400).json({ success: false, message: 'Company name is required.' });
  if (!b.email?.trim())   return res.status(400).json({ success: false, message: 'Email is required.' });

  try {
    const result = await db.transaction(async (trx) => {
      const reference_no = await nextRef(trx);
      const [id] = await trx('partner_applications').insert({
        reference_no,
        status: 'Pending',
        company:       b.company.trim(),
        ssm:           b.ssm?.trim() || null,
        website:       b.website?.trim() || null,
        industry:      b.industry || null,
        country:       b.country?.trim() || null,
        state:         b.state || null,
        contact_name:  b.contact_name?.trim() || null,
        position:      b.position?.trim() || null,
        email:         b.email.trim(),
        phone:         b.phone?.trim() || null,
        partner_type:  arr(b.partner_type),
        partner_tier:  b.partner_tier || null,
        tech_stack:    arr(b.tech_stack),
        years_op:      b.years_op?.toString().trim() || null,
        prev_partner:  b.prev_partner?.trim() || null,
        value_proposition: b.value_proposition?.trim() || null,
        target_market:     b.target_market?.trim() || null,
        expected_revenue:  b.expected_revenue || null,
      });
      return { id, reference_no };
    });
    notifyTelegramTrigger(
      'newRegistration',
      `<b>ATLINE SDN BHD</b>\n🤝 New Partner Application\nCompany: ${b.company.trim()}\nRef: ${result.reference_no}`,
    ).catch(() => {});
    return res.status(201).json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
