import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import DisclaimerBanner from "../components/DisclaimerBanner.jsx";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <DisclaimerBanner />
      <div className="flex-1 flex">
        <Sidebar />
        <div className="md:ml-64 flex-1 flex flex-col min-h-screen">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
