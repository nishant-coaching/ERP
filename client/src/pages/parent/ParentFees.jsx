import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ParentFees() {
  const { data: fees, isLoading } = useQuery({
    queryKey: ['parent-fees'],
    queryFn: () => api.get('/fees').then((r) => r.data.data),
  });

  const downloadReceipt = (feeId) => {
    const token = localStorage.getItem('accessToken');
    fetch(`/api/reports/receipt?format=pdf&feeId=${feeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'receipt.pdf';
        a.click();
      });
  };

  const pending = fees?.filter((f) => f.status !== 'paid') || [];
  const paid = fees?.filter((f) => f.status === 'paid') || [];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 md:ml-52">
      <h1 className="font-display text-2xl font-bold">Fees</h1>

      <div className="card-brand-top p-5">
        <p className="text-sm text-slate-500">Total Pending</p>
        <p className="text-3xl font-bold text-brand">
          ₹{pending.reduce((s, f) => s + f.amount, 0).toLocaleString()}
        </p>
      </div>

      <section>
        <h2 className="font-semibold mb-3">Pending / Due</h2>
        <div className="space-y-3">
          {pending.map((f) => (
            <div key={f._id} className="card p-4 flex flex-wrap justify-between items-center gap-2">
              <div>
                <p className="font-medium">{f.studentId?.name}</p>
                <p className="text-sm text-slate-500">Due: {format(new Date(f.dueDate), 'dd MMM yyyy')}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">₹{f.amount}</span>
                <StatusBadge status={f.status} />
              </div>
            </div>
          ))}
          {!pending.length && <p className="text-slate-500 text-sm">All fees paid. Thank you!</p>}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Payment History</h2>
        <div className="space-y-3">
          {paid.map((f) => (
            <div key={f._id} className="card p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">₹{f.amount}</p>
                <p className="text-xs text-slate-500">
                  Paid {f.paidDate ? format(new Date(f.paidDate), 'dd MMM yyyy') : '-'}
                </p>
              </div>
              <button onClick={() => downloadReceipt(f._id)} className="btn-secondary text-xs flex items-center gap-1 py-1">
                <Download size={14} /> Receipt
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
