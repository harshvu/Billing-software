import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../constants/permissions';
import logo from '../assets/logo.png';

const ROLE_LABELS = { admin: 'Admin', project_manager: 'Project Manager', employee: 'Employee' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="bg-navy text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Business Mint" className="h-14 w-auto block" />
          <div>
            <div className="font-semibold text-sm leading-none">BusinessMint Solution Billing</div>
            <div className="text-[11px] text-gray-300">Invoice Management System</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 rounded-full px-3 py-1.5 text-xs">
            Welcome, <span className="font-semibold">{user?.name}</span>
            <span className="ml-1 text-gold">({ROLE_LABELS[user?.role] || user?.role})</span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 transition text-white text-xs font-semibold px-3 py-1.5 rounded-full"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="hidden md:block border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm font-medium">
          {hasPermission(user, 'invoices', 'create') && <Link to="/invoices/new" className="hover:text-gold transition">Create Proforma Invoice</Link>}
          {hasPermission(user, 'invoices', 'menu') && <Link to="/invoices" className="hover:text-gold transition">Proforma Invoice</Link>}
          {hasPermission(user, 'invoices', 'createTax') && <Link to="/tax-invoices/new" className="hover:text-gold transition">Create Tax Invoice</Link>}
          {hasPermission(user, 'invoices', 'taxMenu') && <Link to="/tax-invoices" className="hover:text-gold transition">Tax Invoice</Link>}
          {hasPermission(user, 'crm', 'menu') && <Link to="/crm" className="hover:text-gold transition">CRM</Link>}
          {hasPermission(user, 'reports', 'menu') && <Link to="/reports" className="hover:text-gold transition">Reports</Link>}
          {(user?.role === 'admin' || user?.role === 'project_manager') && (
            <Link to="/employees" className="hover:text-gold transition">Employees</Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/settings" className="hover:text-gold transition">Settings</Link>
          )}
        </div>
      </div>
    </div>
  );
}
