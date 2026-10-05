// Generate an A5 bilingual (BM / English) payslip in a print window.
// Pure DOM string — no dependencies. Matches the company pay-slip layout.

const esc = (s: any) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
const money = (v: any) => Number(v || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 });

function fmtDateFallback(d: any): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

type DateFmt = (d: any, includeTime?: boolean) => string;

// `fmt` is the config-aware formatter from useDateFormat(); callers should pass it
// so the printed payslip follows the admin's Locale & Regional settings.
export function printPayslipA5(ps: any, fmt?: DateFmt) {
  const fmtDate = (d: any) => (fmt ? fmt(d) : fmtDateFallback(d));
  const co = ps.company || {};
  const now = new Date();
  const printedAt = fmt ? fmt(now, true) : `${now.toLocaleDateString('en-GB')}, ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

  const earnRows: string[] = [];
  earnRows.push(`<tr><td>Gaji Asas / Basic Salary</td><td class="r">${money(ps.basic_salary)}</td></tr>`);
  if (Number(ps.allowances) > 0) earnRows.push(`<tr><td>Elaun / Allowances</td><td class="r">${money(ps.allowances)}</td></tr>`);
  if (Number(ps.bonus) > 0) earnRows.push(`<tr><td>Bonus</td><td class="r">${money(ps.bonus)}</td></tr>`);
  if (Number(ps.commission) > 0) earnRows.push(`<tr><td>Komisen / Commission</td><td class="r">${money(ps.commission)}</td></tr>`);
  if (Number(ps.overtime) > 0) earnRows.push(`<tr><td>Kerja Lebih Masa / Overtime</td><td class="r">${money(ps.overtime)}</td></tr>`);
  if (Number(ps.claims) > 0) earnRows.push(`<tr><td>Tuntutan / Claims</td><td class="r">${money(ps.claims)}</td></tr>`);

  const dedRows: string[] = [];
  dedRows.push(`<tr><td>KWSP Pekerja / EPF Employee</td><td class="r">${money(ps.epf_employee)}</td></tr>`);
  dedRows.push(`<tr><td>PERKESO Pekerja / SOCSO Employee</td><td class="r">${money(ps.socso_employee)}</td></tr>`);
  dedRows.push(`<tr><td>SIP / EIS</td><td class="r">${money(ps.eis_employee)}</td></tr>`);
  if (Number(ps.loan_deduction) > 0) dedRows.push(`<tr><td>Pinjaman / Loan</td><td class="r">${money(ps.loan_deduction)}</td></tr>`);
  if (Number(ps.advance_deduction) > 0) dedRows.push(`<tr><td>Pendahuluan / Advance</td><td class="r">${money(ps.advance_deduction)}</td></tr>`);

  // pad both columns to equal length
  const maxRows = Math.max(earnRows.length, dedRows.length);
  while (earnRows.length < maxRows) earnRows.push('<tr><td>&nbsp;</td><td class="r"></td></tr>');
  while (dedRows.length < maxRows) dedRows.push('<tr><td>&nbsp;</td><td class="r"></td></tr>');

  const logoHtml = co.logo
    ? `<img src="${esc(co.logo)}" alt="logo" style="max-height:54px;max-width:160px;object-fit:contain;" />`
    : `<div style="font-size:18px;font-weight:600;color:#1e3a8a;">${esc(co.name)}</div>`;

  const html = `<!doctype html><html><head><meta charset="utf-8" />
<title>Payslip ${esc(ps.payslip_no)}</title>
<style>
  @page { size: A5 landscape; margin: 8mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; margin: 0; font-size: 10px; }
  .sheet { width: 100%; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; margin-bottom: 8px; }
  .co-right { text-align: right; font-size: 9px; color: #374151; line-height: 1.5; }
  .co-name { font-size: 13px; font-weight: 700; color: #111827; }
  .title-bar { background: #1e3a8a; color: #fff; text-align: center; font-weight: 600; padding: 6px; letter-spacing: 1px; font-size: 11px; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; }
  .info td { padding: 3px 6px; font-size: 9.5px; vertical-align: top; }
  .info .lbl { color: #6b7280; width: 22%; }
  .info .val { color: #111827; width: 28%; }
  .grid { display: flex; gap: 0; margin-top: 8px; border: 1px solid #c7d2fe; }
  .col { width: 50%; }
  .col + .col { border-left: 1px solid #c7d2fe; }
  .col-head { background: #1e3a8a; color: #fff; font-weight: 600; padding: 5px 8px; font-size: 10px; display: flex; justify-content: space-between; }
  .lines td { padding: 4px 8px; font-size: 9.5px; border-bottom: 1px solid #eef2ff; }
  .lines td.r { text-align: right; }
  .subtotal { background: #eef2ff; font-weight: 600; }
  .subtotal td { padding: 5px 8px; font-size: 10px; }
  .net-bar { background: #15803d; color: #fff; display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; margin-top: 8px; font-weight: 700; font-size: 13px; }
  .emp-ref { background: #eef2ff; border: 1px solid #c7d2fe; margin-top: 8px; padding: 6px 10px; font-size: 8.5px; color: #1e3a8a; text-align: center; line-height: 1.6; }
  .foot { display: flex; justify-content: space-between; margin-top: 6px; font-size: 7.5px; color: #6b7280; }
  .printed { text-align: center; font-size: 7.5px; color: #9ca3af; margin-top: 4px; }
</style></head><body onload="window.print()">
<div class="sheet">
  <div class="top">
    <div>${logoHtml}</div>
    <div class="co-right">
      <div class="co-name">${esc(co.name)}</div>
      <div>${esc(co.address)}</div>
      <div>Tel: ${esc(co.phone)} | Email: ${esc(co.email)}</div>
      ${co.reg_no ? `<div>SSM: ${esc(co.reg_no)}</div>` : ''}
    </div>
  </div>

  <div class="title-bar">SLIP GAJI / PAY SLIP</div>

  <table class="info">
    <tr>
      <td class="lbl">Nama / Name:</td><td class="val">${esc(ps.employee_name)}</td>
      <td class="lbl">Jabatan / Department:</td><td class="val">${esc(ps.department_name || '—')}</td>
    </tr>
    <tr>
      <td class="lbl">No. K/P / IC No:</td><td class="val">${esc(ps.nric_passport || '—')}</td>
      <td class="lbl">Tempoh Gaji / Pay Period:</td><td class="val">${esc(ps.period_name)}</td>
    </tr>
    <tr>
      <td class="lbl">No. Pekerja / Employee No:</td><td class="val">${esc(ps.employee_code || '—')}</td>
      <td class="lbl">Tarikh Bayaran / Payment Date:</td><td class="val">${fmtDate(ps.period_pay_date)}</td>
    </tr>
    <tr>
      <td class="lbl">No. Slip Gaji / Payslip No:</td><td class="val">${esc(ps.payslip_no)}</td>
      <td class="lbl">Bank / Akaun:</td><td class="val">${esc(ps.bank_name || '—')}${ps.bank_account_no ? ` (${esc(ps.bank_account_no)})` : ''}</td>
    </tr>
  </table>

  <div class="grid">
    <div class="col">
      <div class="col-head"><span>PEROLEHAN / EARNINGS</span><span>RM</span></div>
      <table class="lines"><tbody>${earnRows.join('')}</tbody></table>
      <table class="lines"><tbody><tr class="subtotal"><td>Jumlah Perolehan Kasar / Gross Salary</td><td class="r">${money(ps.gross_salary)}</td></tr></tbody></table>
    </div>
    <div class="col">
      <div class="col-head"><span>POTONGAN / DEDUCTIONS</span><span>RM</span></div>
      <table class="lines"><tbody>${dedRows.join('')}</tbody></table>
      <table class="lines"><tbody><tr class="subtotal"><td>Jumlah Potongan / Total Deductions</td><td class="r">${money(ps.total_deductions)}</td></tr></tbody></table>
    </div>
  </div>

  <div class="net-bar"><span>GAJI BERSIH / NET SALARY</span><span>RM ${money(ps.net_salary)}</span></div>

  <div class="emp-ref">
    <strong>CARUMAN MAJIKAN / EMPLOYER CONTRIBUTIONS (Untuk Rujukan / For Reference)</strong><br/>
    KWSP Majikan / EPF Employer: RM ${money(ps.epf_employer)} &nbsp;&nbsp;|&nbsp;&nbsp;
    PERKESO Majikan / SOCSO Employer: RM ${money(ps.socso_employer)} &nbsp;&nbsp;|&nbsp;&nbsp;
    SIP / EIS Employer: RM ${money(ps.eis_employer)}
  </div>

  <div class="foot">
    <span>* Slip gaji ini dijana secara automatik dan tidak memerlukan tandatangan.</span>
    <span>* This payslip is computer-generated and does not require a signature.</span>
  </div>
  <div class="printed">Dicetak pada / Printed on: ${printedAt}</div>
</div>
</body></html>`;

  const w = window.open('', '_blank', 'width=900,height=650');
  if (!w) { alert('Please allow pop-ups to print the payslip.'); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
