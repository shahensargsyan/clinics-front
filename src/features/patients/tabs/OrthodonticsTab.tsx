import { Form, Input, Button, App, Empty, Switch, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListOrthodonticsMedicalHistories,
  useCreateOrthodonticsMedicalHistory,
  useUpdateOrthodonticsMedicalHistory,
  getListOrthodonticsMedicalHistoriesQueryKey,
} from '../../../api/generated/clinical/clinical';
import {
  useListDiagnosticAssets,
  useCreateDiagnosticAsset,
  useUpdateDiagnosticAsset,
  getListDiagnosticAssetsQueryKey,
} from '../../../api/generated/diagnostic-assets/diagnostic-assets';
import '../patient-edit.css';

const ORTHO_FIELDS = [
  ['main_complaints', 'Main complaints'],
  ['functional_disturbances', 'Functional disturbances'],
  ['ent_pathology', 'ENT pathology'],
  ['postural_disturbances', 'Postural disturbances'],
  ['biometric_findings', 'Biometric findings'],
  ['treatment_plan', 'Treatment plan'],
] as const;

const ASSET_FIELDS = [
  ['has_optg', 'OPTG'],
  ['has_trg', 'TRG'],
  ['has_cbct', 'CBCT'],
  ['has_biometry', 'Biometry'],
  ['has_photos', 'Photos'],
] as const;

export function OrthodonticsTab({ patientId }: { patientId: number }) {
  return (
    <div className="patient-profile-form">
      <div className="profile-layout">
        <OrthodonticsSection patientId={patientId} />
        <DiagnosticAssetsSection patientId={patientId} />
      </div>
    </div>
  );
}

function OrthodonticsSection({ patientId }: { patientId: number }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);

  const key = getListOrthodonticsMedicalHistoriesQueryKey({ patient_id: patientId });
  const { data, isLoading } = useListOrthodonticsMedicalHistories({
    patient_id: patientId,
    sort: '-created_at',
  });
  const existing = data?.data?.[0];

  useEffect(() => {
    if (existing) form.setFieldsValue(existing);
  }, [existing, form]);

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: key });
    message.success('Orthodontic history saved');
    setIsEditMode(false);
  };

  const { mutate: create, isPending: isCreating } = useCreateOrthodonticsMedicalHistory({
    mutation: { onSuccess },
  });
  const { mutate: update, isPending: isUpdating } = useUpdateOrthodonticsMedicalHistory({
    mutation: { onSuccess },
  });

  const onFinish = (v: Record<string, string | null | undefined>) => {
    if (existing) {
      update({ id: existing.id, data: v });
    } else {
      create({ data: { patient_id: patientId, ...v } });
    }
  };

  return (
    <div className="profile-column">
      <h3 className="profile-column__title">Orthodontics Medical History</h3>

      {!isEditMode ? (
        <>
          {existing ? (
            <div className="profile-display">
              {ORTHO_FIELDS.map(([name, label]) => (
                <div className="info-row" key={name}>
                  <span className="info-label">{label}:</span>
                  <span className="info-value">{existing[name] || 'N/A'}</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="No orthodontic history yet — click Edit to start one." />
          )}
          <div className="profile-actions" style={{ marginTop: 20 }}>
            <Button type="primary" onClick={() => setIsEditMode(true)} disabled={isLoading}>
              {existing ? 'Edit' : 'Add history'}
            </Button>
          </div>
        </>
      ) : (
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <div className="profile-fields">
            {ORTHO_FIELDS.map(([name, label]) => (
              <Form.Item key={name} label={label} name={name}>
                <Input.TextArea rows={2} />
              </Form.Item>
            ))}
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
  );
}

function DiagnosticAssetsSection({ patientId }: { patientId: number }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);

  const key = getListDiagnosticAssetsQueryKey({ patient_id: patientId });
  const { data, isLoading } = useListDiagnosticAssets({ patient_id: patientId });
  const existing = data?.data?.[0];

  useEffect(() => {
    if (existing) form.setFieldsValue(existing);
  }, [existing, form]);

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: key });
    message.success('Diagnostic assets saved');
    setIsEditMode(false);
  };

  const { mutate: create, isPending: isCreating } = useCreateDiagnosticAsset({
    mutation: { onSuccess },
  });
  const { mutate: update, isPending: isUpdating } = useUpdateDiagnosticAsset({
    mutation: { onSuccess },
  });

  const onFinish = (v: Record<string, boolean | undefined>) => {
    const payload = ASSET_FIELDS.reduce(
      (acc, [name]) => ({ ...acc, [name]: !!v[name] }),
      {} as Record<string, boolean>,
    );
    if (existing) {
      update({ id: existing.id, data: payload });
    } else {
      create({ data: { patient_id: patientId, ...payload } });
    }
  };

  return (
    <div className="profile-column">
      <h3 className="profile-column__title">Diagnostic Assets</h3>

      {!isEditMode ? (
        <>
          {existing ? (
            <div className="profile-display">
              {ASSET_FIELDS.map(([name, label]) => (
                <div className="info-row" key={name}>
                  <span className="info-label">{label}:</span>
                  <span className="info-value">
                    {existing[name] ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="No diagnostic assets yet — click Edit to start." />
          )}
          <div className="profile-actions" style={{ marginTop: 20 }}>
            <Button type="primary" onClick={() => setIsEditMode(true)} disabled={isLoading}>
              {existing ? 'Edit' : 'Add assets'}
            </Button>
          </div>
        </>
      ) : (
        <Form form={form} layout="horizontal" onFinish={onFinish}>
          <div className="profile-fields">
            {ASSET_FIELDS.map(([name, label]) => (
              <Form.Item
                key={name}
                label={label}
                name={name}
                valuePropName="checked"
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <Switch />
              </Form.Item>
            ))}
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
  );
}
