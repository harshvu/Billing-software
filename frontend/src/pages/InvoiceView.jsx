import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

export default function InvoiceView() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    api.get(`/invoices/${id}`).then((res) => setInvoice(res.data.invoice)).finally(() => setLoading(false));
  }, [id]);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleConvertToTax = async () => {
    if (!window.confirm('Convert this Proforma Invoice into a Tax Invoice? This cannot be undone.')) return;
    setConverting(true);
    try {
      const res = await api.put(`/invoices/${id}/convert-to-tax`);
      setInvoice(res.data.invoice);
      toast.success('Invoice converted to Tax Invoice.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to convert invoice.');
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoice.invoice_number.replace('/', '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to generate PDF.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100"><Navbar /><div className="p-8 text-gray-500 text-sm">Loading...</div></div>;
  }
  if (!invoice) {
    return <div className="min-h-screen bg-gray-100"><Navbar /><div className="p-8 text-gray-500 text-sm">Invoice not found.</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/invoices" className="text-navy text-sm font-semibold hover:underline">← Back to Invoices</Link>
          <div className="flex gap-3">
            {isAdmin && invoice.invoice_type === 'proforma' && (
              <button onClick={handleConvertToTax} disabled={converting} className="bg-gold hover:brightness-95 transition text-navy font-semibold text-sm px-6 py-2.5 rounded-lg shadow disabled:opacity-60">
                {converting ? 'Converting...' : '🧾 Generate Tax Invoice'}
              </button>
            )}
            <button onClick={handleDownload} disabled={downloading} className="bg-navy hover:bg-navy-dark transition text-white font-semibold text-sm px-6 py-2.5 rounded-lg shadow disabled:opacity-60">
              {downloading ? 'Generating PDF...' : '⬇ Download PDF'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-br from-navy to-navy-dark text-white px-8 py-8">
            <img src={logo} alt="Business Mint" className="h-12 w-auto block mb-3" />
            <div className="text-xs tracking-[3px] text-blue-200">OFFICIAL BILLING DOCUMENT</div>
            <div className="text-2xl font-extrabold mt-1">{invoice.invoice_type === 'tax' ? 'TAX INVOICE' : 'PROFORMA INVOICE'}</div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="border border-gray-200 rounded-xl p-5">
                <div className="text-xs font-bold text-navy uppercase mb-2">Billing To</div>
                <div className="font-bold text-lg">{invoice.client_name}</div>
                <div className="text-sm text-gray-600 mt-1">{invoice.client_address}</div>
                <div className="text-sm text-gray-600 mt-2">Phone: {invoice.client_phone || '-'}</div>
                {invoice.client_gstin && <div className="text-sm text-gray-600">GSTIN: {invoice.client_gstin}</div>}
                <div className="text-sm text-gray-600">State: {invoice.client_state || '-'}</div>
              </div>
              <div className="border border-gray-200 rounded-xl p-5">
                <div className="text-xs font-bold text-navy uppercase mb-2">Invoice Details</div>
                <div className="text-sm text-gray-500">Invoice Number</div>
                <div className="font-bold mb-2">{invoice.invoice_number}</div>
                <div className="text-sm text-gray-500">Invoice Date</div>
                <div className="font-bold mb-2">{new Date(invoice.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <div className="text-xs text-gray-400">Generated by: <b className="text-gray-600">{invoice.generated_by_name}</b></div>
              </div>
            </div>

            <table className="w-full text-sm mb-6 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-navy text-white text-xs uppercase">
                  <th className="text-left px-4 py-3">S.No</th>
                  <th className="text-left px-4 py-3">Particulars</th>
                  <th className="text-center px-4 py-3">HSN</th>
                  <th className="text-center px-4 py-3">Qty</th>
                  <th className="text-right px-4 py-3">Rate</th>
                  <th className="text-right px-4 py-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((it) => (
                  <tr key={it.id} className="border-b border-gray-100">
                    <td className="px-4 py-3">{it.s_no}</td>
                    <td className="px-4 py-3">{it.particulars}</td>
                    <td className="px-4 py-3 text-center">{it.hsn}</td>
                    <td className="px-4 py-3 text-center">{Number(it.qty)}</td>
                    <td className="px-4 py-3 text-right">{fmt(it.rate)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmt(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-full md:w-72 space-y-2">
                <div className="flex justify-between text-sm"><span>Sub-Total</span><span className="font-semibold">{fmt(invoice.sub_total)}</span></div>
                {invoice.apply_gst && (
                  <div className="flex justify-between text-sm">
                    <span>{invoice.gst_type === 'igst' ? `IGST (${invoice.gst_rate}%)` : `CGST+SGST (${invoice.gst_rate}%)`}</span>
                    <span className="font-semibold">{fmt(invoice.gst_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-navy text-white rounded-lg px-4 py-3">
                  <span className="font-bold text-sm">Grand Total</span>
                  <span className="font-extrabold text-lg text-gold">{fmt(invoice.grand_total)}</span>
                </div>
              </div>
            </div>

            {invoice.remarks && (
              <div className="mt-6 border-t border-gray-100 pt-4">
                <div className="text-xs font-bold text-navy uppercase mb-1">Remarks / Terms</div>
                <div className="text-sm text-gray-600">{invoice.remarks}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
