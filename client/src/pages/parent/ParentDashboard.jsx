import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import { IndianRupee, TrendingUp, Calendar } from 'lucide-react';

export default function ParentDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: () => api.get('/dashboard/parent').then((r) => r.data.data),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 md:ml-52 animate-fade-in">
      <h1 className="font-display text-2xl font-bold">Parent Dashboard</h1>

      {data?.pendingFees?.some((f) => f.status === 'due_soon' || f.status === 'overdue') && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
          <p className="font-medium text-amber-800 dark:text-amber-200">Fee Alert</p>
          <p className="text-sm mt-1">
            Total pending: <strong>₹{data.totalPending?.toLocaleString()}</strong> — Please pay before due date.
          </p>
          <Link to="/parent/fees" className="text-brand text-sm font-medium mt-2 inline-block">
            View fees →
          </Link>
        </div>
      )}

      <section>
        <h2 className="font-semibold mb-3">Your Ward(s)</h2>
        <div className="grid gap-4">
          {data?.students?.map((s) => (
            <div key={s._id} className="card-brand-top p-5">
              <p className="font-bold text-lg">{s.name}</p>
              <p className="text-sm text-slate-500">
                {s.className || s.classId?.name} · {s.admissionNo}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link to="/parent/fees" className="card p-5 hover:shadow-md transition group">
          <IndianRupee className="text-brand mb-2" size={28} />
          <p className="font-semibold">Fees</p>
          <p className="text-2xl font-bold text-brand mt-1">₹{data?.totalPending?.toLocaleString() || 0}</p>
          <p className="text-xs text-slate-500">pending</p>
        </Link>
        <Link to="/parent/performance" className="card p-5 hover:shadow-md transition">
          <TrendingUp className="text-brand mb-2" size={28} />
          <p className="font-semibold">Performance</p>
          <p className="text-sm text-slate-500 mt-2">View report cards & trends</p>
        </Link>
      </div>

      <section className="card p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-3">
          <Calendar size={18} /> Upcoming Tests
        </h2>
        {data?.upcomingTests?.length ? (
          <ul className="space-y-2">
            {data.upcomingTests.map((t) => (
              <li key={t._id} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <span>{t.name}</span>
                <span className="text-sm text-slate-500">{format(new Date(t.date), 'dd MMM')}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 text-sm">No upcoming tests</p>
        )}
      </section>

      {data?.latestMarks?.length > 0 && (
        <section className="card p-5">
          <h2 className="font-semibold mb-3">Latest Results</h2>
          {data.latestMarks.map((m) => (
            <div key={m._id} className="flex justify-between items-center py-2">
              <span>{m.studentId?.name}</span>
              <span className="font-bold text-brand">{m.percentage}%</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
