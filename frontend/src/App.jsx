import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import CreateInvoice from './pages/CreateInvoice';
import Invoices from './pages/Invoices';
import InvoiceView from './pages/InvoiceView';
import Settings from './pages/Settings';
import CrmList from './pages/CrmList';
import CrmSubmit from './pages/CrmSubmit';
import CrmDetail from './pages/CrmDetail';
import Reports from './pages/Reports';

export default function App() {
  const { loading } = useAuth();
  if (loading) return null;

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
        <Route path="/invoices/new" element={<ProtectedRoute><CreateInvoice /></ProtectedRoute>} />
        <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceView /></ProtectedRoute>} />
        <Route path="/crm" element={<ProtectedRoute><CrmList /></ProtectedRoute>} />
        <Route path="/crm/new" element={<ProtectedRoute><CrmSubmit /></ProtectedRoute>} />
        <Route path="/crm/:id" element={<ProtectedRoute><CrmDetail /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute roles={['admin']}><Employees /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute roles={['admin']}><Settings /></ProtectedRoute>} />
        <Route path="*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      </Routes>
    </>
  );
}
