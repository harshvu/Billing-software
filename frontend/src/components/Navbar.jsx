import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../constants/permissions';
import logo from '../assets/logo.png';

const ROLE_LABELS = { admin: 'Admin', project_manager: 'Project Manager', employee: 'Employee' };

// Top bar: logo on the left, menu links in the middle, user and logout on the right, all on
// one row. The bar uses the full screen width so the longer menu names fit; on a narrow
// screen the links wrap onto a second line inside the middle area instead of overflowing.
// The menu text grows with the screen (14px, 15px from 1280px, 16px from 1536px, 17px from
// 1700px). To save room on smaller screens the brand text (the logo already shows the name)
// and the word "Welcome," only appear from 1700px.
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="bg-navy text-white sticky top-0 z-40 shadow-md">
      <div className="px-6 py-2 flex items-center justify-between gap-5">
        <div className="flex items-center gap-3 shrink-0">
          <img src={logo} alt="Business Mint" className="h-12 w-auto block" />
          <div className="hidden min-[1700px]:block">
            <div className="font-semibold text-sm leading-none">BusinessMint Solution Billing</div>
            <div className="text-[11px] text-gray-300">Invoice Management System</div>
          </div>
        </div>

        <div className="hidden md:flex flex-1 flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm font-medium xl:gap-x-5 xl:text-[15px] 2xl:gap-x-6 2xl:text-base min-[1700px]:gap-x-7 min-[1700px]:text-[17px]">
          {hasPermission(user, 'invoices', 'create') && <Link to="/invoices/new" className="hover:text-gold transition whitespace-nowrap">Create Proforma Invoice</Link>}
          {hasPermission(user, 'invoices', 'menu') && <Link to="/invoices" className="hover:text-gold transition whitespace-nowrap">Proforma Invoice</Link>}
          {hasPermission(user, 'invoices', 'createTax') && <Link to="/tax-invoices/new" className="hover:text-gold transition whitespace-nowrap">Create Tax Invoice</Link>}
          {hasPermission(user, 'invoices', 'taxMenu') && <Link to="/tax-invoices" className="hover:text-gold transition whitespace-nowrap">Tax Invoice</Link>}
          {hasPermission(user, 'crm', 'menu') && <Link to="/crm" className="hover:text-gold transition">CRM</Link>}
          {hasPermission(user, 'reports', 'menu') && <Link to="/reports" className="hover:text-gold transition">Reports</Link>}
          {(user?.role === 'admin' || user?.role === 'project_manager') && (
            <Link to="/employees" className="hover:text-gold transition">Employees</Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/settings" className="hover:text-gold transition">Settings</Link>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white/10 rounded-full px-3 py-1.5 text-xs whitespace-nowrap">
            <span className="hidden min-[1700px]:inline">Welcome, </span><span className="font-semibold">{user?.name}</span>
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
    </div>
  );
}
