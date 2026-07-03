import { useLocation, useNavigate } from 'react-router-dom';
import { IconTooth, IconMonitor, IconSmile, IconUsers } from '../features/patients/icons';

const NAV_ITEMS = [
  { icon: IconMonitor, label: 'Dashboard', path: '/dashboard', isActive: (p: string) => p.startsWith('/dashboard') },
  { icon: IconSmile, label: 'My Patients', path: '/patients', isActive: (p: string) => p.startsWith('/patients') && !p.startsWith('/patients/all') },
  { icon: IconUsers, label: 'All Patients', path: '/patients/all', isActive: (p: string) => p.startsWith('/patients/all') },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar__logo"><IconTooth /></div>
      {NAV_ITEMS.map(({ icon: Icon, label, path, isActive: checkActive }) => {
        const isActive = checkActive(pathname);
        return (
          <div
            key={path}
            className={`sidebar__item${isActive ? ' sidebar__item--active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon />
            <span className="sidebar__tooltip">{label}</span>
          </div>
        );
      })}
    </aside>
  );
}
