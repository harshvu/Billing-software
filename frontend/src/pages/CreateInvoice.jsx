import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { INDIAN_STATES } from '../constants/indianStates';

const emptyItem = () => ({ particulars: '', hsn: '', qty: 1, rate: 0 });
const firstItem = () => ({ particulars: 'Consulting Charges', hsn: '', qty: 1, rate: 0 });

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [branch, setBranch] = useState('Vadodara');

  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientGstin, setClientGstin] = useState('');

  const [applyGst, setApplyGst] = useState(true);
  const [gstState, setGstState] = useState('');
  const [gstType, setGstType] = useState('igst');

  const [items, setItems] = useState([firstItem()]);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    api.get('/settings').then((res) => setSettings(res.data.settings)).catch(() => {});
  }, []);

  const updateItem = (idx, field, value) => {
    const copy = [...items];
    copy[idx][field] = value;
    setItems(copy);
  };

  const addRow = () => setItems([...items, emptyItem()]);
  const removeRow = (idx) => setItems(items.filter((_, i) => i !== idx));

  const subTotal = items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
  const gstRate = Number(settings?.default_gst_rate || 18);
  const gstAmount = applyGst ? +(subTotal * (gstRate / 100)).toFixed(2) : 0;
  const grandTotal = +(subTotal + gstAmount).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientName.trim()) return toast.error('Client name is required.');
    if (items.some((it) => !it.particulars.trim())) return toast.error('Every line item needs a description.');

    setSaving(true);
    try {
      const payload = {
        invoice_type: 'proforma',
        invoice_date: invoiceDate,
        branch,
        client_name: clientName,
        client_address: clientAddress,
        client_phone: clientPhone,
        client_gstin: clientGstin,
        client_state: gstState,
        apply_gst: applyGst,
        gst_rate: gstRate,
        gst_type: gstType,
        remarks,
        items,
      };
      const res = await api.post('/invoices', payload);
      toast.success(`Invoice ${res.data.invoice.invoice_number} created successfully.`);
      navigate(`/invoices/${res.data.invoice.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invoice.');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <Navbar />
      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-navy">Create Invoice</h1>
            <p className="text-sm text-gray-500">Fill in the details below to generate a new invoice</p>
          </div>
          <span className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-semibold text-navy bg-gray-50">Proforma Invoice</span>
        </div>

        {/* Invoice Setup */}
        <div className="bg-navy rounded-t-xl px-6 py-3 flex items-center justify-between">
          <span className="text-white font-bold text-sm">📄 Invoice Setup</span>
          {settings && <span className="text-gold text-xs font-bold">{settings.company_name}</span>}
        </div>
        <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 border-t-0 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="text-xs font-bold text-navy uppercase mb-3">👤 Billing To</div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Client Name</label>
            <input required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Enter Client Name" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-navy/30" />

            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Address</label>
            <textarea value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="Enter Client Address" rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-navy/30" />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Phone</label>
                <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Phone No" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">GSTIN/PAN</label>
                <input value={clientGstin} onChange={(e) => setClientGstin(e.target.value)} placeholder="GSTIN or PAN (optional)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy/30" />
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-navy uppercase mb-3">ⓘ Invoice Details</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Invoice Number</label>
                <input disabled value="Auto-generated on save" className="w-full border border-gray-200 bg-gray-50 text-gray-400 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Invoice Date</label>
                <input type="date" required value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy/30" />
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 mb-3">
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Branch Origin</label>
              <input value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-navy/30" />
              {settings && <div className="text-xs text-gray-500">📞 {settings.phone}<br />📍 {settings.address}</div>}
            </div>

            <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-navy mb-2">
                <input type="checkbox" checked={applyGst} onChange={(e) => setApplyGst(e.target.checked)} className="w-4 h-4" />
                Apply GST to this invoice
              </label>
              {applyGst && (
                <div className="grid grid-cols-2 gap-2">
                  <select value={gstState} onChange={(e) => setGstState(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">-- Select State for GST --</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={gstType} onChange={(e) => setGstType(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="igst">IGST ({gstRate}%)</option>
                    <option value="cgst_sgst">CGST + SGST ({gstRate}%)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-gold rounded-t-xl px-6 py-3 flex items-center justify-between">
          <span className="text-navy font-bold text-sm">≡ Items / Particulars</span>
          <button type="button" onClick={addRow} className="bg-green-600 hover:bg-green-700 transition text-white text-xs font-bold px-4 py-1.5 rounded-full">+ Add New Row</button>
        </div>
        <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 border-t-0 overflow-x-auto mb-6">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-navy text-white text-xs uppercase">
                <th className="text-left px-4 py-3 w-10">#</th>
                <th className="text-left px-4 py-3">Particulars</th>
                <th className="text-left px-4 py-3 w-28">HSN</th>
                <th className="text-left px-4 py-3 w-20">Qty</th>
                <th className="text-left px-4 py-3 w-32">Rate / MRP</th>
                <th className="text-right px-4 py-3 w-32">Amount</th>
                <th className="px-4 py-3 w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-2">
                    <input required value={it.particulars} onChange={(e) => updateItem(idx, 'particulars', e.target.value)} placeholder="e.g. Consultancy Services" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
                  </td>
                  <td className="px-4 py-2">
                    <input value={it.hsn} onChange={(e) => updateItem(idx, 'hsn', e.target.value)} placeholder="998312" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min="0" step="0.01" value={it.qty} onChange={(e) => updateItem(idx, 'qty', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min="0" step="0.01" value={it.rate} onChange={(e) => updateItem(idx, 'rate', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
                  </td>
                  <td className="px-4 py-2 text-right font-semibold">{fmt((it.qty || 0) * (it.rate || 0))}</td>
                  <td className="px-4 py-2 text-center">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeRow(idx)} className="text-red-500 hover:text-red-700">🗑</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="text-xs font-bold text-navy uppercase mb-3">🏦 Bank Details</div>
            {settings ? (
              <div className="text-sm space-y-2 text-gray-700">
                <div><span className="text-gray-500">Account Name: </span><span className="font-semibold">{settings.bank_account_name}</span></div>
                <div><span className="text-gray-500">Account No: </span><span className="font-semibold">{settings.bank_account_no}</span></div>
                <div><span className="text-gray-500">IFSC Code: </span><span className="font-semibold">{settings.bank_ifsc}</span></div>
                {settings.bank_branch && <div><span className="text-gray-500">Branch: </span><span className="font-semibold">{settings.bank_branch}</span></div>}
                <div><span className="text-gray-500">UPI ID: </span><span className="font-semibold">{settings.upi_id}</span></div>
              </div>
            ) : <div className="text-sm text-gray-400">Loading...</div>}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="text-xs font-bold text-navy uppercase mb-3">🧾 Invoice Summary</div>
            {applyGst ? (
              <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                <span>Sub-Total</span><span className="font-semibold">{fmt(subTotal)} + {gstRate}% GST</span>
              </div>
            ) : (
              <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                <span>Sub-Total</span><span className="font-semibold">{fmt(subTotal)}</span>
              </div>
            )}
            <div className="flex justify-between items-center bg-navy text-white rounded-lg px-4 py-3 mt-3">
              <span className="font-bold text-sm">Grand Total</span>
              <span className="font-extrabold text-lg text-gold">{fmt(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="text-xs font-bold text-navy uppercase mb-3">📝 Remarks / Terms</div>
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} placeholder="Optional notes or payment terms" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy/30" />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/invoices')} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-semibold text-sm">Cancel</button>
          <button disabled={saving} type="submit" className="bg-gold text-navy font-bold px-8 py-2.5 rounded-lg shadow disabled:opacity-60">
            {saving ? 'Saving...' : 'Save & Generate Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
