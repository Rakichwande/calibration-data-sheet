import { NavLink } from 'react-router-dom';

// Trimmed to just Create Sheet per request — the other pages (History,
// Instruments, Due Dates, Settings) still exist as routes in App.jsx and
// work fine at their URLs, they're just no longer linked from the nav.
const links = [
  { to: '/', label: 'Create Sheet', end: true },
];

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-title">Calibration Data Sheet</div>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
