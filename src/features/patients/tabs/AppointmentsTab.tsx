import { useState } from 'react';
import { Table, Button, Modal, Form, DatePicker, InputNumber, Input, Select, Tag, App, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import dayjs from 'dayjs';
import {
  useListAppointments,
  useCreateAppointment,
  getListAppointmentsQueryKey,
} from '../../../api/generated/appointments/appointments';
import type { Appointment } from '../../../api/generated/model';
import { userStorage } from '../../../api/token-storage';

const STATUS_COLOR: Record<string, string> = {
  Scheduled: 'blue',
  Confirmed: 'cyan',
  Completed: 'green',
  Cancelled: 'red',
};

export function AppointmentsTab({ patientId }: { patientId: number }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const currentUserId = userStorage.get()?.id;

  const listKey = getListAppointmentsQueryKey({ patient_id: patientId });
  const { data, isLoading } = useListAppointments({
    patient_id: patientId,
    sort: '-appointment_date_time',
  });

  const { mutate, isPending } = useCreateAppointment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: listKey }); // table refreshes instantly
        message.success('Appointment created');
        setOpen(false);
        form.resetFields();
      },
      onError: (error) => {
        const r = (error as unknown as AxiosError<{ errors: Record<string, string[]> }>).response;
        if (r?.status === 422) {
          form.setFields(
            Object.entries(r.data.errors).map(([name, errors]) => ({ name, errors })),
          );
        } else {
          message.error('Could not create appointment');
        }
      },
    },
  });

  const columns: ColumnsType<Appointment> = [
    {
      title: 'When',
      dataIndex: 'appointment_date_time',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    { title: 'Duration', dataIndex: 'duration_minutes', render: (v) => `${v} min` },
    { title: 'Reason', dataIndex: 'reason_for_visit', render: (v) => v ?? '—' },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={STATUS_COLOR[s]}>{s}</Tag> },
  ];

  const onCreate = () => {
    if (!currentUserId) {
      message.error('Your session is missing clinician info — please sign out and log in again.');
      return Promise.reject();
    }
    return form.validateFields().then((v) =>
      mutate({
        data: {
          patient_id: patientId,
          user_id: v.user_id,
          appointment_date_time: v.appointment_date_time.toISOString(),
          duration_minutes: v.duration_minutes ?? 30,
          reason_for_visit: v.reason_for_visit,
          status: v.status ?? 'Scheduled',
        },
      }),
    ).catch(() => {
      // validation errors are already surfaced on the form fields
    });
  };

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => setOpen(true)}>New appointment</Button>
      </Space>
      <Table<Appointment> rowKey="id" loading={isLoading} columns={columns} dataSource={data?.data ?? []} />

      <Modal
        title="New appointment"
        open={open}
        onOk={onCreate}
        confirmLoading={isPending}
        onCancel={() => setOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="user_id" initialValue={currentUserId} hidden rules={[{ required: true }]}>
            <InputNumber />
          </Form.Item>
          <Form.Item label="Date & time" name="appointment_date_time" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Duration (min)" name="duration_minutes" initialValue={30}>
            <InputNumber style={{ width: '100%' }} min={1} max={600} />
          </Form.Item>
          <Form.Item label="Reason" name="reason_for_visit">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Status" name="status" initialValue="Scheduled">
            <Select options={Object.keys(STATUS_COLOR).map((s) => ({ value: s, label: s }))} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
