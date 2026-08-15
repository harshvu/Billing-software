import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { CRM_STATUS_LABELS, statusBadgeClass } from '../constants/crm';

export default function CrmList() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    api.get('/crm').then((res) => setEntries(res.data.entries)).finally(() => setLoading(false));
  }, []);

  const filtered = entries.filter((e) =>
    String(e.id).includes(search) ||
    e.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (e.service || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (entry) => {
    if (!window.confirm(`Delete CRM entry #${entry.id} (${entry.company_name})? This cannot be undone.`)) return;
    setDeletingId(entry.id);
    try {
      await api.delete(`/crm/${entry.id}`);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      toast.success(`CRM entry #${entry.id} deleted.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete CRM entry.');
    } finally {
      setDeletingId(null);
    }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy">CRM</h1>
            <p className="text-sm text-gray-500">All lead / deal records you have access to</p>
          </div>
          <div className="flex gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by CRM ID, company or service..."
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-72 focus:ring-2 focus:ring-navy/30"
            />
            <Link to="/crm/new" className="bg-navy hover:bg-navy-dark transition text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow">
              + New CRM Entry
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No CRM entries found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <th className="text-left px-5 py-3">CRM ID</th>
                  <th className="text-left px-5 py-3">Company</th>
                  <th className="text-left px-5 py-3">Service</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3">Total Quoted</th>
                  <th className="text-left px-5 py-3">Submitted By</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 font-semibold text-navy">#{entry.id}</td>
                    <td className="px-5 py-3">{entry.company_name}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {entry.service}
                      {entry.combo_group_id && (
                        <span className="ml-2 bg-gold text-navy text-[10px] font-bold px-2 py-0.5 rounded-full">🔗 COMBO</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(entry.status)}`}>
                        {CRM_STATUS_LABELS[entry.status] || entry.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold">{fmt(entry.total_quoted_amount)}</td>
                    <td className="px-5 py-3">{entry.submitted_by_name}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <Link to={`/crm/${entry.id}`} className="text-navy font-semibold hover:underline">View</Link>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDelete(entry)}
                          disabled={deletingId === entry.id}
                          className="text-red-500 font-semibold hover:underline ml-4 disabled:opacity-50"
                        >
                          {deletingId === entry.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
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
