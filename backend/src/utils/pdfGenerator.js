const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const { buildInvoiceHTML } = require('../templates/invoiceTemplate');

let browserPromise = null;

// Reuse a single browser instance across requests for performance.
function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserPromise;
}

async function generateInvoicePDF({ invoice, items, settings }) {
  const upiString = `upi://pay?pa=${settings.upi_id}&pn=${encodeURIComponent(settings.bank_account_name || settings.company_name)}&am=${invoice.grand_total}&cu=INR`;
  const qrDataUrl = await QRCode.toDataURL(upiString, { margin: 1, width: 200 });

  const html = buildInvoiceHTML({ invoice, items, settings, qrDataUrl });

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    return pdfBuffer;
  } finally {
    await page.close();
  }
}

module.exports = { generateInvoicePDF, getBrowser };
