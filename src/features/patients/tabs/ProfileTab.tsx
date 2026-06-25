import { useEffect, useState } from 'react';
import { Form, Input, Select, DatePicker, Button, App } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import {
  useGetPatient,
  useUpdatePatient,
  getGetPatientQueryKey,
} from '../../../api/generated/patients/patients';
import type { PatientUpdate } from '../../../api/generated/model';
import '../patient-edit.css';

export function ProfileTab({ patientId }: { patientId: number }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { data } = useGetPatient(patientId);
  const [isEditMode, setIsEditMode] = useState(false);

  const patient = data?.data;

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
        setIsEditMode(false);
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

  if (!isEditMode) {
    return (
      <div className="patient-profile-form">
        <div className="profile-layout">
          <div className="profile-column">
            <h3 className="profile-column__title">Personal Information</h3>
            <div className="profile-display">
              <div className="info-row">
                <span className="info-label">Date of Birth:</span>
                <span className="info-value">{patient?.date_of_birth || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Marital Status:</span>
                <span className="info-value">Married</span>
              </div>
              <div className="info-row">
                <span className="info-label">National ID:</span>
                <span className="info-value">NATI{patientId}2345678</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{patient?.email || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Mobile:</span>
                <span className="info-value">{patient?.phone || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Address:</span>
                <span className="info-value">{patient?.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="profile-column">
            <h3 className="profile-column__title">Emergency Contact</h3>
            <div className="profile-display">
              <div className="info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">John Smith</span>
              </div>
              <div className="info-row">
                <span className="info-label">Relation:</span>
                <span className="info-value">Husband</span>
              </div>
              <div className="info-row">
                <span className="info-label">Phone:</span>
                <span className="info-value">+1 (987) 654-3210</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <Button type="primary" size="large" onClick={() => setIsEditMode(true)}>
            Edit Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} className="patient-profile-form">
      <div className="profile-layout">
        <div className="profile-column">
          <h3 className="profile-column__title">Personal Information</h3>
          <div className="profile-fields">
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
            <Form.Item label="Address" name="address">
              <Input.TextArea rows={3} />
            </Form.Item>
          </div>
        </div>

        <div className="profile-column">
          <h3 className="profile-column__title">Emergency Contact</h3>
          <div className="profile-fields">
            <Form.Item label="Name" name="emergency_contact_name">
              <Input placeholder="Contact name" />
            </Form.Item>
            <Form.Item label="Relation" name="emergency_contact_relation">
              <Input placeholder="e.g., Spouse, Parent, Sibling" />
            </Form.Item>
            <Form.Item label="Phone" name="emergency_contact_phone">
              <Input placeholder="Phone number" />
            </Form.Item>
          </div>
        </div>
      </div>

      <div className="profile-actions">
        <Button type="primary" htmlType="submit" loading={isPending} size="large">
          Save changes
        </Button>
        <Button size="large" onClick={() => setIsEditMode(false)}>
          Cancel
        </Button>
      </div>
    </Form>
  );
}
