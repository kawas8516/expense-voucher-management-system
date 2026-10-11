import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import VoucherDetails from "./pages/VoucherDetails";

import EmployeeDashboard from "./pages/employee/Dashboard";
import CreateVoucher from "./pages/employee/CreateVoucher";
import MyVouchers from "./pages/employee/MyVouchers";
import EditVoucher from "./pages/employee/EditVoucher";

import DirectorDashboard from "./pages/director/Dashboard";
import PendingApprovals from "./pages/director/PendingApprovals";
import DirectorAllVouchers from "./pages/director/AllVouchers";

import AccountsDashboard from "./pages/accounts/Dashboard";
import AccountsAllVouchers from "./pages/accounts/AllVouchers";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <div className="container">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />

            {/* employee */}
            <Route path="/employee" element={<ProtectedRoute roles={["employee"]}><EmployeeDashboard /></ProtectedRoute>} />
            <Route path="/employee/create" element={<ProtectedRoute roles={["employee"]}><CreateVoucher /></ProtectedRoute>} />
            <Route path="/employee/vouchers" element={<ProtectedRoute roles={["employee"]}><MyVouchers /></ProtectedRoute>} />
            <Route path="/employee/vouchers/:id/edit" element={<ProtectedRoute roles={["employee"]}><EditVoucher /></ProtectedRoute>} />

            {/* director */}
            <Route path="/director" element={<ProtectedRoute roles={["director"]}><DirectorDashboard /></ProtectedRoute>} />
            <Route path="/director/pending" element={<ProtectedRoute roles={["director"]}><PendingApprovals /></ProtectedRoute>} />
            <Route path="/director/vouchers" element={<ProtectedRoute roles={["director"]}><DirectorAllVouchers /></ProtectedRoute>} />

            {/* accounts */}
            <Route path="/accounts" element={<ProtectedRoute roles={["accounts"]}><AccountsDashboard /></ProtectedRoute>} />
            <Route path="/accounts/vouchers" element={<ProtectedRoute roles={["accounts"]}><AccountsAllVouchers /></ProtectedRoute>} />

            {/* shared */}
            <Route path="/vouchers/:id" element={<ProtectedRoute><VoucherDetails /></ProtectedRoute>} />

            <Route path="*" element={<h3>404 - Page not found</h3>} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
