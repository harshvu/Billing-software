import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { INDIAN_STATES } from '../constants/indianStates';
import { CRM_MODES } from '../constants/crm';

function Section({ number, icon, title, children, open, onToggle, badge }) {
  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={onToggle}
        className="w-full bg-navy rounded-t-xl px-6 py-3 flex items-center justify-between text-left"
      >
        <span className="text-white font-bold text-sm flex items-center gap-2">
          <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs">{number}</span>
          {icon} {title}
          {badge}
        </span>
        <span className="text-white">{open ? '⌃' : '⌄'}</span>
      </button>
      {open && (
        <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 border-t-0 p-6">
          {children}
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-navy/30';

const emptyForm = {
  company_name: '', cin_llp_no: '', company_email: '', company_mobile: '', contact_person: '',
  website: '', company_pan: '', gst_no: '', industry: '', sector: '', city: '', state: '', complete_address: '',
  user_remark: '',
  payment_contact_no: '', payment_email: '', startup_contact_no: '', startup_email: '',
  invoice_company_name: '', invoice_contact: '', invoice_email: '', invoice_pan: '', invoice_gst: '',
  invoice_commission: '',
};

const emptyService = () => ({
  service: '', mode: 'refundable', percentage: '', total_quoted_amount: '', booking_mode: '', after_success_payment: '', deal_remark: '',
});

const emptySchedule = () => ({
  payment_part1_amount: '', payment_part1_date: '',
  payment_part2_amount: '', payment_part2_date: '',
  payment_part3_amount: '', payment_part3_date: '',
  payment_part4_amount: '', payment_part4_date: '',
});

const fmtGst = (amount) => {
  const n = Number(amount);
  if (!amount && n !== 0) return '';
  return `₹${(n * 1.18).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function CrmSubmit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [form, setForm] = useState(emptyForm);
  const [isCombo, setIsCombo] = useState(false);
  const [services, setServices] = useState([emptyService()]);
  const [schedule, setSchedule] = useState(emptySchedule());
  const [employees, setEmployees] = useState([]);
  const [leadClosedById, setLeadClosedById] = useState('');
  const [leadClosedByEmail, setLeadClosedByEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState({ 1: true, 2: true, 3: true, 4: true, 5: true });

  useEffect(() => {
    if (isAdmin) {
      api.get('/employees').then((res) => setEmployees(res.data.employees)).catch(() => {});
    }
  }, [isAdmin]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const toggle = (n) => setOpen((o) => ({ ...o, [n]: !o[n] }));

  const sameAs = (targetField, sourceField) => (e) => {
    if (e.target.checked) {
      setForm((f) => ({ ...f, [targetField]: f[sourceField] }));
    }
  };

  const updateService = (idx, field, value) => {
    setServices((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };
  const setServiceField = (idx, field) => (e) => updateService(idx, field, e.target.value);

  const setScheduleField = (field) => (e) => setSchedule((prev) => ({ ...prev, [field]: e.target.value }));

  const addService = () => setServices((prev) => [...prev, emptyService()]);
  const removeService = (idx) => setServices((prev) => prev.filter((_, i) => i !== idx));

  const toggleCombo = (e) => {
    const checked = e.target.checked;
    setIsCombo(checked);
    if (!checked && services.length > 1) {
      setServices((prev) => [prev[0]]);
    }
  };

  const handleLeadClosedByChange = (e) => {
    const empId = e.target.value;
    setLeadClosedById(empId);
    const emp = employees.find((x) => String(x.id) === String(empId));
    setLeadClosedByEmail(emp ? emp.email : '');
  };

  const comboTotal = services.reduce((sum, s) => sum + (Number(s.total_quoted_amount) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const emp = employees.find((x) => String(x.id) === String(leadClosedById));
      const payload = {
        ...form,
        lead_closed_by: emp ? emp.name : '',
        lead_closed_by_email: leadClosedByEmail,
      };
      const servicesWithSchedule = services.map((s) => ({ ...s, ...schedule }));
      if (servicesWithSchedule.length > 1) {
        payload.combo_services = servicesWithSchedule;
      } else {
        Object.assign(payload, servicesWithSchedule[0]);
      }
      const res = await api.post('/crm', payload);
      if (res.data.entries.length > 1) {
        toast.success(`Combo Sale created — ${res.data.entries.length} linked CRM entries.`);
      } else {
        toast.success(`CRM entry #${res.data.entry.id} created successfully.`);
      }
      navigate(`/crm/${res.data.entry.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create CRM entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <Navbar />
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy">Submit CRM Entry</h1>
          <p className="text-sm text-gray-500">Fill in the details below to create a new lead / deal record</p>
        </div>

        <Section number={1} icon="🏢" title="Company Info" open={open[1]} onToggle={() => toggle(1)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Field label="Company Name" required><input required value={form.company_name} onChange={set('company_name')} className={inputCls} /></Field>
            <Field label="CIN / LLP No."><input value={form.cin_llp_no} onChange={set('cin_llp_no')} className={inputCls} /></Field>
            <Field label="Company Email" required><input type="email" required value={form.company_email} onChange={set('company_email')} className={inputCls} /></Field>
            <Field label="Company Mobile" required><input required value={form.company_mobile} onChange={set('company_mobile')} className={inputCls} /></Field>
            <Field label="Contact Person" required><input required value={form.contact_person} onChange={set('contact_person')} className={inputCls} /></Field>
            <Field label="Website"><input value={form.website} onChange={set('website')} className={inputCls} /></Field>
            <Field label="Company PAN No."><input value={form.company_pan} onChange={set('company_pan')} className={inputCls} /></Field>
            <Field label="GST No."><input value={form.gst_no} onChange={set('gst_no')} className={inputCls} /></Field>
            <Field label="Industry"><input value={form.industry} onChange={set('industry')} className={inputCls} /></Field>
            <Field label="Sector"><input value={form.sector} onChange={set('sector')} className={inputCls} /></Field>
            <Field label="City"><input value={form.city} onChange={set('city')} className={inputCls} /></Field>
            <Field label="State" required>
              <select required value={form.state} onChange={set('state')} className={inputCls}>
                <option value="">Select State</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Complete Address" required>
                <textarea required rows={3} value={form.complete_address} onChange={set('complete_address')} className={inputCls} />
              </Field>
            </div>
          </div>
        </Section>

        <Section number={2} icon="📷" title="Payment & Billing Details" open={open[2]} onToggle={() => toggle(2)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div>
              <Field label="Payment Contact No." required><input required value={form.payment_contact_no} onChange={set('payment_contact_no')} className={inputCls} /></Field>
              <label className="flex items-center gap-2 text-xs text-gray-500 -mt-2 mb-3">
                <input type="checkbox" onChange={sameAs('payment_contact_no', 'company_mobile')} /> Same as Company Mobile
              </label>
            </div>
            <div>
              <Field label="Payment Email" required><input type="email" required value={form.payment_email} onChange={set('payment_email')} className={inputCls} /></Field>
              <label className="flex items-center gap-2 text-xs text-gray-500 -mt-2 mb-3">
                <input type="checkbox" onChange={sameAs('payment_email', 'company_email')} /> Same as Company Email
              </label>
            </div>
            <div>
              <Field label="Startup Contact No."><input value={form.startup_contact_no} onChange={set('startup_contact_no')} className={inputCls} /></Field>
              <label className="flex items-center gap-2 text-xs text-gray-500 -mt-2 mb-3">
                <input type="checkbox" onChange={sameAs('startup_contact_no', 'company_mobile')} /> Same as Company Mobile
              </label>
            </div>
            <div>
              <Field label="Startup Email"><input type="email" value={form.startup_email} onChange={set('startup_email')} className={inputCls} /></Field>
              <label className="flex items-center gap-2 text-xs text-gray-500 -mt-2 mb-3">
                <input type="checkbox" onChange={sameAs('startup_email', 'company_email')} /> Same as Company Email
              </label>
            </div>
          </div>

          <div className="text-sm font-bold text-navy mt-2 mb-3">Invoice Details</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div>
              <Field label="Invoice Company Name" required><input required value={form.invoice_company_name} onChange={set('invoice_company_name')} className={inputCls} /></Field>
              <label className="flex items-center gap-2 text-xs text-gray-500 -mt-2 mb-3">
                <input type="checkbox" onChange={sameAs('invoice_company_name', 'company_name')} /> Same as Company Name
              </label>
            </div>
            <div>
              <Field label="Invoice Contact" required><input required value={form.invoice_contact} onChange={set('invoice_contact')} className={inputCls} /></Field>
              <label className="flex items-center gap-2 text-xs text-gray-500 -mt-2 mb-3">
                <input type="checkbox" onChange={sameAs('invoice_contact', 'company_mobile')} /> Same as Company Mobile
              </label>
            </div>
            <div>
              <Field label="Invoice Email" required><input type="email" required value={form.invoice_email} onChange={set('invoice_email')} className={inputCls} /></Field>
              <label className="flex items-center gap-2 text-xs text-gray-500 -mt-2 mb-3">
                <input type="checkbox" onChange={sameAs('invoice_email', 'company_email')} /> Same as Company Email
              </label>
            </div>
            <div>
              <Field label="Invoice PAN" required><input required value={form.invoice_pan} onChange={set('invoice_pan')} className={inputCls} /></Field>
              <label className="flex items-center gap-2 text-xs text-gray-500 -mt-2 mb-3">
                <input type="checkbox" onChange={sameAs('invoice_pan', 'company_pan')} /> Same as Company PAN
              </label>
            </div>
            <div>
              <Field label="Invoice GST"><input value={form.invoice_gst} onChange={set('invoice_gst')} className={inputCls} /></Field>
              <label className="flex items-center gap-2 text-xs text-gray-500 -mt-2 mb-3">
                <input type="checkbox" onChange={sameAs('invoice_gst', 'gst_no')} /> Same as Company GST
              </label>
            </div>
          </div>
        </Section>

        <Section
          number={3}
          icon="⚙️"
          title="Service, Deal & Payment"
          open={open[3]}
          onToggle={() => toggle(3)}
          badge={isCombo && <span className="bg-gold text-navy text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">COMBO · {services.length}</span>}
        >
          <label className="flex items-center gap-2 text-sm font-semibold text-navy mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <input type="checkbox" checked={isCombo} onChange={toggleCombo} className="w-4 h-4" />
            🔗 Combo Sale — bundle multiple services for this client in one submission
          </label>

          {services.map((svc, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl p-5 mb-5 relative">
              {isCombo && (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-navy uppercase bg-gray-100 px-2.5 py-1 rounded-full">Service {idx + 1}</span>
                  {services.length > 1 && (
                    <button type="button" onClick={() => removeService(idx)} className="text-red-500 text-xs font-semibold hover:underline">🗑 Remove</button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <Field label="Service" required><input required value={svc.service} onChange={setServiceField(idx, 'service')} placeholder="e.g. Startup India Certificate and DSC" className={inputCls} /></Field>
                <Field label="Mode" required>
                  <select required value={svc.mode} onChange={setServiceField(idx, 'mode')} className={inputCls}>
                    {CRM_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </Field>
                {svc.mode === 'refundable' && (
                  <Field label="Percentage (if Refundable)"><input type="number" step="0.01" value={svc.percentage} onChange={setServiceField(idx, 'percentage')} className={inputCls} /></Field>
                )}
                <Field label="Total Quoted Amount" required><input type="number" step="0.01" required value={svc.total_quoted_amount} onChange={setServiceField(idx, 'total_quoted_amount')} className={inputCls} /></Field>
                <Field label="Booking Mode" required><input required value={svc.booking_mode} onChange={setServiceField(idx, 'booking_mode')} placeholder="e.g. Cheque, Cash, Online/UPI" className={inputCls} /></Field>
                <Field label="After Success Payment" required>
                  <input type="number" step="0.01" required value={svc.after_success_payment} onChange={setServiceField(idx, 'after_success_payment')} placeholder="If no after payment, fill 0 here." className={inputCls} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Remark"><textarea rows={2} value={svc.deal_remark} onChange={setServiceField(idx, 'deal_remark')} className={inputCls + ' mb-0'} /></Field>
                </div>
              </div>
            </div>
          ))}

          {isCombo && (
            <div className="flex items-center justify-between mb-5">
              <button type="button" onClick={addService} className="bg-green-600 hover:bg-green-700 transition text-white text-xs font-bold px-4 py-2 rounded-full">+ Add Another Service</button>
              <div className="text-sm font-bold text-navy">Combo Total Quoted: <span className="text-gold">₹{comboTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
            </div>
          )}

          <div className="text-xs font-bold text-gold uppercase mt-2 mb-3">
            📅 Payment Schedule {isCombo && services.length > 1 ? '— shared across all services above' : ''}
          </div>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="border-l-4 border-gold rounded-lg bg-gray-50 p-4 mb-3">
              <div className="text-xs font-bold text-gray-500 uppercase mb-3">
                {'₹'} Payment Part {n}{n === 1 ? ' (Advance)' : ''}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <Field label="Amount (Before GST)" required={n === 1}>
                  <input
                    type="number" step="0.01" required={n === 1}
                    value={schedule[`payment_part${n}_amount`]} onChange={setScheduleField(`payment_part${n}_amount`)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Amount (With 18% GST)">
                  <input disabled value={fmtGst(schedule[`payment_part${n}_amount`])} placeholder="Auto-calculated" className={inputCls + ' bg-gray-100 text-gray-500'} />
                </Field>
                <Field label="Payment Date" required={n === 1}>
                  <input type="date" required={n === 1} value={schedule[`payment_part${n}_date`]} onChange={setScheduleField(`payment_part${n}_date`)} className={inputCls} />
                </Field>
              </div>
            </div>
          ))}
        </Section>

        <Section number={4} icon="📝" title="Additional Notes" open={open[4]} onToggle={() => toggle(4)}>
          <Field label="Remark">
            <textarea rows={4} value={form.user_remark} onChange={set('user_remark')} placeholder="Any notes captured at submission" className={inputCls + ' mb-0'} />
          </Field>
        </Section>

        <Section number={5} icon="👤" title="Lead Closure & Submission" open={open[5]} onToggle={() => toggle(5)}>
          {isAdmin ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mb-4">
              <Field label="Lead Closed By">
                <select value={leadClosedById} onChange={handleLeadClosedByChange} className={inputCls}>
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </Field>
              <Field label="Lead Closed By Email">
                <input disabled value={leadClosedByEmail} placeholder="Auto-fetched on employee selection" className={inputCls + ' bg-gray-100 text-gray-500'} />
              </Field>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">
              {isCombo
                ? `This will create ${services.length} separate, linked CRM entries — one per service — each independently trackable. Assignment and stage progression are managed from each entry's CRM detail page after submission.`
                : 'Assignment and stage progression are managed by an admin from the CRM detail page after submission.'}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/crm')} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-semibold text-sm">Cancel</button>
            <button disabled={saving} type="submit" className="bg-gold text-navy font-bold px-8 py-2.5 rounded-lg shadow disabled:opacity-60">
              {saving ? 'Submitting...' : isCombo ? `Submit Combo Sale (${services.length} services)` : 'Submit CRM Entry'}
            </button>
          </div>
        </Section>
      </form>
    </div>
  );
}
