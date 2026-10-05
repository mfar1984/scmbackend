import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import { notifyHrSubmission } from '@/lib/notify';
import { requirePermission } from '@/lib/serverPermissions';

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
  if (req.method === 'GET') {
    try {
      const rows = await db('hr_expense_applications as a')
        .select('a.id', 'a.reference_no', 'a.employee_id', 'a.category_id', 'a.expense_date',
                'a.vendor_name', 'a.invoice_number', 'a.payment_method', 'a.amount', 'a.tax_amount',
                'a.description', 'a.status', 'a.created_at', 'a.receipt_name',
                'e.full_name as employee_name', 'e.employee_id as employee_code', 'c.name as category_name',
                db.raw("(a.receipt LIKE 'data:%') AS has_receipt"),
                db.raw('(SELECT COUNT(*) FROM hr_expense_items i WHERE i.expense_id = a.id) AS item_count'))
        .leftJoin('hr_employees as e', 'e.id', 'a.employee_id')
        .leftJoin('hr_expense_categories as c', 'c.id', 'a.category_id')
        .orderBy('a.id', 'desc');
      return res.status(200).json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  if (req.method === 'POST') {
    if (!(await requirePermission(req, res, 'hr.expenses.application', 'Create'))) return;
    const b = req.body || {};
    if (!b.employee_id) return res.status(400).json({ success: false, message: 'Employee is required.' });
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
          reference_no,
          employee_id: b.employee_id,
          category_id: b.category_id,
          expense_date: b.expense_date || null,
          vendor_name: b.vendor_name?.trim() || null,
          invoice_number: b.invoice_number?.trim() || null,
          payment_method: b.payment_method || null,
          payment_reference: b.payment_reference?.trim() || null,
          tax_amount: tax,
          amount: total,
          description: b.description?.trim() || null,
          remarks: b.remarks?.trim() || null,
          receipt: validDoc(b.receipt),
          receipt_name: b.receipt_name?.trim() || null,
          status: 'Pending',
        });
        for (const it of items) {
          const qty = parseFloat(it.qty) || 0;
          const unit = parseFloat(it.unit_price) || 0;
          await trx('hr_expense_items').insert({
            expense_id: id,
            item_date: it.item_date || null,
            description: it.description?.trim() || null,
            qty, unit_price: unit, amount: qty * unit,
          });
        }
        return { id, reference_no };
      });
      await notifyHrSubmission({ type: 'expense', employeeId: b.employee_id, refId: result.id, referenceNo: result.reference_no, detail: `RM ${total.toLocaleString('en-MY', { minimumFractionDigits: 2 })}` });
      return res.status(201).json({ success: true, ...result });
    } catch (err: any) { return res.status(500).json({ success: false, message: err.message }); }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed.' });
}
