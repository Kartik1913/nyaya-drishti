export const primaryNavItems = [
  { label: "Dashboard", icon: "dashboard", path: "/" },
  { label: "Priority Queue", icon: "list_alt", path: "/queue" },
  { label: "Demo Comparison", icon: "compare_arrows", path: "/comparison" },
  { label: "Lok Adalat Drafts", icon: "gavel", path: "/lok-adalat-drafts" },
  { label: "Approved", icon: "check_circle", path: "/lok-adalat-approved" },
  { label: "Rejected", icon: "cancel", path: "/lok-adalat-rejected" },
];

// "Settings" was removed rather than stubbed: it pointed at "#", did nothing,
// and this prototype has no user-configurable state worth a settings surface.
// A control that looks operable but isn't reads as unfinished — better absent.
// "Support" now opens a real modal from the Sidebar (see SupportModal.jsx)
// rather than living here as a dead link.
export const secondaryNavItems = [
  { label: "Public Overview", icon: "public", path: "/landing" },
];
