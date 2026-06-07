import { useState } from 'react';
import { Table, Button, Space, Typography, Input } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { useListPatients } from '../../api/generated/patients/patients';
import type { Patient } from '../../api/generated/model';
import { tokenStorage } from '../../api/token-storage';

const { Search } = Input;

export function PatientsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { data, isFetching } = useListPatients({
    search: search || undefined,
    page,
    per_page: perPage,
    sort: 'last_name',
  });

  const columns: ColumnsType<Patient> = [
    {
      title: 'Name',
      key: 'name',
      render: (_, p) => `${p.first_name} ${p.last_name}`,
      sorter: false,
    },
    { title: 'Date of birth', dataIndex: 'date_of_birth', render: (v) => v ?? '—' },
    { title: 'Gender', dataIndex: 'gender', render: (v) => v ?? '—' },
    { title: 'Email', dataIndex: 'email', render: (v) => v ?? '—' },
    { title: 'Phone', dataIndex: 'phone', render: (v) => v ?? '—' },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, p) => (
        <Button size="small" onClick={() => navigate(`/patients/${p.id}`)}>
          Open
        </Button>
      ),
    },
  ];

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize: perPage,
    total: data?.meta.total ?? 0,
    showSizeChanger: false,
    showTotal: (total) => `${total} patients`,
    onChange: (p) => setPage(p),
  };

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Patients
        </Typography.Title>
        <Space>
          <Button type="primary" onClick={() => navigate('/patients/new')}>
            New patient
          </Button>
          <Button
            onClick={() => {
              tokenStorage.clear();
              navigate('/login', { replace: true });
            }}
          >
            Sign out
          </Button>
        </Space>
      </Space>

      <Search
        placeholder="Search by name, email or phone…"
        allowClear
        style={{ maxWidth: 360, marginBottom: 16 }}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        onChange={(e) => { if (!e.target.value) { setSearch(''); setPage(1); } }}
      />

      <Table<Patient>
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={data?.data ?? []}
        pagination={pagination}
        onRow={(p) => ({ onClick: () => navigate(`/patients/${p.id}`), style: { cursor: 'pointer' } })}
      />
    </div>
  );
}
