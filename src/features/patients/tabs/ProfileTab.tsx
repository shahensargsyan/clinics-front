import { useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, App } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import {
  useGetPatient,
  useUpdatePatient,
  getGetPatientQueryKey,
} from '../../../api/generated/patients/patients';
import type { PatientUpdate } from '../../../api/generated/model';

export function ProfileTab({ patientId }: { patientId: number }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { data } = useGetPatient(patientId);

  // Pre-populate the form once data arrives (DatePicker needs a dayjs value).
  useEffect(() => {
    if (data?.data) {
      form.setFieldsValue({
        ...data.data,
        date_of_birth: data.data.date_of_birth ? dayjs(data.data.date_of_birth) : undefined,
      });
    }
  }, [data, form]);

  const { mutate, isPending } = useUpdatePatient({
    mutation: {
      onSuccess: () => {
        message.success('Profile saved');
        queryClient.invalidateQueries({ queryKey: getGetPatientQueryKey(patientId) });
      },
      onError: () => message.error('Save failed'),
    },
  });

  const onFinish = (values: { date_of_birth?: Dayjs; [k: string]: unknown }) =>
    mutate({
      id: patientId,
      data: {
        ...values,
        date_of_birth: values.date_of_birth?.format('YYYY-MM-DD'),
      } as PatientUpdate,
    });

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 560 }}>
      <Form.Item label="First name" name="first_name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Last name" name="last_name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Date of birth" name="date_of_birth">
        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
      </Form.Item>
      <Form.Item label="Gender" name="gender">
        <Select allowClear options={['Male', 'Female', 'Other'].map((g) => ({ value: g, label: g }))} />
      </Form.Item>
      <Form.Item label="Email" name="email" rules={[{ type: 'email' }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Phone" name="phone">
        <Input />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={isPending}>
        Save changes
      </Button>
    </Form>
  );
}
