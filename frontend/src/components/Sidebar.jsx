import { NavLink, Link } from "react-router-dom";
import Icon from "./Icon.jsx";
import { primaryNavItems, secondaryNavItems } from "../data/navigation.js";

const linkBase =
  "flex items-center gap-3 px-6 py-3 text-body-sm font-body-sm transition-colors";
const linkInactive =
  "text-on-surface-variant hover:bg-surface-container-highest";
const linkActive =
  "text-secondary font-bold border-r-4 border-secondary bg-surface-container-high";

function NavItem({ item }) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `${linkBase} ${isActive ? linkActive : linkInactive}`
      }
    >
      {({ isActive }) => (
        <>
          <Icon name={item.icon} filled={isActive} />
          <span className="text-label-md font-label-md">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <nav
      aria-label="Primary"
      className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant z-20"
    >
      {/* Brand */}
      <div className="px-6 py-6 border-b border-outline-variant">
        <Link
          to="/"
          className="block cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container rounded flex items-center justify-center text-on-primary-container shrink-0">
              <Icon name="account_balance" filled />
            </div>
            <div>
              <h1 className="text-headline-sm font-headline-sm font-bold text-primary leading-tight">
                Nyaya
              </h1>
              <p className="text-label-md font-label-md text-on-surface-variant">
                Nyaya-Drishti System
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Primary links */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1">
        {primaryNavItems.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </div>

      {/* Secondary links */}
      <div className="p-4 border-t border-outline-variant flex flex-col gap-1">
        {secondaryNavItems.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-highest transition-colors rounded-DEFAULT text-label-md font-label-md"
          >
            <Icon name={item.icon} />
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
