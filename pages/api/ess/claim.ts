import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getEssSession } from '@/lib/essAuth';
import { notifyHrSubmission } from '@/lib/notify';
import { logAudit } from '@/lib/logger';

export const config = { api: { bodyParser: { sizeLimit: '12mb' } } };
const validDoc = (v: any) => (typeof v === 'string' && v.startsWith('data:') && v.length < 8_000_000) ? v : null;

async function nextRef(trx: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CLM-${year}-`;
  const last = await trx('hr_claim_applications').where('reference_no', 'like', `${prefix}%`).orderBy('id', 'desc').first();
  let seq = 1;
  if (last?.reference_no) { const n = parseInt(String(last.reference_no).split('-').pop() || '0'); if (!isNaN(n)) seq = n + 1; }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sess = await getEssSession(req);
  if (!sess) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  if (!sess.employeeId) return res.status(403).json({ success: false, message: 'Account not linked to an employee.' });

  if (req.method === 'GET') {
    try {
      const rows = await db('hr_claim_applications as a')
        .leftJoin('hr_claim_types as t', 't.id', 'a.claim_type_id')
        .select('a.id', 'a.reference_no', 'a.claim_date', 'a.amount', 'a.description', 'a.status',
          't.name as claim_type_name', 't.color as claim_type_color',
          db.raw('(SELECT COUNT(*) FROM hr_claim_items i WHERE i.claim_id = a.id) AS item_count'))
        .where('a.employee_id', sess.employeeId)
        .orderBy('a.id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.claim_type_id) return res.status(400).json({ success: false, message: 'Claim type is required.' });
    const items = Array.isArray(b.items) ? b.items : [];
    if (items.length === 0) return res.status(400).json({ success: false, message: 'At least one claim item is required.' });
    try {
      const total = items.reduce((s: number, it: any) => s + (parseFloat(it.amount) || 0), 0);
      const result = await db.transaction(async (trx) => {
        const reference_no = await nextRef(trx);
        const [id] = await trx('hr_claim_applications').insert({
          reference_no, employee_id: sess.employeeId, claim_type_id: b.claim_type_id,
          claim_date: b.claim_date || null, amount: total,
          description: b.description?.trim() || null, remarks: b.remarks?.trim() || null, status: 'Pending',
        });
        for (const it of items) {
          await trx('hr_claim_items').insert({
            claim_id: id, item_date: it.item_date || null, description: it.description?.trim() || null,
            category_id: it.category_id || null, amount: parseFloat(it.amount) || 0,
            remarks: it.remarks?.trim() || null, receipt: validDoc(it.receipt), receipt_name: it.receipt_name?.trim() || null,
          });
        }
        return { id, reference_no };
      });
      await notifyHrSubmission({ type: 'claim', employeeId: sess.employeeId, refId: result.id, referenceNo: result.reference_no, detail: `RM ${total.toLocaleString('en-MY', { minimumFractionDigits: 2 })}` });
      await logAudit(req, { action: 'CREATE', module: 'Claim', target: `Claim: ${result.reference_no}`, description: `Submitted claim (RM ${total.toLocaleString('en-MY', { minimumFractionDigits: 2 })})` });
      return res.status(201).json({ success: true, ...result });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
