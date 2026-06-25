import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useListDoctorPatients } from '../../api/generated/doctor-patients/doctor-patients';
import { tokenStorage } from '../../api/token-storage';
import {
  IconHeart, IconSearch, IconExpand, IconMail, IconBell, IconHome,
  IconPlus, IconDownload, IconRefresh, IconPhone, IconPin,
  IconGear, IconMonitor, IconActivity, IconSmile,
  IconUsers, IconDollar, IconBox, IconVideo, IconBadge, IconChart,
  IconCalendarNav, IconAnchor, IconChevrons,
} from './icons';
import './doctor-patients.css';

const PER_PAGE = 12;

const BLOOD_GROUPS = ['B+', 'O+', 'A+', 'B-', 'AB+', 'O-', 'A-'];

const pick = <T,>(arr: readonly T[], id: number) => arr[id % arr.length];

function timeSlot(id: number): string {
  const hours = 9 + (id % 8);
  const min = (id * 17) % 60;
  const end = min + 30;
  return `${String(hours).padStart(2, '0')}:${String(min).padStart(2, '0')} - ${String(hours).padStart(2, '0')}:${String(end).padStart(2, '0')} AM`;
}

function dayOfWeek(id: number): string {
  const date = new Date(2024, 5, 20 + (id % 7));
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function DoctorPatientsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isFetching, refetch } = useListDoctorPatients({
    search: search || undefined,
    page,
    per_page: PER_PAGE,
    sort: 'last_name',
  });

  const rows = useMemo(() => data?.data ?? [], [data]);

  const signOut = () => {
    tokenStorage.clear();
    navigate('/login', { replace: true });
  };

  const navItems = [IconMonitor, IconActivity, IconSmile, IconUsers, IconDollar, IconBox, IconHome, IconVideo, IconBadge, IconChart, IconGear, IconCalendarNav, IconBox, IconAnchor, IconChevrons];
  const activeNav = 2; // smiley = patients

  return (
    <div className="app-shell">
      {/* ----------------------------- Sidebar ----------------------------- */}
      <aside className="sidebar">
        <div className="sidebar__logo"><IconHeart /></div>
        {navItems.map((Icon, i) => (
          <div
            key={i}
            className={`sidebar__item${i === activeNav ? ' sidebar__item--active' : ''}`}
            onClick={() => {
              if (i === 0) navigate('/dashboard');
              if (i === 2) navigate('/patients');
            }}
            style={{ cursor: 'pointer' }}
          >
            <Icon />
          </div>
        ))}
      </aside>

      <div className="app-main">
        {/* ----------------------------- Topbar ----------------------------- */}
        <header className="topbar">
          <div className="topbar__search">
            <IconSearch />
            <input placeholder="Search.." />
          </div>
          <div className="topbar__actions">
            <div className="topbar__icon"><IconExpand /></div>
            <div className="topbar__icon"><span className="topbar__flag">🇺🇸</span></div>
            <div className="topbar__icon"><IconMail /><span className="dot" /></div>
            <div className="topbar__icon"><IconBell /><span className="dot" /></div>
            <img
              className="topbar__avatar"
              src="https://i.pravatar.cc/80?img=47"
              alt="me"
              onClick={signOut}
              title="Sign out"
            />
          </div>
        </header>

        {/* ----------------------------- Page heading --------------------------- */}
        <div className="page-head">
          <div className="page-head__title">Patients</div>
          <nav className="breadcrumb">
            <IconHome />
            <span className="sep">/</span>
            <span>Patients</span>
          </nav>
        </div>

        {/* ------------------------------- Search & Tools ------------------------------- */}
        <section className="patients-grid-header">
          <div className="grid-search">
            <IconSearch />
            <input
              placeholder="Search records…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="grid-tools">
            <button className="icon-btn icon-btn--add" title="Add patient" onClick={() => navigate('/patients/new')}>
              <IconPlus />
            </button>
            <button className="icon-btn icon-btn--export" title="Export">
              <IconDownload />
            </button>
            <button
              className={`icon-btn icon-btn--refresh${isFetching ? ' spinning' : ''}`}
              title="Refresh"
              onClick={() => refetch()}
            >
              <IconRefresh />
            </button>
          </div>
        </section>

        {/* -------------------------------- Grid Cards -------------------------------- */}
        <section className="patients-grid-container">
          {rows.length === 0 && !isFetching && (
            <div className="grid-empty">No patients found.</div>
          )}
          <div className="patients-grid">
            {rows.map((p) => (
              <div key={p.id} className="patient-card">
                <div className="patient-card__header">
                  <img className="patient-card__avatar" src={`https://i.pravatar.cc/80?img=${(p.id % 70) + 1}`} alt={p.full_name} />
                  <div className="patient-card__time">{timeSlot(p.id)}</div>
                </div>

                <div className="patient-card__content">
                  <div className="patient-card__name">{p.full_name}</div>
                  <div className="patient-card__id">Patient Id: {p.id}</div>
                  <div className="patient-card__date">{dayOfWeek(p.id)}</div>

                  <div className="patient-card__info">
                    <div className="info-item">
                      <IconPin className="info-icon" />
                      <span className="info-text">{p.address ?? 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <IconPhone className="info-icon" />
                      <span className="info-text">{p.phone ?? 'N/A'}</span>
                    </div>
                  </div>

                  <div className="patient-card__meta">
                    <div className="meta-item">
                      <span className="meta-label">Blood Group:</span>
                      <span className="meta-value">{pick(BLOOD_GROUPS, p.id)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Reports:</span>
                      <span className="meta-value">
                        <IconActivity style={{ width: 14, height: 14, marginLeft: 4 }} />
                      </span>
                    </div>
                  </div>

                  <button className="read-more-btn" onClick={() => navigate(`/patients/${p.id}`)}>Read More</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <button className="settings-fab" title="Settings"><IconGear /></button>
    </div>
  );
}
