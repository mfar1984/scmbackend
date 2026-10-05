import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { getEssSession } from '@/lib/essAuth';
import { notifyHrSubmission } from '@/lib/notify';
import { logAudit } from '@/lib/logger';

export const config = { api: { bodyParser: { sizeLimit: '12mb' } } };
const validDoc = (v: any) => (typeof v === 'string' && v.startsWith('data:') && v.length < 8_000_000) ? v : null;

async function nextRef(trx: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `EXP-${year}-`;
  const last = await trx('hr_expense_applications').where('reference_no', 'like', `${prefix}%`).orderBy('id', 'desc').first();
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
      const rows = await db('hr_expense_applications as a')
        .leftJoin('hr_expense_categories as c', 'c.id', 'a.category_id')
        .select('a.id', 'a.reference_no', 'a.expense_date', 'a.vendor_name', 'a.amount', 'a.status', 'c.name as category_name',
          db.raw('(SELECT COUNT(*) FROM hr_expense_items i WHERE i.expense_id = a.id) AS item_count'))
        .where('a.employee_id', sess.employeeId)
        .orderBy('a.id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.category_id) return res.status(400).json({ success: false, message: 'Category is required.' });
    const items = Array.isArray(b.items) ? b.items : [];
    if (items.length === 0) return res.status(400).json({ success: false, message: 'At least one expense item is required.' });
    try {
      const itemsTotal = items.reduce((s: number, it: any) => s + ((parseFloat(it.qty) || 0) * (parseFloat(it.unit_price) || 0)), 0);
      const tax = parseFloat(b.tax_amount) || 0;
      const total = itemsTotal + tax;
      const result = await db.transaction(async (trx) => {
        const reference_no = await nextRef(trx);
        const [id] = await trx('hr_expense_applications').insert({
          reference_no, employee_id: sess.employeeId, category_id: b.category_id,
          expense_date: b.expense_date || null, vendor_name: b.vendor_name?.trim() || null,
          invoice_number: b.invoice_number?.trim() || null, payment_method: b.payment_method || null,
          payment_reference: b.payment_reference?.trim() || null, tax_amount: tax, amount: total,
          description: b.description?.trim() || null, remarks: b.remarks?.trim() || null,
          receipt: validDoc(b.receipt), receipt_name: b.receipt_name?.trim() || null, status: 'Pending',
        });
        for (const it of items) {
          const qty = parseFloat(it.qty) || 0; const unit = parseFloat(it.unit_price) || 0;
          await trx('hr_expense_items').insert({ expense_id: id, item_date: it.item_date || null, description: it.description?.trim() || null, qty, unit_price: unit, amount: qty * unit });
        }
        return { id, reference_no };
      });
      await notifyHrSubmission({ type: 'expense', employeeId: sess.employeeId, refId: result.id, referenceNo: result.reference_no, detail: `RM ${total.toLocaleString('en-MY', { minimumFractionDigits: 2 })}` });
      await logAudit(req, { action: 'CREATE', module: 'Expense', target: `Expense: ${result.reference_no}`, description: `Submitted expense claim (RM ${total.toLocaleString('en-MY', { minimumFractionDigits: 2 })})` });
      return res.status(201).json({ success: true, ...result });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
