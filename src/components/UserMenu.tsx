import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStorage, userStorage } from '../api/token-storage';
import { IconUser, IconMail, IconGear, IconLogout } from '../features/patients/icons';
import './user-menu.css';

export const AVATAR_URL = 'https://i.pravatar.cc/80?img=47';

export function UserMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  const userName = userStorage.get()?.name ?? 'Doctor';

  const go = (path: string, state?: object) => {
    setOpen(false);
    navigate(path, state ? { state } : undefined);
  };

  const signOut = () => {
    tokenStorage.clear();
    navigate('/login', { replace: true });
  };

  return (
    <div className="user-menu" ref={ref}>
      <img
        className="topbar__avatar"
        src={AVATAR_URL}
        alt={userName}
        onClick={() => setOpen((o) => !o)}
      />
      {open && (
        <div className="user-menu__dropdown">
          <div className="user-menu__hello">Hello {userName}..</div>
          <button className="user-menu__item" onClick={() => go('/profile')}>
            <IconUser /><span>Profile</span>
          </button>
          <button className="user-menu__item" onClick={() => go('/profile')}>
            <IconMail /><span>Email</span>
          </button>
          <button className="user-menu__item" onClick={() => go('/profile', { tab: 'setting' })}>
            <IconGear /><span>Settings</span>
          </button>
          <div className="user-menu__divider" />
          <button className="user-menu__item user-menu__item--logout" onClick={signOut}>
            <IconLogout /><span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
