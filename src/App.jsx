import React from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Company from './pages/Company';

import BranchList from './pages/BranchList';
import BranchForm from './pages/BranchForm';
import RoleList from './pages/RoleList';
import RoleForm from './pages/RoleForm';
import AccessControl from './pages/AccessControl';
import EmployeeList from './pages/EmployeeList';
import EmployeeForm from './pages/EmployeeForm';
import GroupList from './pages/GroupList';
import GroupForm from './pages/GroupForm';
import LedgerList from './pages/LedgerList';
import LedgerForm from './pages/LedgerForm';
import VoucherConfigurationSettings from './pages/VoucherConfigurationSettings';
import TallyConfigurationSettings from './pages/TallyConfigurationSettings';
import TallySyncDashboard from './pages/TallySyncDashboard';
import MobileAppMenu from './pages/MobileAppMenu';
import SalesVoucherList from './pages/SalesVoucherList';
import SalesVoucher from './pages/SalesVoucher';
import PurchaseVoucherList from './pages/PurchaseVoucherList';
import PurchaseVoucher from './pages/PurchaseVoucher';
import ReceiptVoucherList from './pages/ReceiptVoucherList';
import ReceiptVoucher from './pages/ReceiptVoucher';
import PaymentVoucherList from './pages/PaymentVoucherList';
import PaymentVoucher from './pages/PaymentVoucher';
import ContraVoucherList from './pages/ContraVoucherList';
import ContraVoucher from './pages/ContraVoucher';
import JournalVoucherList from './pages/JournalVoucherList';
import JournalVoucher from './pages/JournalVoucher';
import ProfitAndLossReport from './pages/ProfitAndLossReport';

import Layout from './components/Layout';

// Persistent protected layout wrapper
const ProtectedLayout = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/company" element={<Company />} />
          <Route path="/branch" element={<BranchList />} />
          <Route path="/branch/create" element={<BranchForm />} />
          <Route path="/branch/edit/:id" element={<BranchForm />} />
          <Route path="/role" element={<RoleList />} />
          <Route path="/role/create" element={<RoleForm />} />
          <Route path="/role/edit/:id" element={<RoleForm />} />
          <Route path="/employee" element={<EmployeeList />} />
          <Route path="/employee/create" element={<EmployeeForm />} />
          <Route path="/employee/edit/:id" element={<EmployeeForm />} />
          <Route path="/group" element={<GroupList />} />
          <Route path="/group/create" element={<GroupForm />} />
          <Route path="/group/edit/:id" element={<GroupForm />} />
          <Route path="/ledger" element={<LedgerList />} />
          <Route path="/ledger/create" element={<LedgerForm />} />
          <Route path="/ledger/edit/:id" element={<LedgerForm />} />
          <Route path="/rolesoftwaremodules" element={<AccessControl />} />
          <Route path="/mobileappmenu" element={<MobileAppMenu />} />
          <Route path="/voucherconfig" element={<VoucherConfigurationSettings />} />
          <Route path="/tallyconfig" element={<TallyConfigurationSettings />} />
          <Route path="/tallysync" element={<TallySyncDashboard />} />
          <Route path="/Sales" element={<SalesVoucherList />} />
          <Route path="/Sales/create" element={<SalesVoucher />} />
          <Route path="/Sales/edit/:id" element={<SalesVoucher />} />
          <Route path="/Purchase" element={<PurchaseVoucherList />} />
          <Route path="/Purchase/create" element={<PurchaseVoucher />} />
          <Route path="/Purchase/edit/:id" element={<PurchaseVoucher />} />
          <Route path="/Receipt" element={<ReceiptVoucherList />} />
          <Route path="/Receipt/create" element={<ReceiptVoucher />} />
          <Route path="/Receipt/edit/:id" element={<ReceiptVoucher />} />
          <Route path="/Payment" element={<PaymentVoucherList />} />
          <Route path="/Payment/create" element={<PaymentVoucher />} />
          <Route path="/Payment/edit/:id" element={<PaymentVoucher />} />
          <Route path="/Contra" element={<ContraVoucherList />} />
          <Route path="/Contra/create" element={<ContraVoucher />} />
          <Route path="/Contra/edit/:id" element={<ContraVoucher />} />
          <Route path="/Journal" element={<JournalVoucherList />} />
          <Route path="/Journal/create" element={<JournalVoucher />} />
          <Route path="/Journal/edit/:id" element={<JournalVoucher />} />
          <Route path="/profit-loss" element={<ProfitAndLossReport />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
