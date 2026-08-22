import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64 flex flex-col min-h-screen">
        <Outlet />
      </div>
    </div>
  );
}
