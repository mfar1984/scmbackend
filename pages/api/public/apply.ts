import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

// Allow larger JSON bodies for base64-encoded document uploads
export const config = {
  api: {
    bodyParser: { sizeLimit: '12mb' },
  },
};

/**
 * PUBLIC endpoint — receives a job application submitted from the
 * atlinewebsite career page. Creates a row in hr_applicants (status Pending).
 */
function applyCors(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Reject oversized / wrong-type files server-side (defence-in-depth)
function validDataUrl(v: any): boolean {
  return typeof v === 'string' && v.startsWith('data:') && v.length < 12_000_000;
}

async function nextApplicationNo(trx: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `APP-${year}-`;
  const last = await trx('hr_applicants')
    .where('application_no', 'like', `${prefix}%`)
    .orderBy('id', 'desc')
    .first();
  let seq = 1;
  if (last?.application_no) {
    const n = parseInt(String(last.application_no).split('-').pop() || '0');
    if (!isNaN(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  applyCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed.' });

  const b = req.body || {};
  if (!b.full_name?.trim()) return res.status(400).json({ success: false, message: 'Full name is required.' });
  if (!b.email?.trim())     return res.status(400).json({ success: false, message: 'Email is required.' });

  try {
    const result = await db.transaction(async (trx) => {
      const application_no = await nextApplicationNo(trx);

      // resolve position/department from posting if provided
      let position = b.position_applied?.trim() || null;
      let department = b.department?.trim() || null;
      let department_id: number | null = null;
      let position_id: number | null = null;
      let employment_type_id: number | null = null;
      if (b.posting_id) {
        const posting = await trx('hr_career_postings').where({ id: b.posting_id }).first();
        if (posting) {
          position   = position   || posting.title;
          department = department || posting.department;
          department_id      = posting.department_id || null;
          position_id        = posting.position_id || null;
          employment_type_id = posting.employment_type_id || null;
        }
      }

      const [id] = await trx('hr_applicants').insert({
        application_no,
        posting_id:       b.posting_id || null,
        position_applied: position,
        department,
        department_id,
        position_id,
        employment_type_id,
        status:           'Pending',

        full_name:      b.full_name.trim(),
        ic_number:      b.ic_number?.trim() || null,
        email:          b.email.trim(),
        phone:          b.phone?.trim() || null,
        alt_phone:      b.alt_phone?.trim() || null,
        date_of_birth:  b.date_of_birth || null,
        gender:         b.gender || null,
        nationality:    b.nationality || null,
        religion:       b.religion || null,
        marital_status: b.marital_status || null,

        ic_address:   b.ic_address?.trim() || null,
        ic_postcode:  b.ic_postcode?.trim() || null,
        ic_city:      b.ic_city?.trim() || null,
        ic_state:     b.ic_state || null,
        ic_country:   b.ic_country || null,
        cur_address:  b.cur_address?.trim() || null,
        cur_postcode: b.cur_postcode?.trim() || null,
        cur_city:     b.cur_city?.trim() || null,
        cur_state:    b.cur_state || null,
        cur_country:  b.cur_country || null,

        emg_name:         b.emg_name?.trim() || null,
        emg_relationship: b.emg_relationship?.trim() || null,
        emg_phone:        b.emg_phone?.trim() || null,
        emg_email:        b.emg_email?.trim() || null,
        emg_address:      b.emg_address?.trim() || null,

        education:        b.education || null,
        field_of_study:   b.field_of_study?.trim() || null,
        years_experience: b.years_experience || null,
        last_position:    b.last_position?.trim() || null,
        last_employer:    b.last_employer?.trim() || null,
        expected_salary:  b.expected_salary !== '' && b.expected_salary != null ? b.expected_salary : null,
        notice_period:    b.notice_period || null,
        available_start:  b.available_start || null,
        hear_about:       b.hear_about || null,
        cover_message:    b.cover_message?.trim() || null,

        doc_passport:     validDataUrl(b.doc_passport) ? b.doc_passport : null,
        doc_resume:       validDataUrl(b.doc_resume) ? b.doc_resume : null,
        doc_cover_letter: validDataUrl(b.doc_cover_letter) ? b.doc_cover_letter : null,
        doc_passport_name:     b.doc_passport_name?.trim() || null,
        doc_resume_name:       b.doc_resume_name?.trim() || null,
        doc_cover_letter_name: b.doc_cover_letter_name?.trim() || null,
      });

      return { id, application_no };
    });

    return res.status(201).json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
