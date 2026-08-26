import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import DisclaimerBanner from "../components/DisclaimerBanner.jsx";
import CourtroomEntrance from "../components/CourtroomEntrance.jsx";
import { isEntranceArmed, clearEntrance } from "../entrance/entrance.js";

export default function AppLayout() {
  // Decide once, on the first render of the workspace, whether the
  // "entering the courtroom" ceremony should play. Reading in the initializer
  // (rather than an effect) keeps it stable across re-renders; we clear the
  // session flag immediately so a refresh or back-navigation won't replay it.
  const [showEntrance, setShowEntrance] = useState(() => {
    const armed = isEntranceArmed();
    if (armed) clearEntrance();
    return armed;
  });

  // Re-key the content wrapper on pathname change so each workspace page
  // fades/rises in — navigation reads as continuous rather than a hard swap.
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <DisclaimerBanner />
      <div className="flex-1 flex w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <div
            key={location.pathname}
            className="flex-1 flex flex-col min-w-0 animate-routeIn motion-reduce:animate-none"
          >
            <Outlet />
          </div>
        </div>
      </div>

      {showEntrance && (
        <CourtroomEntrance onComplete={() => setShowEntrance(false)} />
      )}
    </div>
  );
}
