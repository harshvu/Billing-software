import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/Navbar';

function Field({ label, name, textarea, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">{label}</label>
      {textarea ? (
        <textarea name={name} value={value || ''} onChange={onChange} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy/30" />
      ) : (
        <input name={name} value={value || ''} onChange={onChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy/30" />
      )}
    </div>
  );
}

export default function Settings() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then((res) => setForm(res.data.settings));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/settings', form);
      setForm(res.data.settings);
      toast.success('Company settings updated.');
    } catch (err) {
      toast.error('Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <div className="min-h-screen bg-gray-100"><Navbar /><div className="p-8 text-sm text-gray-500">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-navy mb-1">Company Settings</h1>
        <p className="text-sm text-gray-500 mb-6">These details appear on every generated invoice PDF</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Company Name" name="company_name" value={form.company_name} onChange={handleChange} />
          <Field label="GSTIN" name="gstin" value={form.gstin} onChange={handleChange} />
          <Field label="PAN" name="pan" value={form.pan} onChange={handleChange} />
          <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} />
          <Field label="Logo Text" name="logo_text" value={form.logo_text} onChange={handleChange} />
          <div className="md:col-span-2"><Field label="Address" name="address" textarea value={form.address} onChange={handleChange} /></div>
          <Field label="Bank Account Name" name="bank_account_name" value={form.bank_account_name} onChange={handleChange} />
          <Field label="Bank Account Number" name="bank_account_no" value={form.bank_account_no} onChange={handleChange} />
          <Field label="IFSC Code" name="bank_ifsc" value={form.bank_ifsc} onChange={handleChange} />
          <Field label="UPI ID" name="upi_id" value={form.upi_id} onChange={handleChange} />
          <Field label="Default GST Rate (%)" name="default_gst_rate" value={form.default_gst_rate} onChange={handleChange} />

          <div className="md:col-span-2 flex justify-end mt-2">
            <button disabled={saving} type="submit" className="bg-gold text-navy font-bold px-8 py-2.5 rounded-lg shadow disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
