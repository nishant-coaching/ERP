import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../../api/client';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function FeesPage() {
  const [sort, setSort] = useState('delay');
  const [status, setStatus] = useState('');
  const qc = useQueryClient();

  const { data: fees, isLoading } = useQuery({
    queryKey: ['fees', sort, status],
    queryFn: () => api.get('/fees', { params: { sort, status } }).then((r) => r.data.data),
  });

  const payMutation = useMutation({
    mutationFn: (id) => api.patch(`/fees/${id}/pay`, { paymentMode: 'upi' }),
    onSuccess: () => {
      toast.success('Marked as paid');
      qc.invalidateQueries(['fees']);
      qc.invalidateQueries(['admin-dashboard']);
    },
  });

  const reminderMutation = useMutation({
    mutationFn: () => api.post('/fees/reminders'),
    onSuccess: (r) => toast.success(r.data.message),
  });

  const exportFile = (format) => {
    const token = localStorage.getItem('accessToken');
    fetch(`/api/reports/fees?format=${format}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `fee-report.${format === 'xlsx' ? 'xlsx' : 'pdf'}`;
        a.click();
      });
  };

  const columns = [
    { key: 'student', label: 'Student', render: (r) => r.studentId?.name },
    { key: 'class', label: 'Class', render: (r) => r.studentId?.className || r.studentId?.classId?.name },
    { key: 'amount', label: 'Amount', render: (r) => `₹${r.amount}` },
    { key: 'due', label: 'Due Date', render: (r) => format(new Date(r.dueDate), 'dd MMM yyyy') },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'action',
      label: 'Action',
      render: (r) =>
        r.status !== 'paid' ? (
          <button onClick={() => payMutation.mutate(r._id)} className="btn-primary text-xs py-1 px-2">
            Mark Paid
          </button>
        ) : (
          <span className="text-xs text-slate-500">{r.receiptNo}</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Fees Management</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportFile('pdf')} className="btn-secondary text-sm">Export PDF</button>
          <button onClick={() => exportFile('xlsx')} className="btn-secondary text-sm">Export Excel</button>
          <button onClick={() => reminderMutation.mutate()} className="btn-primary text-sm">
            Send Reminders
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="input-field w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="delay">Highest Delay</option>
          <option value="upcoming">Upcoming Due</option>
        </select>
        <select className="input-field w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="due_soon">Due Soon</option>
          <option value="overdue">Overdue</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {isLoading ? <LoadingSpinner /> : <DataTable columns={columns} data={fees} emptyMessage="No fee records" />}
    </div>
  );
}
