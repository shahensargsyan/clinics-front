import { useMemo, useState } from 'react';
import { App, Button, DatePicker, Empty, Form, Input, Modal, Pagination, Select, Table } from 'antd';
import { AxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import {
  useGetPatientSummary,
  useListMechanotherapyVisits,
  useCreateMechanotherapyVisit,
  useUpdateMechanotherapyVisit,
  useDeleteMechanotherapyVisit,
  getGetPatientSummaryQueryKey,
} from '../../../api/generated/clinical/clinical';
import { useListUsers } from '../../../api/generated/users/users';
import type {
  MechanotherapyVisit,
  MechanotherapyVisitUpdate,
  ValidationErrorResponse,
} from '../../../api/generated/model';
import { userStorage } from '../../../api/token-storage';
import { IconEdit, IconTrash } from '../icons';
import '../patient-edit.css';

const KNOWN_FIELDS = new Set(['visit_date', 'procedure_notes', 'recommendations']);
const NOTES_TRUNCATE = 140;

type SortOption = 'visit_date' | '-visit_date';

export function MechanotherapyVisitsTab({ patientId }: { patientId: number }) {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const currentUser = userStorage.get();

  const [formOpen, setFormOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<MechanotherapyVisit | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [form] = Form.useForm();

  const summaryKey = getGetPatientSummaryQueryKey(patientId);
  const { data: summary, isLoading: summaryLoading } = useGetPatientSummary(patientId);
  const recentVisits = summary?.mechanotherapy_visits ?? [];

  const { data: usersData } = useListUsers({ per_page: 100 });
  const userNameById = useMemo(() => {
    const map = new Map<number, string>();
    (usersData?.data ?? []).forEach((u) => map.set(u.id, u.name));
    return map;
  }, [usersData]);

  const performedByLabel = (v: MechanotherapyVisit) => {
    if (v.performed_by == null) return '—';
    if (v.performed_by === currentUser?.id) return 'You';
    return userNameById.get(v.performed_by) ?? `User #${v.performed_by}`;
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: summaryKey });
    queryClient.invalidateQueries({ queryKey: ['/mechanotherapy-visits'] });
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingVisit(null);
    setGeneralError(null);
  };

  const handleFormError = (error: unknown) => {
    const r = (error as AxiosError<ValidationErrorResponse>).response;
    if (r?.status === 422 && r.data?.errors) {
      const entries = Object.entries(r.data.errors);
      const known = entries.filter(([k]) => KNOWN_FIELDS.has(k));
      const unknown = entries.filter(([k]) => !KNOWN_FIELDS.has(k));
      if (known.length) form.setFields(known.map(([name, errs]) => ({ name, errors: errs })));
      if (unknown.length) setGeneralError(unknown.map(([, errs]) => errs[0]).join(' '));
    } else {
      message.error('Could not save visit');
    }
  };

  const { mutate: create, isPending: isCreating } = useCreateMechanotherapyVisit({
    mutation: {
      onSuccess: () => {
        message.success('Visit recorded');
        closeForm();
        invalidateAll();
      },
      onError: handleFormError,
    },
  });
  const { mutate: update, isPending: isUpdating } = useUpdateMechanotherapyVisit({
    mutation: {
      onSuccess: () => {
        message.success('Visit updated');
        closeForm();
        invalidateAll();
      },
      onError: handleFormError,
    },
  });
  const { mutate: remove } = useDeleteMechanotherapyVisit({
    mutation: {
      onSuccess: () => {
        message.success('Visit deleted');
        invalidateAll();
      },
      onError: () => message.error('Could not delete visit'),
    },
  });

  const openAdd = () => {
    setEditingVisit(null);
    setGeneralError(null);
    form.resetFields();
    form.setFieldsValue({ visit_date: dayjs() });
    setFormOpen(true);
  };

  const openEdit = (v: MechanotherapyVisit) => {
    setEditingVisit(v);
    setGeneralError(null);
    form.setFieldsValue({
      visit_date: dayjs(v.visit_date),
      procedure_notes: v.procedure_notes ?? '',
      recommendations: v.recommendations ?? '',
    });
    setFormOpen(true);
  };

  const onFinish = (values: { visit_date: Dayjs; procedure_notes: string; recommendations?: string }) => {
    const dateStr = values.visit_date.format('YYYY-MM-DD');
    if (editingVisit) {
      const patch: MechanotherapyVisitUpdate = {};
      if (dateStr !== editingVisit.visit_date) patch.visit_date = dateStr;
      if ((values.procedure_notes || '') !== (editingVisit.procedure_notes ?? '')) {
        patch.procedure_notes = values.procedure_notes || null;
      }
      if ((values.recommendations || '') !== (editingVisit.recommendations ?? '')) {
        patch.recommendations = values.recommendations || null;
      }
      if (Object.keys(patch).length === 0) {
        closeForm();
        return;
      }
      update({ id: editingVisit.id, data: patch });
    } else {
      create({
        data: {
          patient_id: patientId,
          visit_date: dateStr,
          procedure_notes: values.procedure_notes,
          recommendations: values.recommendations || undefined,
        },
      });
    }
  };

  const onDelete = (v: MechanotherapyVisit) => {
    modal.confirm({
      title: 'Delete this visit record?',
      content: `Visit from ${v.visit_date} will be permanently removed.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => remove({ id: v.id }),
    });
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderNotes = (v: MechanotherapyVisit) => {
    const text = v.procedure_notes ?? '';
    if (!text) return '—';
    if (text.length <= NOTES_TRUNCATE || expanded.has(v.id)) {
      return (
        <>
          {text}
          {text.length > NOTES_TRUNCATE && (
            <button className="text-link-btn" onClick={() => toggleExpand(v.id)}>Show less</button>
          )}
        </>
      );
    }
    return (
      <>
        {text.slice(0, NOTES_TRUNCATE)}…
        <button className="text-link-btn" onClick={() => toggleExpand(v.id)}>Show more</button>
      </>
    );
  };

  return (
    <div className="patient-profile-form">
      <div className="profile-column">
        <div className="mech-visits-head">
          <h3 className="profile-column__title" style={{ margin: 0 }}>Recent Visits</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button onClick={() => setViewAllOpen(true)}>View all</Button>
            <Button type="primary" onClick={openAdd}>Add visit</Button>
          </div>
        </div>

        {!summaryLoading && recentVisits.length === 0 && (
          <Empty description="No visits recorded yet.">
            <Button type="primary" onClick={openAdd}>Add visit</Button>
          </Empty>
        )}

        {recentVisits.length > 0 && (
          <div className="mech-visit-list">
            {[...recentVisits]
              .sort((a, b) => b.visit_date.localeCompare(a.visit_date))
              .map((v) => (
                <div className="mech-visit-row" key={v.id}>
                  <div className="mech-visit-row__date">{v.visit_date}</div>
                  <div className="mech-visit-row__body">
                    <div className="mech-visit-row__field">
                      <span className="mech-visit-row__label">Procedure:</span>
                      {renderNotes(v)}
                    </div>
                    {v.recommendations && (
                      <div className="mech-visit-row__field">
                        <span className="mech-visit-row__label">Recommendations:</span>
                        {v.recommendations}
                      </div>
                    )}
                    {v.doctor_signature && (
                      <div className="mech-visit-row__field mech-visit-row__legacy">
                        <span className="mech-visit-row__label">Signature (legacy):</span>
                        {v.doctor_signature}
                      </div>
                    )}
                    <div className="mech-visit-row__meta">Performed by: {performedByLabel(v)}</div>
                  </div>
                  <div className="mech-visit-row__actions">
                    <button className="row-action row-action--edit" title="Edit" onClick={() => openEdit(v)}>
                      <IconEdit />
                    </button>
                    <button className="row-action row-action--delete" title="Delete" onClick={() => onDelete(v)}>
                      <IconTrash />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <Modal
        title={editingVisit ? 'Edit visit' : 'Add visit'}
        open={formOpen}
        onCancel={closeForm}
        confirmLoading={isCreating || isUpdating}
        onOk={() => form.validateFields().then(onFinish)}
        destroyOnClose
      >
        {generalError && <div className="form-general-error">{generalError}</div>}
        <Form form={form} layout="vertical">
          <Form.Item
            label="Visit date"
            name="visit_date"
            rules={[{ required: true, message: 'Visit date is required' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              disabledDate={(d) => d.isAfter(dayjs().add(1, 'day'), 'day')}
            />
          </Form.Item>
          <Form.Item
            label="Procedure notes"
            name="procedure_notes"
            rules={[{ required: true, message: 'Procedure notes are required' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Recommendations" name="recommendations">
            <Input.TextArea rows={3} />
          </Form.Item>
          <div className="mech-recorded-as">Recorded as: {currentUser?.name ?? 'you'}</div>
        </Form>
      </Modal>

      <MechanotherapyHistoryModal
        patientId={patientId}
        open={viewAllOpen}
        onClose={() => setViewAllOpen(false)}
        performedByLabel={performedByLabel}
        onEdit={(v) => {
          setViewAllOpen(false);
          openEdit(v);
        }}
        onDelete={onDelete}
      />
    </div>
  );
}

function MechanotherapyHistoryModal({
  patientId,
  open,
  onClose,
  performedByLabel,
  onEdit,
  onDelete,
}: {
  patientId: number;
  open: boolean;
  onClose: () => void;
  performedByLabel: (v: MechanotherapyVisit) => string;
  onEdit: (v: MechanotherapyVisit) => void;
  onDelete: (v: MechanotherapyVisit) => void;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('-visit_date');

  const { data, isFetching } = useListMechanotherapyVisits(
    { patient_id: patientId, page, per_page: 10, search: search || undefined, sort },
    { query: { enabled: open } },
  );

  return (
    <Modal title="All visits" open={open} onCancel={onClose} footer={null} width={800}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <Input.Search
          placeholder="Search notes or recommendations…"
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          allowClear
        />
        <Select<SortOption>
          value={sort}
          style={{ width: 180 }}
          onChange={setSort}
          options={[
            { value: '-visit_date', label: 'Newest first' },
            { value: 'visit_date', label: 'Oldest first' },
          ]}
        />
      </div>
      <Table<MechanotherapyVisit>
        rowKey="id"
        loading={isFetching}
        dataSource={data?.data ?? []}
        pagination={false}
        columns={[
          { title: 'Date', dataIndex: 'visit_date' },
          { title: 'Procedure notes', dataIndex: 'procedure_notes', render: (v) => v || '—' },
          { title: 'Recommendations', dataIndex: 'recommendations', render: (v) => v || '—' },
          { title: 'Performed by', render: (_, v) => performedByLabel(v) },
          {
            title: 'Actions',
            render: (_, v) => (
              <div className="row-actions">
                <button className="row-action row-action--edit" title="Edit" onClick={() => onEdit(v)}>
                  <IconEdit />
                </button>
                <button className="row-action row-action--delete" title="Delete" onClick={() => onDelete(v)}>
                  <IconTrash />
                </button>
              </div>
            ),
          },
        ]}
      />
      <Pagination
        style={{ marginTop: 14, textAlign: 'right' }}
        current={page}
        pageSize={10}
        total={data?.meta.total ?? 0}
        onChange={setPage}
        showSizeChanger={false}
      />
    </Modal>
  );
}
