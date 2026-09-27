import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Create Sheet', end: true },
  { to: '/history', label: 'Sheet History' },
  { to: '/instruments', label: 'Instruments' },
  { to: '/due-dates', label: 'Due Dates' },
  { to: '/settings', label: 'Settings' },
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
