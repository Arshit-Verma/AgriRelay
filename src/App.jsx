import React from "react";
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';

import TopBar from './components/layout/TopBar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ZoneProvider } from './context/ZoneContext';
import ContaminationFlag from './pages/ContaminationFlag';
import Dashboard from './pages/Dashboard';
import GovtSchemes from './pages/GovtSchemes';
import HarvestAdvisor from './pages/HarvestAdvisor';
import Login from './pages/Login';
import MandiMap from './pages/MandiMap';
import SMSRelay from './pages/SMSRelay';

function AppShell() {
  const { officer } = useAuth();
  const location = useLocation();

  const pageTitle = (() => {
    switch (location.pathname) {
      case '/dashboard':
      case '/':
        return 'Dashboard';
      case '/mandi-map':
        return 'Mandi Map';
      case '/harvest-advisor':
        return 'Harvest Advisor';
      case '/sms-relay':
        return 'SMS Relay';
      case '/contamination-flag':
        return 'Flag Contamination';
      case '/govt-schemes':
        return 'Govt Schemes';
      default:
        return 'AgriRelay';
    }
  })();

  if (!officer) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ZoneProvider>
      <div className="min-h-screen bg-surface lg:pl-[240px]">
        <Sidebar />
        <div className="min-w-0">
          <TopBar pageTitle={pageTitle} />
          <main className="pb-20 px-4 py-6 sm:px-6 lg:pb-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/mandi-map" element={<MandiMap />} />
              <Route path="/harvest-advisor" element={<HarvestAdvisor />} />
              <Route path="/sms-relay" element={<SMSRelay />} />
              <Route path="/contamination-flag" element={<ContaminationFlag />} />
              <Route path="/govt-schemes" element={<GovtSchemes />} />
            </Routes>
          </main>
        </div>
      </div>
    </ZoneProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </AuthProvider>
  );
}
