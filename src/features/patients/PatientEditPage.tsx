import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Spin } from 'antd';
import { useGetPatient } from '../../api/generated/patients/patients';
import { Sidebar } from '../../components/Sidebar';
import { UserMenu } from '../../components/UserMenu';
import { ProfileTab } from './tabs/ProfileTab';
import { AppointmentsTab } from './tabs/AppointmentsTab';
import { MedicalHistoryTab } from './tabs/MedicalHistoryTab';
import { OrthodonticsTab } from './tabs/OrthodonticsTab';
import { CephalometricAnalysesTab } from './tabs/CephalometricAnalysesTab';
import { ToothMeasurementsTab } from './tabs/ToothMeasurementsTab';
import { MechanotherapyVisitsTab } from './tabs/MechanotherapyVisitsTab';
import { InvoicesTab } from './tabs/InvoicesTab';
import {
  IconSearch, IconExpand, IconMail, IconBell, IconHome, IconGear,
} from './icons';
import './patient-edit.css';

export function PatientEditPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { data, isLoading } = useGetPatient(id);
  const patient = data?.data;

  if (isLoading) return <Spin style={{ margin: '20vh auto', display: 'block' }} />;

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
          <div className="page-head__title">Patient Profile</div>
          <nav className="breadcrumb">
            <IconHome />
            <span className="sep">/</span>
            <span className="breadcrumb__link" onClick={() => navigate('/patients')}>My Patients</span>
            <span className="sep">/</span>
            <span className="current">Patient Profile</span>
          </nav>
        </div>

        {/* ------------------------------- Patient Header ------------------------------- */}
        <section className="patient-header-card">
          <img className="patient-header__avatar" src={`https://i.pravatar.cc/120?img=${(id % 70) + 1}`} alt={patient?.full_name} />
          <div className="patient-header__content">
            <h1 className="patient-header__name">{patient?.full_name}</h1>
            <p className="patient-header__id">Patient ID: {patient?.id}</p>
            <div className="patient-header__meta">
              <span className="meta-badge">🚻 {patient?.gender || 'N/A'}</span>
              <span className="meta-badge">35 years</span>
              <span className="meta-badge">A+</span>
              <span className="status-badge status-badge--discharged">Discharged</span>
            </div>
          </div>
        </section>

        {/* ------------------------------- Tabs ------------------------------- */}
        <section className="patient-tabs-card">
          <Tabs
            defaultActiveKey="personal"
            destroyInactiveTabPane
            className="patient-tabs"
            items={[
              { key: 'personal', label: 'Personal Info', children: <ProfileTab patientId={id} /> },
              { key: 'medical', label: 'Medical Info', children: <MedicalHistoryTab patientId={id} /> },
              { key: 'admission', label: 'Appointments', children: <AppointmentsTab patientId={id} /> },
              { key: 'history', label: 'Orthodontics Medical Histories', children: <OrthodonticsTab patientId={id} /> },
              { key: 'cephalometric', label: 'Cephalometric Analyses', children: <CephalometricAnalysesTab patientId={id} /> },
              { key: 'tooth-measurements', label: 'Tooth Measurements', children: <ToothMeasurementsTab patientId={id} /> },
              { key: 'mechanotherapy', label: 'Mechanotherapy Visits', children: <MechanotherapyVisitsTab patientId={id} /> },
              { key: 'invoices', label: 'Invoices', children: <InvoicesTab patientId={id} /> },
            ]}
          />
        </section>
      </div>

      <button className="settings-fab" title="Settings"><IconGear /></button>
    </div>
  );
}
