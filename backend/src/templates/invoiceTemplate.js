// Builds the HTML string rendered to PDF via Puppeteer.
// Visual design mirrors the reference "BUSINESSMINT SOLUTION" Proforma / Tax Invoice layout.

const fs = require('fs');
const path = require('path');

const logoDataUri = (() => {
  const buf = fs.readFileSync(path.join(__dirname, '..', 'assets', 'logo.png'));
  return `data:image/png;base64,${buf.toString('base64')}`;
})();

const sealDataUri = (() => {
  const buf = fs.readFileSync(path.join(__dirname, '..', 'assets', 'seal.jpg'));
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
})();

function formatCurrency(num) {
  const n = Number(num) || 0;
  return '\u20B9 ' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

function buildInvoiceHTML({ invoice, items, settings, qrDataUrl }) {
  const isTax = invoice.invoice_type === 'tax';
  const docTitle = isTax ? 'TAX INVOICE' : 'PROFORMA INVOICE';

  const gstLabel = invoice.gst_type === 'cgst_sgst'
    ? `CGST (${(invoice.gst_rate / 2).toFixed(1)}%) + SGST (${(invoice.gst_rate / 2).toFixed(1)}%)`
    : `IGST (${Number(invoice.gst_rate).toFixed(0)}%)`;

  const itemRows = items.map((it) => `
    <tr>
      <td class="c">${it.s_no}</td>
      <td>${it.particulars}</td>
      <td class="c">${it.hsn || ''}</td>
      <td class="c">${Number(it.qty)}</td>
      <td class="r">${formatCurrency(it.rate)}</td>
      <td class="r b">${formatCurrency(it.amount)}</td>
    </tr>
  `).join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        color: #1f2937;
        font-size: 12px;
        padding: 30px 36px;
      }
      .header {
        background: linear-gradient(135deg, #2d4a28, #1f341c);
        color: #fff;
        border-radius: 10px;
        padding: 22px 28px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .logo-box {
        display: inline-block;
        margin-bottom: 14px;
        line-height: 0;
      }
      .logo-box img { height: 68px; width: auto; display: block; }
      .header-right { text-align: right; font-size: 10.5px; line-height: 1.6; color: #dce8d6; }
      .header-right .company-name { color: #f0a500; font-weight: 700; font-size: 11px; margin-bottom: 4px; }
      .doc-label { font-size: 10px; letter-spacing: 3px; color: #aecaa4; margin-top: 4px; }
      .doc-title { font-size: 24px; font-weight: 800; margin-top: 4px; }
      .doc-sub { font-size: 10.5px; color: #d0ddc9; margin-top: 6px; max-width: 380px; }

      .row { display: flex; gap: 18px; margin-top: 18px; }
      .box {
        border: 1px solid #e5e9f0;
        border-radius: 8px;
        padding: 14px 16px;
        flex: 1;
        background: #fafbfd;
      }
      .box-title {
        font-size: 10px;
        font-weight: 700;
        color: #2d4a28;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }
      .client-name { font-size: 14px; font-weight: 800; margin-bottom: 6px; }
      .muted { color: #566073; line-height: 1.5; }
      .field-box { background: #fff; border: 1px solid #e5e9f0; border-radius: 6px; padding: 8px 10px; margin-bottom: 8px; }
      .field-label { font-size: 8.5px; color: #8b93a3; text-transform: uppercase; letter-spacing: 0.4px; }
      .field-value { font-size: 12.5px; font-weight: 700; margin-top: 2px; }
      .generated-by { font-size: 10px; color: #8b93a3; margin-top: 6px; }
      .generated-by b { color: #374151; }

      table.items { width: 100%; border-collapse: collapse; margin-top: 18px; border-radius: 8px; overflow: hidden; }
      table.items thead th {
        background: #2d4a28;
        color: #fff;
        font-size: 9.5px;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        padding: 10px 10px;
        text-align: left;
      }
      table.items tbody td {
        padding: 9px 10px;
        border-bottom: 1px solid #eef0f4;
        font-size: 11.5px;
      }
      table.items tbody tr:nth-child(even) { background: #fafbfd; }
      .c { text-align: center; }
      .r { text-align: right; }
      .b { font-weight: 700; }

      .bottom-row { display: flex; gap: 18px; margin-top: 18px; align-items: stretch; }
      .bank-box { flex: 1.15; border: 1px solid #e5e9f0; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; gap: 14px; }
      .bank-details div.line { margin-bottom: 6px; font-size: 11px; }
      .bank-details .label { color: #566073; }
      .bank-details .value { font-weight: 700; }
      .qr-wrap { text-align: center; }
      .qr-wrap img { width: 78px; height: 78px; border: 1px solid #e5e9f0; border-radius: 6px; padding: 4px; }
      .qr-wrap div { font-size: 9px; color: #8b93a3; margin-top: 4px; }

      .totals-box { flex: 0.9; display: flex; flex-direction: column; gap: 10px; }
      .totals-line { display: flex; justify-content: space-between; font-size: 11.5px; border: 1px solid #e5e9f0; border-radius: 8px; padding: 10px 14px; }
      .grand-total { background: #2d4a28; color: #fff; border-radius: 8px; padding: 14px; display: flex; justify-content: space-between; align-items: center; }
      .grand-total .label { font-size: 12px; font-weight: 700; }
      .grand-total .amount { font-size: 18px; font-weight: 800; color: #f0a500; }

      .signature-row { margin-top: 18px; display: flex; justify-content: flex-end; }
      .stamp { width: 128px; }
      .stamp img { width: 100%; height: auto; display: block; mix-blend-mode: multiply; }
      .auth-label { text-align: right; font-size: 9.5px; letter-spacing: 1.5px; color: #566073; margin-top: 6px; text-transform: uppercase; }

      .footer-note { text-align: center; color: #a1a8b3; font-size: 9.5px; margin-top: 26px; border-top: 1px solid #eef0f4; padding-top: 10px; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="logo-box"><img src="${logoDataUri}" alt="Business Mint" /></div>
        <div class="doc-label">OFFICIAL BILLING DOCUMENT</div>
        <div class="doc-title">${docTitle}</div>
        <div class="doc-sub">Professional invoice issued by ${settings.company_name}</div>
      </div>
      <div class="header-right">
        <div class="company-name">${settings.company_name}</div>
        ${settings.gstin ? `<div>GSTIN: ${settings.gstin}</div>` : ''}
        ${settings.pan ? `<div>PAN: ${settings.pan}</div>` : ''}
        <div>Phone: ${settings.phone || '-'}</div>
        <div>${settings.address || ''}</div>
      </div>
    </div>

    <div class="row">
      <div class="box">
        <div class="box-title">Billing To</div>
        <div class="client-name">${invoice.client_name}</div>
        <div class="muted">${invoice.client_address || ''}</div>
        <div class="muted" style="margin-top:6px;">Phone: ${invoice.client_phone || '-'}</div>
        ${invoice.client_gstin ? `<div class="muted">GSTIN/PAN: ${invoice.client_gstin}</div>` : ''}
        <div class="muted">State: ${invoice.client_state || '-'}</div>
      </div>
      <div class="box">
        <div class="box-title">Invoice Details</div>
        <div class="field-box">
          <div class="field-label">Invoice Number</div>
          <div class="field-value">${invoice.invoice_number}</div>
        </div>
        <div class="field-box">
          <div class="field-label">Invoice Date</div>
          <div class="field-value">${formatDate(invoice.invoice_date)}</div>
        </div>
        <div class="generated-by">Generated by: <b>${invoice.generated_by_name}</b></div>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th style="width:6%">S.No</th>
          <th style="width:36%">Particulars</th>
          <th style="width:14%" class="c">HSN</th>
          <th style="width:10%" class="c">Qty</th>
          <th style="width:16%" class="r">Rate</th>
          <th style="width:18%" class="r">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <div class="bottom-row">
      <div class="bank-box">
        <div class="bank-details">
          <div class="line"><span class="label">Account Name: </span><span class="value">${settings.bank_account_name}</span></div>
          <div class="line"><span class="label">Account No: </span><span class="value">${settings.bank_account_no}</span></div>
          <div class="line"><span class="label">IFSC Code: </span><span class="value">${settings.bank_ifsc}</span></div>
          ${settings.bank_branch ? `<div class="line"><span class="label">Branch: </span><span class="value">${settings.bank_branch}</span></div>` : ''}
          <div class="line"><span class="label">UPI ID: </span><span class="value">${settings.upi_id}</span></div>
        </div>
        <div class="qr-wrap">
          <img src="${qrDataUrl}" alt="QR" />
          <div>Scan to Pay</div>
        </div>
      </div>

      <div class="totals-box">
        <div class="totals-line"><span>Sub-Total</span><span class="b">${formatCurrency(invoice.sub_total)}</span></div>
        ${invoice.apply_gst ? `<div class="totals-line"><span>${gstLabel}</span><span class="b">${formatCurrency(invoice.gst_amount)}</span></div>` : ''}
        <div class="grand-total"><span class="label">GRAND TOTAL</span><span class="amount">${formatCurrency(invoice.grand_total)}</span></div>
      </div>
    </div>

    <div class="signature-row">
      <div>
        <div class="stamp"><img src="${sealDataUri}" alt="Company Seal" /></div>
        <div class="auth-label">Authorized Signatory</div>
      </div>
    </div>

    ${invoice.remarks ? `<div class="row"><div class="box"><div class="box-title">Remarks / Terms</div><div class="muted">${invoice.remarks}</div></div></div>` : ''}

    <div class="footer-note">This is a computer generated invoice.</div>
  </body>
  </html>
  `;
}

module.exports = { buildInvoiceHTML, formatCurrency, formatDate };
