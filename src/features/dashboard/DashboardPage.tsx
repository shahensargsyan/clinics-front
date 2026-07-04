import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetDoctorSchedule,
  useGetDoctorAppointmentStats,
} from '../../api/generated/appointments/appointments';
import type { Appointment } from '../../api/generated/model';
import { userStorage } from '../../api/token-storage';
import { Sidebar } from '../../components/Sidebar';
import { UserMenu, AVATAR_URL } from '../../components/UserMenu';
import {
  IconSearch, IconExpand, IconMail, IconBell, IconHome, IconGear,
} from '../patients/icons';
import '../patients/patients.css';
import './dashboard.css';

const REFRESH_INTERVAL = 60_000;

// The API delivers RFC3339 with an explicit offset — render the clock
// time as-is rather than converting to the browser's local timezone.
function timeLabel(iso: string) {
  return iso.slice(11, 16);
}

function deriveBadge(appt: Appointment, now: number): { label: string; cls: string } {
  if (appt.status === 'Completed') return { label: 'Completed', cls: 'completed' };
  if (appt.status === 'Cancelled') return { label: 'Cancelled', cls: 'cancelled' };
  const start = new Date(appt.appointment_date_time).getTime();
  const end = start + appt.duration_minutes * 60_000;
  if (now < start) return { label: appt.status, cls: 'scheduled' };
  if (now < end) return { label: 'In Progress', cls: 'inprogress' };
  return { label: 'Missed', cls: 'missed' };
}

export function DashboardPage() {
  const navigate = useNavigate();
  const user = userStorage.get();
  const name = user?.name ?? 'Doctor';
  const email = user?.email ?? '—';

  // Drives badge re-derivation (e.g. Scheduled -> In Progress) between refetches.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(tick);
  }, []);

  const {
    data: scheduleData,
    isLoading: scheduleLoading,
    isError: scheduleErrored,
    refetch: refetchSchedule,
  } = useGetDoctorSchedule(undefined, { query: { refetchInterval: REFRESH_INTERVAL } });

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsErrored,
    refetch: refetchStats,
  } = useGetDoctorAppointmentStats({ query: { refetchInterval: REFRESH_INTERVAL } });

  const appointments = scheduleData?.data ?? [];

  const statTiles = [
    { label: 'Appointments', icon: '📅', value: stats?.total },
    { label: 'Completed', icon: '✅', value: stats?.completed },
    { label: 'Upcoming', icon: '⏰', value: stats?.upcoming },
    { label: 'Missed', icon: '❌', value: stats?.missed },
  ];

  return (
    <div className="app-shell">
      <Sidebar />

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
            <UserMenu />
          </div>
        </header>

        {/* --------------------------- Page heading --------------------------- */}
        <div className="page-head">
          <div className="page-head__title">Dashboard</div>
          <nav className="breadcrumb">
            <IconHome />
            <span className="sep">/</span>
            <span className="current">Dashboard</span>
          </nav>
        </div>

        {/* ----------------------------- Doctor Profile ----------------------------- */}
        <section className="doctor-profile-card">
          <img className="doctor-profile__avatar" src={AVATAR_URL} alt={name} />
          <div className="doctor-profile__content">
            <h2 className="doctor-profile__name">{name}</h2>
            <p className="doctor-profile__specialty">Doctor</p>
            <div className="doctor-profile__meta">
              <span>📧 {email}</span>
            </div>
          </div>
          <div className="doctor-profile__status">
            <div className="status-dot"></div>
          </div>
          <button className="doctor-profile__btn" onClick={() => navigate('/profile')}>View Profile</button>
        </section>

        {/* ----------------------------- Stats Cards ----------------------------- */}
        <section className="dashboard-grid">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div className="stat-card" key={i}>
                <div className="widget-skeleton__row" style={{ height: 90 }} />
              </div>
            ))
          ) : statsErrored ? (
            <div className="stat-card" style={{ gridColumn: '1 / -1' }}>
              <div className="widget-error">
                Could not load appointment stats.
                <button className="widget-error__retry" onClick={() => refetchStats()}>Retry</button>
              </div>
            </div>
          ) : (
            statTiles.map((t) => (
              <div className="stat-card" key={t.label}>
                <div className="stat-card__number">{t.value}</div>
                <div className="stat-card__label">{t.label}</div>
                <div className="stat-card__icon">{t.icon}</div>
              </div>
            ))
          )}
        </section>

        {/* ----------------------------- Main Content Grid ----------------------------- */}
        <section className="dashboard-content">
          {/* Today's Schedule */}
          <div className="card card--large">
            <h3 className="card__title">📅 Today's Schedule</h3>
            {scheduleLoading ? (
              <div className="widget-skeleton">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div className="widget-skeleton__row" key={i} />
                ))}
              </div>
            ) : scheduleErrored ? (
              <div className="widget-error">
                Could not load today's schedule.
                <button className="widget-error__retry" onClick={() => refetchSchedule()}>Retry</button>
              </div>
            ) : appointments.length === 0 ? (
              <div className="schedule-empty">No appointments today.</div>
            ) : (
              <div className="schedule-list">
                {appointments.map((appt) => {
                  const badge = deriveBadge(appt, now);
                  return (
                    <div className="schedule-item" key={appt.id}>
                      <span className="schedule-time">{timeLabel(appt.appointment_date_time)}</span>
                      <div className="schedule-patient">
                        <img src={`https://i.pravatar.cc/40?img=${(appt.patient_id % 70) + 1}`} alt="" />
                        <div>
                          <div className="patient-name">{appt.patient?.full_name ?? 'Unknown patient'}</div>
                          <div className="patient-service">{appt.reason_for_visit || 'Appointment'}</div>
                        </div>
                      </div>
                      <span className={`status-badge status-badge--${badge.cls}`}>{badge.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Appointment Status */}
          <div className="card card--medium">
            <h3 className="card__title">📊 Appointment Status</h3>
            <div className="chart-placeholder">
              <div className="pie-chart">
                <div className="pie-center">
                  <div className="pie-label">Total</div>
                  <div className="pie-value">100</div>
                </div>
              </div>
              <div className="chart-legend">
                <div className="legend-item"><span className="dot completed"></span> Completed 45%</div>
                <div className="legend-item"><span className="dot upcoming"></span> Upcoming 30%</div>
                <div className="legend-item"><span className="dot cancelled"></span> Cancelled 15%</div>
                <div className="legend-item"><span className="dot noshow"></span> No-show 10%</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <button className="settings-fab" title="Settings"><IconGear /></button>
    </div>
  );
}
