import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, accent, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <span>{icon}</span> {label}
      </div>
      <div className={`text-3xl font-extrabold ${accent || 'text-navy'}`}>{value}</div>
    </div>
  );
}

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Reports() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/summary').then((res) => setData(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy">Reports</h1>
          <p className="text-sm text-gray-500">{isAdmin ? 'Company-wide CRM and invoicing activity summary' : 'Your CRM and invoicing activity summary'}</p>
        </div>

        {loading || !data ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <StatCard label="Total CRM Entries" value={data.totals.crm} icon="📇" />
              <StatCard label="Total Invoices" value={data.totals.invoices} icon="🧾" />
              <StatCard label="Total Proforma Invoices" value={data.totals.proforma} accent="text-blue-600" icon="📄" />
              <StatCard label="Total Tax Invoices" value={data.totals.tax} accent="text-purple-600" icon="💼" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <StatCard label="Total Proforma Amount" value={fmt(data.totals.proforma_amount)} accent="text-green-600" icon="💰" />
              <StatCard label="Total Tax Invoice Amount" value={fmt(data.totals.tax_amount)} accent="text-green-600" icon="💰" />
            </div>

            {isAdmin && data.byEmployee && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-navy">Employee-wise Breakdown</h2>
                  <p className="text-xs text-gray-400 mt-0.5">CRM and invoice activity per user</p>
                </div>
                {data.byEmployee.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">No activity recorded yet.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <th className="text-left px-5 py-3">Employee</th>
                        <th className="text-right px-5 py-3">CRM Entries</th>
                        <th className="text-right px-5 py-3">Total Invoices</th>
                        <th className="text-right px-5 py-3">Proforma</th>
                        <th className="text-right px-5 py-3">Proforma Amount</th>
                        <th className="text-right px-5 py-3">Tax</th>
                        <th className="text-right px-5 py-3">Tax Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byEmployee.map((row) => (
                        <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-5 py-3 font-semibold text-navy">{row.name}</td>
                          <td className="px-5 py-3 text-right">{row.crm}</td>
                          <td className="px-5 py-3 text-right">{row.invoices}</td>
                          <td className="px-5 py-3 text-right">{row.proforma}</td>
                          <td className="px-5 py-3 text-right text-green-700 font-semibold">{fmt(row.proforma_amount)}</td>
                          <td className="px-5 py-3 text-right">{row.tax}</td>
                          <td className="px-5 py-3 text-right text-green-700 font-semibold">{fmt(row.tax_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
