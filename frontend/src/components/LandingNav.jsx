import { Link } from "react-router-dom";
import Icon from "./Icon.jsx";

const links = [
  { label: "Impact", href: "#impact" },
  { label: "Technology", href: "#technology" },
  { label: "Users", href: "#users" },
  { label: "About", href: "#about" },
];

export default function LandingNav() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-surface border-b border-outline-variant">
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 w-full">
        <div className="flex items-center gap-4">
          <span className="font-headline-md text-headline-md font-bold text-primary">
            Nyaya-Drishti
          </span>
        </div>

        <div className="hidden md:flex gap-6 items-center">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-80"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4 text-primary">
          <Link
            to="/dashboard"
            className="bg-navy text-white px-6 py-2.5 rounded-four font-semibold font-label-md text-label-md transition-colors mr-2 hover:opacity-90"
          >
            Go to Dashboard
          </Link>
          <button
            type="button"
            aria-label="Notifications"
            className="hover:text-primary transition-colors"
          >
            <Icon name="notifications" className="cursor-pointer" />
          </button>
          <button
            type="button"
            aria-label="Account"
            className="hover:text-primary transition-colors"
          >
            <Icon name="account_circle" className="cursor-pointer" />
          </button>
        </div>
      </div>
    </nav>
  );
}
