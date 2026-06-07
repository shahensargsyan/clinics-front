import { useState } from 'react';
import { Card, Button, Space, InputNumber, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { tokenStorage } from '../../api/token-storage';

// NOTE: the spec exposes no `GET /patients` list endpoint, so this is a lightweight
// landing page (create + open-by-id). Add a `listPatients` operation to the OpenAPI
// spec and regenerate to turn this into a real searchable table.
export function PatientsListPage() {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Patients
        </Typography.Title>
        <Button
          onClick={() => {
            tokenStorage.clear();
            navigate('/login', { replace: true });
          }}
        >
          Sign out
        </Button>
      </Space>

      <Card title="New patient" style={{ marginBottom: 16 }}>
        <Link to="/patients/new">
          <Button type="primary">Create patient</Button>
        </Link>
      </Card>

      <Card title="Open existing patient">
        <Space>
          <InputNumber
            min={1}
            placeholder="Patient id"
            value={openId ?? undefined}
            onChange={(v) => setOpenId(v)}
          />
          <Button disabled={!openId} onClick={() => navigate(`/patients/${openId}`)}>
            Open
          </Button>
        </Space>
      </Card>
    </div>
  );
}
