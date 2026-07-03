import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { userStorage } from '../../api/token-storage';
import {
  connectGoogleCalendar,
  GOOGLE_CALENDAR_STATUS_QUERY_KEY,
  useGoogleCalendarStatus,
} from '../../api/google-calendar';
import { Sidebar } from '../../components/Sidebar';
import { UserMenu, AVATAR_URL } from '../../components/UserMenu';
import {
  IconSearch, IconExpand, IconMail, IconBell, IconHome, IconGear,
  IconFacebook, IconTwitter, IconGithub, IconInstagram, IconCalendar,
} from '../patients/icons';
import '../patients/patients.css';
import './profile.css';

const SKILLS = [
  { name: 'Cardiology', level: 90 },
  { name: 'Patient Care', level: 85 },
  { name: 'Diagnostics', level: 80 },
  { name: 'Surgery', level: 70 },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const initialTab = (location.state as { tab?: string } | null)?.tab === 'setting' ? 'setting' : 'about';
  const [tab, setTab] = useState<'about' | 'setting'>(initialTab);

  const user = userStorage.get();
  const name = user?.name ?? 'Doctor';
  const email = user?.email ?? 'doctor@example.com';

  const [form, setForm] = useState({ name, email, phone: '(123) 456 7890', location: 'India' });
  const [saved, setSaved] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const { data: calendarStatus, isLoading: calendarStatusLoading } = useGoogleCalendarStatus();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const result = params.get('google_calendar');
    if (!result) return;

    if (result === 'connected') {
      message.success('Google Calendar connected.');
      queryClient.invalidateQueries({ queryKey: GOOGLE_CALENDAR_STATUS_QUERY_KEY });
    } else if (result === 'error') {
      message.error('Could not connect Google Calendar. Please try again.');
    }
    navigate('/profile', { replace: true, state: { tab: 'setting' } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) userStorage.set({ ...user, name: form.name, email: form.email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const onConnectCalendar = async () => {
    setConnecting(true);
    try {
      const { url } = await connectGoogleCalendar();
      window.location.href = url;
    } catch {
      message.error('Could not start Google Calendar connection.');
      setConnecting(false);
    }
  };

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
          <div className="page-head__title">Profile</div>
          <nav className="breadcrumb">
            <IconHome />
            <span className="sep">/</span>
            <span>Other Pages</span>
            <span className="sep">/</span>
            <span className="current">Profile</span>
          </nav>
        </div>

        {/* ----------------------------- Profile layout ----------------------------- */}
        <div className="profile-page-layout">
          {/* Left column */}
          <div className="profile-side">
            <section className="profile-card">
              <img className="profile-card__avatar" src={AVATAR_URL} alt={name} />
              <h2 className="profile-card__name">{name}</h2>
              <div className="profile-card__role">Doctor</div>
              <p className="profile-card__blurb">
                Dedicated to providing compassionate, high-quality care and building
                lasting relationships with every patient.
              </p>
              <div className="profile-card__follow">Follow {name.split(' ')[0]} On</div>
              <div className="profile-card__socials">
                <a className="social-btn social-btn--fb" href="#" aria-label="Facebook"><IconFacebook /></a>
                <a className="social-btn social-btn--tw" href="#" aria-label="Twitter"><IconTwitter /></a>
                <a className="social-btn social-btn--gh" href="#" aria-label="GitHub"><IconGithub /></a>
                <a className="social-btn social-btn--ig" href="#" aria-label="Instagram"><IconInstagram /></a>
              </div>
            </section>

            <section className="profile-card profile-card--details">
              <h3 className="profile-card__title">Personal Details</h3>
              <div className="detail-row"><span className="detail-label">Birthday</span><span className="detail-value">30-05-1988</span></div>
              <div className="detail-row"><span className="detail-label">Phone</span><span className="detail-value">{form.phone}</span></div>
              <div className="detail-row"><span className="detail-label">Mail</span><span className="detail-value">{email}</span></div>
              <div className="detail-row"><span className="detail-label">Facebook</span><span className="detail-value detail-value--link">{name}</span></div>
              <div className="detail-row"><span className="detail-label">Twitter</span><span className="detail-value detail-value--link">@{name.toLowerCase().replace(/\s+/g, '')}</span></div>
            </section>

            <section className="profile-card profile-card--details">
              <h3 className="profile-card__title">Skills</h3>
              {SKILLS.map((s) => (
                <div key={s.name} className="skill">
                  <div className="skill__head">
                    <span>{s.name}</span>
                    <span>{s.level}%</span>
                  </div>
                  <div className="skill__track"><div className="skill__bar" style={{ width: `${s.level}%` }} /></div>
                </div>
              ))}
            </section>
          </div>

          {/* Right column */}
          <section className="profile-card profile-main">
            <div className="profile-tabs">
              <button className={`profile-tab${tab === 'about' ? ' profile-tab--active' : ''}`} onClick={() => setTab('about')}>About</button>
              <button className={`profile-tab${tab === 'setting' ? ' profile-tab--active' : ''}`} onClick={() => setTab('setting')}>Setting</button>
            </div>

            {tab === 'about' ? (
              <div className="profile-about">
                <div className="about-summary">
                  <div className="about-summary__item">
                    <div className="about-summary__label">Full Name</div>
                    <div className="about-summary__value">{name}</div>
                  </div>
                  <div className="about-summary__item">
                    <div className="about-summary__label">Mobile</div>
                    <div className="about-summary__value">{form.phone}</div>
                  </div>
                  <div className="about-summary__item">
                    <div className="about-summary__label">Email</div>
                    <div className="about-summary__value">{email}</div>
                  </div>
                  <div className="about-summary__item">
                    <div className="about-summary__label">Location</div>
                    <div className="about-summary__value">{form.location}</div>
                  </div>
                </div>

                <p className="about-text">
                  Completed my graduation in Medicine from a well known and renowned
                  institution, followed by residency and specialisation in cardiology.
                  Ranked among the top of the class throughout the course.
                </p>
                <p className="about-text">
                  Worked as senior physician and head of the cardiology department at a
                  multi-speciality hospital from 2015 to 2023, leading a team of twelve
                  doctors and overseeing patient care across the outpatient clinic.
                </p>

                <h4 className="about-heading">Education</h4>
                <ul className="about-list">
                  <li>M.B.B.S., Gujarat University, Ahmedabad, India.</li>
                  <li>M.D. (Cardiology), Gujarat University, Ahmedabad, India.</li>
                  <li>Fellowship, Interventional Cardiology, Rajkot.</li>
                </ul>

                <h4 className="about-heading">Experience</h4>
                <ul className="about-list">
                  <li>One year experience as Junior Resident from April 2009 to March 2010 at City Hospital, Ahmedabad.</li>
                  <li>Three years experience as Senior Resident at V.S. General Hospital from April 2010 to April 2013.</li>
                  <li>Head of Cardiology department at a multi-speciality clinic since 2015.</li>
                  <li>Regular speaker at national cardiology conferences and workshops.</li>
                </ul>
              </div>
            ) : (
              <div className="profile-setting">
                <form onSubmit={onSave}>
                  <div className="setting-grid">
                    <label className="setting-field">
                      <span>Full Name</span>
                      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </label>
                    <label className="setting-field">
                      <span>Email</span>
                      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </label>
                    <label className="setting-field">
                      <span>Mobile</span>
                      <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </label>
                    <label className="setting-field">
                      <span>Location</span>
                      <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                    </label>
                  </div>
                  <button type="submit" className="setting-save">Save Changes</button>
                  {saved && <span className="setting-saved">Saved ✓</span>}
                </form>

                <h4 className="about-heading">Integrations</h4>
                <div className="integration-row">
                  <div className="integration-row__icon"><IconCalendar /></div>
                  <div className="integration-row__info">
                    <div className="integration-row__title">Google Calendar</div>
                    <div className="integration-row__desc">Sync your appointments automatically with Google Calendar.</div>
                  </div>
                  <div className="integration-row__action">
                    {calendarStatusLoading ? (
                      <span className="integration-status">Checking…</span>
                    ) : calendarStatus?.connected ? (
                      <span className="integration-status integration-status--connected">● Connected</span>
                    ) : (
                      <button
                        type="button"
                        className="integration-connect-btn"
                        onClick={onConnectCalendar}
                        disabled={connecting}
                      >
                        {connecting ? 'Connecting…' : 'Connect Calendar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <button className="settings-fab" title="Settings"><IconGear /></button>
    </div>
  );
}
