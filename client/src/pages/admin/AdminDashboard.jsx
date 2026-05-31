import { useQuery } from '@tanstack/react-query';
import { Users, IndianRupee, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../../api/client';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { format } from 'date-fns';

const PIE_COLORS = ['#10B981', '#F59E0B', '#EF4444', '#94A3B8'];

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/dashboard/admin').then((r) => r.data.data),
  });

  if (isLoading) return <LoadingSpinner />;

  const pieData = [
    { name: 'Paid', value: data?.feeStatusBreakdown?.paid || 0 },
    { name: 'Due Soon', value: data?.feeStatusBreakdown?.due_soon || 0 },
    { name: 'Overdue', value: data?.feeStatusBreakdown?.overdue || 0 },
    { name: 'Pending', value: data?.feeStatusBreakdown?.pending || 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={data?.totalStudents} icon={Users} delay={0} />
        <StatCard
          title="Fees Pending"
          value={`₹${(data?.feesPending?.amount || 0).toLocaleString()}`}
          subtitle={`${data?.feesPending?.count} records`}
          icon={AlertTriangle}
          color="amber"
          delay={1}
        />
        <StatCard
          title="Collected This Month"
          value={`₹${(data?.collectedThisMonth || 0).toLocaleString()}`}
          icon={IndianRupee}
          color="green"
          delay={2}
        />
        <StatCard title="Top Performers" value={data?.topPerformers?.length || 0} icon={TrendingUp} delay={3} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-brand-top p-5">
          <h2 className="font-semibold mb-4">Monthly Fee Collection</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data?.monthlyCollection || []}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`₹${v}`, 'Collected']} />
              <Bar dataKey="amount" fill="#4A69BD" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-brand-top p-5">
          <h2 className="font-semibold mb-4">Fee Status</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold mb-3 text-emerald-700">Top Performers</h2>
          <ul className="space-y-2">
            {data?.topPerformers?.map((p, i) => (
              <li key={i} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <span>{p.student?.name}</span>
                <span className="font-medium text-brand">{p.percentage}%</span>
              </li>
            )) || <p className="text-slate-500 text-sm">No data yet</p>}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold mb-3 text-red-600">Needs Attention</h2>
          <ul className="space-y-2">
            {data?.lowPerformers?.map((p, i) => (
              <li key={i} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span>{p.student?.name}</span>
                <span className="font-medium">{p.percentage}%</span>
              </li>
            )) || <p className="text-slate-500 text-sm">No data yet</p>}
          </ul>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-4">Upcoming Fee Due Alerts</h2>
        <div className="space-y-2">
          {data?.upcomingDue?.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-slate-100 dark:border-slate-700">
              <span>{f.student?.name}</span>
              <span>₹{f.amount}</span>
              <span className="text-sm text-slate-500">{format(new Date(f.dueDate), 'dd MMM yyyy')}</span>
              <StatusBadge status={f.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
