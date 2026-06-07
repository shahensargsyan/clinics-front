import { Form, Input, Select, DatePicker, Button, Card, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import type { Dayjs } from 'dayjs';
import { useCreatePatient } from '../../api/generated/patients/patients';
import type { PatientCreate } from '../../api/generated/model';

type FormShape = Omit<PatientCreate, 'date_of_birth'> & { date_of_birth?: Dayjs };
type ValidationError = { message: string; errors: Record<string, string[]> };

export function PatientCreatePage() {
  const [form] = Form.useForm<FormShape>();
  const { message } = App.useApp();
  const navigate = useNavigate();

  const { mutate, isPending } = useCreatePatient({
    mutation: {
      onSuccess: (res) => {
        message.success('Patient created');
        navigate(`/patients/${res.data.id}`); // jump straight to the edit dashboard
      },
      onError: (error) => {
        const r = (error as unknown as AxiosError<ValidationError>).response;
        if (r?.status === 422) {
          form.setFields(
            Object.entries(r.data.errors).map(([name, errors]) => ({
              name: name as keyof FormShape,
              errors,
            })),
          );
        } else {
          message.error('Could not create patient');
        }
      },
    },
  });

  const onFinish = (values: FormShape) =>
    mutate({
      data: { ...values, date_of_birth: values.date_of_birth?.format('YYYY-MM-DD') },
    });

  return (
    <Card title="New patient" style={{ maxWidth: 640, margin: '24px auto' }}>
      <Form form={form} layout="vertical" onFinish={onFinish} disabled={isPending}>
        <Form.Item label="First name" name="first_name" rules={[{ required: true, max: 100 }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Last name" name="last_name" rules={[{ required: true, max: 100 }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Date of birth" name="date_of_birth">
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item label="Gender" name="gender">
          <Select
            allowClear
            options={['Male', 'Female', 'Other'].map((g) => ({ value: g, label: g }))}
          />
        </Form.Item>
        <Form.Item label="Email" name="email" rules={[{ type: 'email', max: 100 }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Phone" name="phone" rules={[{ max: 20 }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Address" name="address" rules={[{ max: 255 }]}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={isPending}>
          Create patient
        </Button>
      </Form>
    </Card>
  );
}
