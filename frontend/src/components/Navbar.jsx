import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

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
          <img src={logo} alt="Business Mint" className="h-10 w-auto block" />
          <div>
            <div className="font-semibold text-sm leading-none">BusinessMint Solution Billing</div>
            <div className="text-[11px] text-gray-300">Invoice Management System</div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/invoices/new" className="hover:text-gold transition">Create Invoice</Link>
          <Link to="/invoices" className="hover:text-gold transition">Invoices</Link>
          <Link to="/crm" className="hover:text-gold transition">CRM</Link>
          <Link to="/reports" className="hover:text-gold transition">Reports</Link>
          {user?.role === 'admin' && (
            <>
              <Link to="/employees" className="hover:text-gold transition">Employees</Link>
              <Link to="/settings" className="hover:text-gold transition">Settings</Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 rounded-full px-3 py-1.5 text-xs">
            Welcome, <span className="font-semibold">{user?.name}</span>
            <span className="ml-1 text-gold capitalize">({user?.role})</span>
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
