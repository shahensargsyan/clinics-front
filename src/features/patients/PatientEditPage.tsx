import { useParams } from 'react-router-dom';
import { Tabs, Spin, Typography } from 'antd';
import { useGetPatient } from '../../api/generated/patients/patients';
import { ProfileTab } from './tabs/ProfileTab';
import { AppointmentsTab } from './tabs/AppointmentsTab';
import { MedicalHistoryTab } from './tabs/MedicalHistoryTab';
import { OrthodonticsTab } from './tabs/OrthodonticsTab';
import { InvoicesTab } from './tabs/InvoicesTab';

export function PatientEditPage() {
  const id = Number(useParams().id);
  const { data, isLoading } = useGetPatient(id);

  if (isLoading) return <Spin style={{ margin: '20vh auto', display: 'block' }} />;

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={3}>{data?.data.full_name}</Typography.Title>
      <Tabs
        defaultActiveKey="profile"
        destroyInactiveTabPane
        items={[
          { key: 'profile', label: 'Profile', children: <ProfileTab patientId={id} /> },
          { key: 'appointments', label: 'Appointments', children: <AppointmentsTab patientId={id} /> },
          { key: 'medical', label: 'Medical History', children: <MedicalHistoryTab patientId={id} /> },
          { key: 'ortho', label: 'Orthodontics', children: <OrthodonticsTab patientId={id} /> },
          { key: 'invoices', label: 'Invoices', children: <InvoicesTab patientId={id} /> },
        ]}
      />
    </div>
  );
}
