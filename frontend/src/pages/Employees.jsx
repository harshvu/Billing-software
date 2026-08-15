import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/Navbar';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', branch: '' });

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
    </div>
  );
}
