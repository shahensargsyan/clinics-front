import { Form, Input, DatePicker, Button, App, Empty } from 'antd';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import {
  useListCephalometricAnalyses,
  useCreateCephalometricAnalysis,
  useUpdateCephalometricAnalysis,
  getListCephalometricAnalysesQueryKey,
} from '../../../api/generated/clinical/clinical';
import '../patient-edit.css';

const CEPH_FIELDS = [
  ['sna_degrees', 'SNA (degrees)'],
  ['snb_degrees', 'SNB (degrees)'],
  ['snpog_degrees', 'SN-Pog (degrees)'],
  ['interincisal_angle', 'Interincisal angle'],
  ['nl_ml_degrees', 'NL/ML (degrees)'],
  ['n_go_me_degrees', 'N-Go-Me (degrees)'],
  ['sn_pa_prime', "SN-PA'"],
  ['go_gn_length_mm', 'Go-Gn length (mm)'],
  ['bjork_sum_degrees', 'Björk sum (degrees)'],
  ['wits_appraisal_mm', 'Wits appraisal (mm)'],
] as const;

export function CephalometricAnalysesTab({ patientId }: { patientId: number }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);

  const key = getListCephalometricAnalysesQueryKey({ patient_id: patientId });
  const { data, isLoading } = useListCephalometricAnalyses({
    patient_id: patientId,
    sort: '-created_at',
  });
  const existing = data?.data?.[0];

  useEffect(() => {
    if (existing) {
      form.setFieldsValue({
        ...existing,
        analysis_date: existing.analysis_date ? dayjs(existing.analysis_date) : undefined,
      });
    }
  }, [existing, form]);

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: key });
    message.success('Cephalometric analysis saved');
    setIsEditMode(false);
  };

  const { mutate: create, isPending: isCreating } = useCreateCephalometricAnalysis({
    mutation: { onSuccess },
  });
  const { mutate: update, isPending: isUpdating } = useUpdateCephalometricAnalysis({
    mutation: { onSuccess },
  });

  const onFinish = (v: { analysis_date?: Dayjs; [k: string]: unknown }) => {
    const payload = { ...v, analysis_date: v.analysis_date?.format('YYYY-MM-DD') };
    if (existing) {
      update({ id: existing.id, data: payload });
    } else {
      create({ data: { patient_id: patientId, ...payload } });
    }
  };

  return (
    <div className="patient-profile-form">
      <div className="profile-column">
        <h3 className="profile-column__title">Cephalometric Analysis</h3>

        {!isEditMode ? (
          <>
            {existing ? (
              <div className="profile-display">
                <div className="info-row">
                  <span className="info-label">Analysis date:</span>
                  <span className="info-value">{existing.analysis_date || 'N/A'}</span>
                </div>
                {CEPH_FIELDS.map(([name, label]) => (
                  <div className="info-row" key={name}>
                    <span className="info-label">{label}:</span>
                    <span className="info-value">{existing[name] || 'N/A'}</span>
                  </div>
                ))}
                <div className="info-row">
                  <span className="info-label">Conclusions:</span>
                  <span className="info-value">{existing.conclusions || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <Empty description="No cephalometric analysis yet — click Edit to start one." />
            )}
            <div className="profile-actions" style={{ marginTop: 20 }}>
              <Button type="primary" onClick={() => setIsEditMode(true)} disabled={isLoading}>
                {existing ? 'Edit' : 'Add analysis'}
              </Button>
            </div>
          </>
        ) : (
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <div className="profile-fields">
              <Form.Item label="Analysis date" name="analysis_date">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
              {CEPH_FIELDS.map(([name, label]) => (
                <Form.Item key={name} label={label} name={name}>
                  <Input />
                </Form.Item>
              ))}
              <Form.Item label="Conclusions" name="conclusions">
                <Input.TextArea rows={3} />
              </Form.Item>
            </div>
            <div className="profile-actions" style={{ marginTop: 20 }}>
              <Button type="primary" htmlType="submit" loading={isCreating || isUpdating}>
                Save changes
              </Button>
              <Button onClick={() => setIsEditMode(false)}>Cancel</Button>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
}
