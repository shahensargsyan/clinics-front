import { useNavigate } from 'react-router-dom';
import { tokenStorage } from '../../api/token-storage';
import {
  IconHeart, IconSearch, IconExpand, IconMail, IconBell, IconHome,
  IconMonitor, IconActivity, IconSmile, IconUsers, IconDollar, IconBox,
  IconVideo, IconBadge, IconChart, IconGear, IconCalendarNav, IconAnchor,
  IconChevrons,
} from '../patients/icons';
import '../patients/patients.css';
import './dashboard.css';

export function DashboardPage() {
  const navigate = useNavigate();

  const signOut = () => {
    tokenStorage.clear();
    navigate('/login', { replace: true });
  };

  const navItems = [IconMonitor, IconActivity, IconSmile, IconUsers, IconDollar, IconBox, IconHome, IconVideo, IconBadge, IconChart, IconGear, IconCalendarNav, IconBox, IconAnchor, IconChevrons];
  const activeNav = 0; // monitor = dashboard

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
          <img className="doctor-profile__avatar" src="https://i.pravatar.cc/100?img=23" alt="Dr. Sarah Williams" />
          <div className="doctor-profile__content">
            <h2 className="doctor-profile__name">Dr. Sarah Williams</h2>
            <p className="doctor-profile__specialty">Cardiologist</p>
            <div className="doctor-profile__meta">
              <span>📧 sarah.williams@hospital.com</span>
              <span>📱 +1 234 567 8900</span>
              <span>⭐ 12 years experience</span>
            </div>
          </div>
          <div className="doctor-profile__status">
            <div className="status-dot"></div>
          </div>
          <button className="doctor-profile__btn">View Profile</button>
        </section>

        {/* ----------------------------- Stats Cards ----------------------------- */}
        <section className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-card__number">24</div>
            <div className="stat-card__label">Appointments</div>
            <div className="stat-card__icon">📅</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__number">12</div>
            <div className="stat-card__label">Completed</div>
            <div className="stat-card__icon">✅</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__number">8</div>
            <div className="stat-card__label">Upcoming</div>
            <div className="stat-card__icon">⏰</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__number">4</div>
            <div className="stat-card__label">Missed</div>
            <div className="stat-card__icon">❌</div>
          </div>
        </section>

        {/* ----------------------------- Main Content Grid ----------------------------- */}
        <section className="dashboard-content">
          {/* Today's Schedule */}
          <div className="card card--large">
            <h3 className="card__title">📅 Today's Schedule</h3>
            <div className="schedule-list">
              <div className="schedule-item">
                <span className="schedule-time">09:00 AM</span>
                <div className="schedule-patient">
                  <img src="https://i.pravatar.cc/40?img=1" alt="" />
                  <div>
                    <div className="patient-name">John Doe</div>
                    <div className="patient-service">Regular Checkup</div>
                  </div>
                </div>
                <span className="status-badge status-badge--completed">Completed</span>
              </div>
              <div className="schedule-item">
                <span className="schedule-time">10:30 AM</span>
                <div className="schedule-patient">
                  <img src="https://i.pravatar.cc/40?img=2" alt="" />
                  <div>
                    <div className="patient-name">Sarah Smith</div>
                    <div className="patient-service">Follow-up Consultation</div>
                  </div>
                </div>
                <span className="status-badge status-badge--completed">Completed</span>
              </div>
              <div className="schedule-item">
                <span className="schedule-time">11:00 AM</span>
                <div className="schedule-patient">
                  <img src="https://i.pravatar.cc/40?img=3" alt="" />
                  <div>
                    <div className="patient-name">Mike Johnson</div>
                    <div className="patient-service">Blood Pressure Check</div>
                  </div>
                </div>
                <span className="status-badge status-badge--inprogress">In Progress</span>
              </div>
            </div>
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

        {/* ----------------------------- Bottom Grid ----------------------------- */}
        <section className="dashboard-content">
          {/* Recent Messages */}
          <div className="card card--medium">
            <h3 className="card__title">💬 Recent Messages</h3>
            <div className="messages-list">
              <div className="message-item">
                <img src="https://i.pravatar.cc/40?img=10" alt="" />
                <div className="message-content">
                  <div className="message-name">Alice Johnson</div>
                  <div className="message-text">Can I reschedule my appointment?</div>
                </div>
                <span className="message-time">just now</span>
              </div>
              <div className="message-item">
                <img src="https://i.pravatar.cc/40?img=11" alt="" />
                <div className="message-content">
                  <div className="message-name">Michael Brown</div>
                  <div className="message-text">My lab report is ready. Should I book a follow-up?</div>
                </div>
                <span className="message-time">just now</span>
              </div>
              <div className="message-item">
                <img src="https://i.pravatar.cc/40?img=12" alt="" />
                <div className="message-content">
                  <div className="message-name">Emily Davis</div>
                  <div className="message-text">Thank you for the prescription update.</div>
                </div>
                <span className="message-time">just now</span>
              </div>
            </div>
            <button className="open-messages-btn">💬 Open Messages</button>
          </div>

          {/* Weekly Patient Volume */}
          <div className="card card--medium">
            <h3 className="card__title">📈 Weekly Patient Volume</h3>
            <div className="chart-placeholder chart-line">
              <div style={{ height: '120px', background: 'linear-gradient(135deg, rgba(100, 150, 255, 0.1) 0%, rgba(100, 150, 255, 0.05) 100%)', borderRadius: '8px' }}></div>
            </div>
          </div>
        </section>

        {/* ----------------------------- Tasks & Reviews Grid ----------------------------- */}
        <section className="dashboard-content">
          {/* Pending Tasks */}
          <div className="card card--medium">
            <h3 className="card__title">✓ Pending Tasks <span className="task-count">6</span></h3>
            <div className="tasks-list">
              <div className="task-item">
                <input type="checkbox" />
                <div>
                  <div className="task-title">Review lab reports</div>
                  <div className="task-desc">Check blood test results for 3 patients</div>
                  <div className="task-date">🔴 Nov 20</div>
                </div>
              </div>
              <div className="task-item">
                <input type="checkbox" />
                <div>
                  <div className="task-title">Sign prescriptions</div>
                  <div className="task-desc">5 prescriptions pending signature</div>
                  <div className="task-date">🔴 Nov 20</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Patient Reviews */}
          <div className="card card--medium">
            <h3 className="card__title">⭐ Recent Patient Reviews</h3>
            <div className="reviews-list">
              <div className="review-item">
                <div className="review-avatar">J.D.</div>
                <div className="review-content">
                  <div className="review-text">Excellent doctor! Very professional and caring.</div>
                  <div className="review-stars">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <div className="review-item">
                <div className="review-avatar">S.S.</div>
                <div className="review-content">
                  <div className="review-text">Great experience. Highly recommended!</div>
                  <div className="review-stars">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
            </div>
          </div>

          {/* Medication Stock Alerts */}
          <div className="card card--medium">
            <h3 className="card__title">💊 Medication Stock Alerts</h3>
            <div className="medication-list">
              <div className="medication-item">
                <div className="med-name">Insulin</div>
                <div className="med-info">Stock: 5/10</div>
                <span className="alert-badge alert-low">Low Stock</span>
              </div>
              <div className="medication-item">
                <div className="med-name">Metformin 500mg</div>
                <div className="med-info">Stock: 8/30</div>
                <span className="alert-badge alert-critical">Critical</span>
              </div>
              <div className="medication-item">
                <div className="med-name">Atorvastatin 20mg</div>
                <div className="med-info">Stock: 20/50</div>
                <span className="alert-badge alert-low">Low Stock</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <button className="settings-fab" title="Settings"><IconGear /></button>
    </div>
  );
}
