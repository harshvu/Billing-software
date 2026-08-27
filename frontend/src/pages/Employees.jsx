import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { PERMISSION_SCHEMA } from '../constants/permissions';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', branch: '' });

  const [permEmployee, setPermEmployee] = useState(null);
  const [permValues, setPermValues] = useState(null);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees');
      setEmployees(res.data.employees);
    } catch (err) {
      toast.error('Failed to load employees.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/employees', form);
      toast.success('Employee created successfully.');
      setForm({ name: '', email: '', password: '', phone: '', branch: '' });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create employee.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (emp) => {
    try {
      await api.put(`/employees/${emp.id}`, { status: emp.status === 'active' ? 'inactive' : 'active' });
      toast.success(`Employee ${emp.status === 'active' ? 'deactivated' : 'activated'}.`);
      load();
    } catch (err) {
      toast.error('Failed to update employee status.');
    }
  };

  const openPermissions = async (emp) => {
    setPermEmployee(emp);
    setLoadingPerms(true);
    try {
      const res = await api.get(`/employees/${emp.id}/permissions`);
      setPermValues(res.data.permissions);
    } catch (err) {
      toast.error('Failed to load permissions.');
      setPermEmployee(null);
    } finally {
      setLoadingPerms(false);
    }
  };

  const togglePerm = (moduleKey, actionKey) => {
    setPermValues((prev) => ({
      ...prev,
      [moduleKey]: { ...prev[moduleKey], [actionKey]: !prev[moduleKey][actionKey] },
    }));
  };

  const savePermissions = async () => {
    setSavingPerms(true);
    try {
      await api.put(`/employees/${permEmployee.id}/permissions`, { permissions: permValues });
      toast.success(`Permissions updated for ${permEmployee.name}.`);
      setPermEmployee(null);
      setPermValues(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update permissions.');
    } finally {
      setSavingPerms(false);
    }
  };

  const removeEmployee = async (emp) => {
    if (!confirm(`Remove ${emp.name}? This cannot be undone unless they have invoice history.`)) return;
    try {
      const res = await api.delete(`/employees/${emp.id}`);
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error('Failed to remove employee.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-navy">Employees</h1>
            <p className="text-sm text-gray-500">Create and manage employee logins</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-navy hover:bg-navy-dark transition text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow"
          >
            {showForm ? 'Close' : '+ Add Employee'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Full Name</label>
              <input name="name" required value={form.name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Email</label>
              <input type="email" name="email" required value={form.email} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Temporary Password</label>
              <input type="text" name="password" required minLength={6} value={form.password} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Branch</label>
              <input name="branch" value={form.branch} onChange={handleChange} placeholder="e.g. Vadodara" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy/30" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button disabled={saving} type="submit" className="bg-gold text-navy font-bold px-6 py-2.5 rounded-lg disabled:opacity-60">
                {saving ? 'Creating...' : 'Create Employee'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading...</div>
          ) : employees.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No employees yet. Click "Add Employee" to create one.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Branch</th>
                  <th className="text-left px-5 py-3">Phone</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 font-semibold text-navy">{emp.name}</td>
                    <td className="px-5 py-3">{emp.email}</td>
                    <td className="px-5 py-3">{emp.branch || '-'}</td>
                    <td className="px-5 py-3">{emp.phone || '-'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right space-x-3">
                      <button onClick={() => openPermissions(emp)} className="text-navy font-semibold hover:underline text-xs">
                        🔐 Permissions
                      </button>
                      <button onClick={() => toggleStatus(emp)} className="text-navy font-semibold hover:underline text-xs">
                        {emp.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => removeEmployee(emp)} className="text-red-500 font-semibold hover:underline text-xs">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {permEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={() => setPermEmployee(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="bg-navy rounded-t-xl px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-white font-bold">🔐 Permissions</div>
                <div className="text-gray-300 text-xs">{permEmployee.name} · {permEmployee.email}</div>
              </div>
              <button onClick={() => setPermEmployee(null)} className="text-white text-xl leading-none">&times;</button>
            </div>

            <div className="p-6">
              {loadingPerms || !permValues ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(PERMISSION_SCHEMA).map(([moduleKey, moduleDef]) => (
                    <div key={moduleKey}>
                      <div className="text-xs font-bold text-navy uppercase mb-2">{moduleDef.label}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(moduleDef.actions).map(([actionKey, actionLabel]) => (
                          <label key={actionKey} className="flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={!!permValues[moduleKey]?.[actionKey]}
                              onChange={() => togglePerm(moduleKey, actionKey)}
                              className="w-4 h-4"
                            />
                            {actionLabel}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400">
                    Employee management and Company Settings always stay admin-only, regardless of these toggles.
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex justify-end gap-3">
              <button onClick={() => setPermEmployee(null)} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-semibold text-sm">Cancel</button>
              <button disabled={savingPerms || loadingPerms} onClick={savePermissions} className="bg-gold text-navy font-bold px-6 py-2.5 rounded-lg shadow disabled:opacity-60">
                {savingPerms ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
