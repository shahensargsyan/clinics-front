import { Form, Input, Button, App, Empty } from 'antd';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListOrthodonticsMedicalHistories,
  useCreateOrthodonticsMedicalHistory,
  getListOrthodonticsMedicalHistoriesQueryKey,
} from '../../../api/generated/clinical/clinical';

const FIELDS = [
  ['main_complaints', 'Main complaints'],
  ['functional_disturbances', 'Functional disturbances'],
  ['ent_pathology', 'ENT pathology'],
  ['postural_disturbances', 'Postural disturbances'],
  ['biometric_findings', 'Biometric findings'],
  ['treatment_plan', 'Treatment plan'],
] as const;

export function OrthodonticsTab({ patientId }: { patientId: number }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const key = getListOrthodonticsMedicalHistoriesQueryKey({ patient_id: patientId });
  const { data, isLoading } = useListOrthodonticsMedicalHistories({
    patient_id: patientId,
    sort: '-created_at',
  });
  const latest = data?.data?.[0];

  useEffect(() => {
    if (latest) form.setFieldsValue(latest);
  }, [latest, form]);

  const { mutate, isPending } = useCreateOrthodonticsMedicalHistory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: key });
        message.success('Orthodontic history saved');
      },
    },
  });

  if (isLoading) return null;

  return (
    <Form
      form={form}
      layout="vertical"
      style={{ maxWidth: 640 }}
      onFinish={(v) => mutate({ data: { patient_id: patientId, ...v } })}
    >
      {!latest && <Empty description="No orthodontic history yet — fill in below to start one." />}
      {FIELDS.map(([name, label]) => (
        <Form.Item key={name} label={label} name={name}>
          <Input.TextArea rows={2} />
        </Form.Item>
      ))}
      <Button type="primary" htmlType="submit" loading={isPending}>Save</Button>
    </Form>
  );
}
