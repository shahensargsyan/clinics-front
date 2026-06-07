import { Table, Tag, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useListInvoices } from '../../../api/generated/invoices/invoices';
import { useListAppointments } from '../../../api/generated/appointments/appointments';
import type { Invoice } from '../../../api/generated/model';

// Backend enum is Pending | Paid | Partial. "Overdue" is NOT a stored status —
// derive it client-side from invoice_date when still unpaid.
function statusTag(inv: Invoice) {
  if (inv.payment_status === 'Paid') return <Tag color="green">Paid</Tag>;
  if (inv.payment_status === 'Partial') return <Tag color="gold">Partial</Tag>;
  const overdue = dayjs(inv.invoice_date).isBefore(dayjs(), 'day');
  return <Tag color={overdue ? 'red' : 'default'}>{overdue ? 'Overdue' : 'Pending'}</Tag>;
}

export function InvoicesTab({ patientId }: { patientId: number }) {
  // Invoices are keyed by appointment_id (1:1), not patient_id. Resolve the
  // patient's appointments first, then pull invoices per appointment.
  const { data: appts } = useListAppointments({ patient_id: patientId, per_page: 100 });
  const apptIds = new Set(appts?.data?.map((a) => a.id));

  const { data, isLoading } = useListInvoices({ per_page: 100, sort: '-invoice_date' });
  const rows = (data?.data ?? []).filter((inv) => apptIds.has(inv.appointment_id));

  const columns: ColumnsType<Invoice> = [
    { title: 'Date', dataIndex: 'invoice_date' },
    { title: 'Total', dataIndex: 'total_amount', align: 'right' },
    { title: 'Paid', dataIndex: 'amount_paid', align: 'right' },
    { title: 'Balance', dataIndex: 'remaining_balance', align: 'right' },
    { title: 'Status', key: 'status', render: (_, inv) => statusTag(inv) },
  ];

  return (
    <>
      <Alert
        type="info"
        showIcon
        message="Invoices are linked to appointments. A dedicated /patients/{id}/invoices endpoint would remove the client-side join below."
        style={{ marginBottom: 16 }}
      />
      <Table<Invoice> rowKey="id" loading={isLoading} columns={columns} dataSource={rows} pagination={false} />
    </>
  );
}
