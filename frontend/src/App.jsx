import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import RequireAuth from './auth/RequireAuth';
import DisclaimerBanner from './components/DisclaimerBanner';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PriorityQueue from './pages/PriorityQueue';
import CaseDetail from './pages/CaseDetail';
import Comparison from './pages/Comparison';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <DisclaimerBanner />
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Layout>
                  <Dashboard />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/queue"
            element={
              <RequireAuth>
                <Layout>
                  <PriorityQueue />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/cases/:id"
            element={
              <RequireAuth>
                <Layout>
                  <CaseDetail />
                </Layout>
              </RequireAuth>
            }
          />
          <Route
            path="/comparison"
            element={
              <RequireAuth>
                <Layout>
                  <Comparison />
                </Layout>
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

