import { Table, Button, Modal, Form, Input, App, Space } from 'antd';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListMedicalHistory,
  useCreateMedicalHistory,
  getListMedicalHistoryQueryKey,
} from '../../../api/generated/medical-history/medical-history';
import type { MedicalHistory } from '../../../api/generated/model';

export function MedicalHistoryTab({ patientId }: { patientId: number }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const key = getListMedicalHistoryQueryKey({ patient_id: patientId });
  const { data, isLoading } = useListMedicalHistory({ patient_id: patientId });

  const { mutate, isPending } = useCreateMedicalHistory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: key });
        message.success('Record added');
        setOpen(false);
        form.resetFields();
      },
    },
  });

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => setOpen(true)}>Add record</Button>
      </Space>
      <Table<MedicalHistory>
        rowKey="id"
        loading={isLoading}
        dataSource={data?.data ?? []}
        columns={[
          { title: 'Condition', dataIndex: 'condition_name' },
          { title: 'Notes', dataIndex: 'notes', render: (v) => v ?? '—' },
        ]}
      />
      <Modal
        title="New medical record"
        open={open}
        confirmLoading={isPending}
        destroyOnClose
        onCancel={() => setOpen(false)}
        onOk={() =>
          form.validateFields().then((v) => mutate({ data: { patient_id: patientId, ...v } }))
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Condition" name="condition_name" rules={[{ required: true, max: 255 }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
