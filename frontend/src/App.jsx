import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import RequireAuth from "./auth/RequireAuth";
import AppLayout from "./layouts/AppLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PriorityQueue from "./pages/PriorityQueue";
import CaseDetail from "./pages/CaseDetail";
import Comparison from "./pages/Comparison";
import Landing from "./pages/Landing";
import LokAdalatDrafts from "./pages/LokAdalatDrafts";
import LokAdalatApproved from "./pages/LokAdalatApproved";
import LokAdalatRejected from "./pages/LokAdalatRejected";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Public marketing landing page */}
          <Route path="/landing" element={<Landing />} />

          {/* Protected workspace routes */}
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/queue" element={<PriorityQueue />} />
            <Route path="/cases/:id" element={<CaseDetail />} />
            <Route path="/comparison" element={<Comparison />} />
            <Route path="/lok-adalat-drafts" element={<LokAdalatDrafts />} />
            <Route path="/lok-adalat-approved" element={<LokAdalatApproved />} />
            <Route path="/lok-adalat-rejected" element={<LokAdalatRejected />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
