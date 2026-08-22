import { Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout.jsx";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PriorityQueue from "./pages/PriorityQueue.jsx";
import CaseInspector from "./pages/CaseInspector.jsx";
import LokAdalatDrafts from "./pages/LokAdalatDrafts.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/priority-queue" element={<PriorityQueue />} />
        <Route path="/case-inspector" element={<CaseInspector />} />
        <Route path="/lok-adalat-drafts" element={<LokAdalatDrafts />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
