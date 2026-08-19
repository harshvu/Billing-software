import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { CRM_STATUSES, CRM_STEPS, CRM_STATUS_LABELS, CRM_STEP_LABELS, CRM_MODE_LABELS, CRM_DOC_TYPES, statusBadgeClass } from '../constants/crm';

function Card({ title, icon, children, right }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-bold text-navy uppercase flex items-center gap-2">{icon} {title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Item({ label, value }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="text-[10px] font-semibold text-gray-400 uppercase">{label}</div>
      <div className="text-sm font-semibold text-gray-800 mt-0.5">{value === '' || value === null || value === undefined ? 'N/A' : value}</div>
    </div>
  );
}

export default function CrmDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('General');
  const [savingWorkflow, setSavingWorkflow] = useState(false);
  const [wf, setWf] = useState({ status: '', current_step: '', assigned_to_id: '', lead_closed_by: '', lead_closed_by_email: '' });
  const [remark, setRemark] = useState('');
  const [savingRemark, setSavingRemark] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/crm/${id}`).then((res) => {
      setData(res.data);
      setWf({
        status: res.data.entry.status,
        current_step: res.data.entry.current_step,
        assigned_to_id: res.data.entry.assigned_to_id || '',
        lead_closed_by: res.data.entry.lead_closed_by || '',
        lead_closed_by_email: res.data.entry.lead_closed_by_email || '',
      });
      setRemark(res.data.entry.admin_remark || '');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (isAdmin) {
      api.get('/employees').then((res) => setEmployees(res.data.employees)).catch(() => {});
    }
  }, [isAdmin]);

  const handleProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadingProof(true);
    try {
      await api.post(`/crm/${id}/payment-proof`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Payment proof uploaded.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload payment proof.');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleDocUpload = async (e) => {
    e.preventDefault();
    const fileInput = e.target.elements.docFile;
    const file = fileInput.files[0];
    if (!file) return toast.error('Choose a file first.');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', docTitle || file.name);
    formData.append('doc_type', docType);
    setUploadingDoc(true);
    try {
      await api.post(`/crm/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded.');
      setDocTitle('');
      fileInput.value = '';
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleWorkflowSave = async () => {
    setSavingWorkflow(true);
    try {
      await api.put(`/crm/${id}/status`, wf);
      toast.success('Workflow updated.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update workflow.');
    } finally {
      setSavingWorkflow(false);
    }
  };

  const handleRemarkSave = async () => {
    setSavingRemark(true);
    try {
      await api.put(`/crm/${id}/remark`, { admin_remark: remark });
      toast.success('Remark updated.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update remark.');
    } finally {
      setSavingRemark(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100"><Navbar /><div className="p-8 text-gray-500 text-sm">Loading...</div></div>;
  }
  if (!data) {
    return <div className="min-h-screen bg-gray-100"><Navbar /><div className="p-8 text-gray-500 text-sm">CRM entry not found.</div></div>;
  }

  const { entry, documents, linkedEntries, comboEntries, totals, is_editable } = data;
  const canEditWorkflow = isAdmin;
  const canEditRemark = isAdmin || entry.assigned_to_id === user?.id;

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Link to="/crm" className="text-navy text-sm font-semibold hover:underline mb-4 inline-block">← Back to CRM</Link>

        <div className="bg-navy rounded-xl p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-gray-300 mb-1">CRM detail inspection page</div>
            <div className="text-2xl font-bold text-white">{entry.company_name}</div>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-3 text-right">
            <div className="text-xs text-gray-300">CRM ID</div>
            <div className="text-white font-bold">#{entry.id}</div>
            <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(entry.status)}`}>
              {CRM_STATUS_LABELS[entry.status] || entry.status}
            </span>
            {entry.combo_group_id && (
              <span className="block mt-1 bg-gold text-navy px-2.5 py-1 rounded-full text-xs font-bold">
                🔗 Combo Sale
              </span>
            )}
          </div>
        </div>

        {entry.combo_group_id && (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gold p-5 mb-6">
            <div className="text-xs font-bold text-navy uppercase mb-1 flex items-center gap-2">🔗 Combo Sale — Linked Services</div>
            <p className="text-xs text-gray-400 mb-3">These CRM entries were submitted together as one Combo Sale and share this client's details. Each is tracked independently.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="border-2 border-navy rounded-lg p-3 bg-gray-50">
                <div className="text-[10px] text-gray-400 uppercase">This Entry</div>
                <div className="text-sm font-bold text-navy">#{entry.id} · {entry.service}</div>
                <div className="text-xs text-gray-500">{fmt(entry.total_quoted_amount)}</div>
              </div>
              {comboEntries.map((ce) => (
                <Link key={ce.id} to={`/crm/${ce.id}`} className="border border-gray-200 rounded-lg p-3 hover:border-navy transition">
                  <div className="text-[10px] text-gray-400 uppercase">Linked Service</div>
                  <div className="text-sm font-bold text-navy">#{ce.id} · {ce.service}</div>
                  <div className="text-xs text-gray-500 flex items-center justify-between">
                    <span>{fmt(ce.total_quoted_amount)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadgeClass(ce.status)}`}>{CRM_STATUS_LABELS[ce.status] || ce.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-[10px] text-gray-400 uppercase">Submitted By</div>
            <div className="text-sm font-semibold text-gray-800 truncate">{entry.submitted_by_name}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-[10px] text-gray-400 uppercase">Assigned To</div>
            <div className="text-sm font-semibold text-gray-800 truncate">{entry.assigned_to_name || 'Unassigned'}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-[10px] text-gray-400 uppercase">Total Received</div>
            <div className="text-sm font-semibold text-gray-800">{fmt(totals.total_received)}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-[10px] text-gray-400 uppercase">Editable</div>
            <div className="text-sm font-semibold text-gray-800">{is_editable ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card title="Company & Contact" icon="🏢">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Item label="Company Name" value={entry.company_name} />
                <Item label="Company Email" value={entry.company_email} />
                <Item label="Company Mobile" value={entry.company_mobile} />
                <Item label="Contact Person" value={entry.contact_person} />
                <Item label="Website" value={entry.website} />
                <Item label="Address" value={entry.complete_address} />
                <Item label="City" value={entry.city} />
                <Item label="State" value={entry.state} />
              </div>
            </Card>

            <Card title="User Remark" icon="💬">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{entry.user_remark || 'No remark captured at submission.'}</p>
            </Card>

            <Card title="Service & Commercials" icon="⚙️">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Item label="Service" value={entry.service} />
                <Item label="Mode" value={CRM_MODE_LABELS[entry.mode] || entry.mode} />
                <Item label="Percentage" value={entry.percentage} />
                <Item label="Booking Mode" value={entry.booking_mode} />
                <Item label="After Success Payment" value={fmt(entry.after_success_payment)} />
                <Item label="Total Quoted" value={fmt(entry.total_quoted_amount)} />
                <Item label="Advance Amount" value={fmt(entry.payment_part1_amount)} />
                <Item label="Advance With GST" value={fmt(entry.payment_part1_gst)} />
                <Item label="Total Amount" value={fmt(totals.total_amount)} />
              </div>
              {entry.deal_remark && <p className="text-sm text-gray-600 mt-3">{entry.deal_remark}</p>}
            </Card>

            <Card title="Payment Schedule" icon="📅">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="border border-gray-200 rounded-lg p-3">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Part {n}</div>
                    <div className="text-sm text-gray-700">Amount: <b>{fmt(entry[`payment_part${n}_amount`])}</b></div>
                    <div className="text-sm text-gray-700">With GST: <b>{fmt(entry[`payment_part${n}_gst`])}</b></div>
                    <div className="text-sm text-gray-500">Date: {entry[`payment_part${n}_date`] || 'N/A'}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Invoice Details" icon="🧾">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Item label="Invoice Company Name" value={entry.invoice_company_name} />
                <Item label="Invoice Contact" value={entry.invoice_contact} />
                <Item label="Invoice Email" value={entry.invoice_email} />
                <Item label="Invoice PAN" value={entry.invoice_pan} />
                <Item label="Invoice GST" value={entry.invoice_gst} />
                <Item label="Invoice Commission" value={fmt(entry.invoice_commission)} />
              </div>
            </Card>

            <Card title="Other Fields" icon="📋">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Item label="CIN / LLP No." value={entry.cin_llp_no} />
                <Item label="Company PAN" value={entry.company_pan} />
                <Item label="GST No." value={entry.gst_no} />
                <Item label="Industry" value={entry.industry} />
                <Item label="Sector" value={entry.sector} />
                <Item label="Payment Contact" value={entry.payment_contact_no} />
                <Item label="Payment Email" value={entry.payment_email} />
                <Item label="Startup Contact" value={entry.startup_contact_no} />
                <Item label="Startup Email" value={entry.startup_email} />
              </div>
            </Card>

            <Card title="Client Documents" icon="📁">
              <p className="text-xs text-gray-400 mb-4">Documents are saved against the client's phone number, so they appear on every CRM record for the same client.</p>
              <form onSubmit={handleDocUpload} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Document Title" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {CRM_DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input type="file" name="docFile" className="border border-gray-300 rounded-lg px-3 py-2 text-sm md:col-span-2" />
                <button disabled={uploadingDoc} type="submit" className="md:col-span-2 bg-navy hover:bg-navy-dark transition text-white font-semibold text-sm px-4 py-2 rounded-lg disabled:opacity-60">
                  {uploadingDoc ? 'Uploading...' : '⬆ Upload Client Document'}
                </button>
              </form>
              {documents.length === 0 ? (
                <p className="text-sm text-gray-400">No client documents uploaded yet for this phone number.</p>
              ) : (
                <ul className="space-y-2">
                  {documents.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm">
                      <div>
                        <a href={doc.file_path} target="_blank" rel="noreferrer" className="text-navy font-semibold hover:underline">{doc.title}</a>
                        <span className="text-gray-400 text-xs ml-2">({doc.doc_type})</span>
                      </div>
                      <span className="text-xs text-gray-400">{doc.uploaded_by_name}</span>
                    </li>
                  ))}
                </ul>
              )}

              {linkedEntries.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs font-bold text-gray-500 uppercase mb-2">CRM records linked with this phone</div>
                  <ul className="space-y-1">
                    {linkedEntries.map((le) => (
                      <li key={le.id}>
                        <Link to={`/crm/${le.id}`} className="text-navy text-sm hover:underline">#{le.id} · {le.company_name} — {le.service}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </div>

          <div>
            <Card title="Payment Proof" icon="🖼">
              {entry.payment_proof_path ? (
                <img
                  src={entry.payment_proof_path}
                  alt="Payment proof"
                  onClick={() => setZoomOpen(true)}
                  className="w-full rounded-lg border border-gray-200 cursor-zoom-in mb-2"
                />
              ) : (
                <p className="text-sm text-gray-400 mb-2">No payment proof uploaded yet.</p>
              )}
              {entry.payment_proof_path && <p className="text-xs text-gray-400 text-center mb-3">Click to zoom</p>}
              <label className="block">
                <span className="text-xs font-semibold text-gray-600 uppercase">Upload / Replace</span>
                <input type="file" accept="image/*,.pdf" onChange={handleProofUpload} disabled={uploadingProof} className="w-full text-sm mt-1" />
              </label>
            </Card>

            <Card title="Internal & Workflow" icon="🔧">
              <div className="space-y-3 text-sm">
                <Item label="Submitted By Email" value={entry.submitted_by_name} />
                <Item label="Created At" value={new Date(entry.createdAt).toLocaleString('en-IN')} />
              </div>

              {canEditWorkflow ? (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Status</label>
                    <select value={wf.status} onChange={(e) => setWf((w) => ({ ...w, status: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {CRM_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Current Step</label>
                    <select value={wf.current_step} onChange={(e) => setWf((w) => ({ ...w, current_step: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {CRM_STEPS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Assigned To</label>
                    <select value={wf.assigned_to_id} onChange={(e) => setWf((w) => ({ ...w, assigned_to_id: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option value="">Unassigned</option>
                      {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Lead Closed By</label>
                    <select
                      value={employees.find((emp) => emp.name === wf.lead_closed_by)?.id || ''}
                      onChange={(e) => {
                        const emp = employees.find((x) => String(x.id) === String(e.target.value));
                        setWf((w) => ({ ...w, lead_closed_by: emp ? emp.name : '', lead_closed_by_email: emp ? emp.email : '' }));
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">-- Select Employee --</option>
                      {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Lead Closed By Email</label>
                    <input disabled value={wf.lead_closed_by_email} placeholder="Auto-fetched on employee selection" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-500" />
                  </div>
                  <button onClick={handleWorkflowSave} disabled={savingWorkflow} className="w-full bg-navy hover:bg-navy-dark transition text-white font-semibold text-sm py-2.5 rounded-lg disabled:opacity-60">
                    {savingWorkflow ? 'Saving...' : '✓ Update Workflow'}
                  </button>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <Item label="Current Step" value={CRM_STEP_LABELS[entry.current_step] || entry.current_step} />
                  <Item label="Lead Closed By" value={entry.lead_closed_by} />
                </div>
              )}
            </Card>

            <Card title="BDE / Admin Remark" icon="📌">
              <p className="text-xs text-gray-400 mb-2">Internal notes panel for follow-up comments.</p>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={4}
                disabled={!canEditRemark}
                placeholder="Internal Notes"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 disabled:bg-gray-50"
              />
              {canEditRemark && (
                <button onClick={handleRemarkSave} disabled={savingRemark} className="w-full bg-navy hover:bg-navy-dark transition text-white font-semibold text-sm py-2.5 rounded-lg disabled:opacity-60">
                  {savingRemark ? 'Saving...' : '✓ Update Remark'}
                </button>
              )}
            </Card>
          </div>
        </div>
      </div>

      {zoomOpen && entry.payment_proof_path && (
        <div onClick={() => setZoomOpen(false)} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 cursor-zoom-out p-6">
          <img src={entry.payment_proof_path} alt="Payment proof zoom" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
