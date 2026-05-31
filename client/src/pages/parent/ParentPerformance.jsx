import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Download } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';

export default function ParentPerformance() {
  const { data: dash } = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: () => api.get('/dashboard/parent').then((r) => r.data.data),
  });

  const [studentId, setStudentId] = useState('');

  const activeId = studentId || dash?.students?.[0]?._id;

  const { data: performance, isLoading } = useQuery({
    queryKey: ['performance', activeId],
    queryFn: () => api.get(`/marks/student/${activeId}`).then((r) => r.data.data),
    enabled: !!activeId,
  });

  const chartData =
    performance?.map((m) => ({
      name: m.testId?.name?.slice(0, 12) || 'Test',
      percentage: m.percentage,
    })) || [];

  const latest = performance?.[performance.length - 1];

  const downloadReport = () => {
    const token = localStorage.getItem('accessToken');
    fetch(`/api/reports/report-card?format=pdf&studentId=${activeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'report-card.pdf';
        a.click();
      });
  };

  if (!dash) return <LoadingSpinner />;

  return (
    <div className="space-y-6 md:ml-52">
      <div className="flex flex-wrap justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Performance</h1>
        <button onClick={downloadReport} className="btn-secondary flex items-center gap-2 text-sm">
          <Download size={16} /> Download PDF
        </button>
      </div>

      {dash.students?.length > 1 && (
        <select className="input-field max-w-xs" value={activeId} onChange={(e) => setStudentId(e.target.value)}>
          {dash.students.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {latest && (
            <div className="card-brand-top p-6">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <p className="text-sm text-slate-500">Latest Test</p>
                  <p className="font-display text-xl font-bold">{latest.testId?.name}</p>
                  <p className="text-3xl font-bold text-brand mt-2">{latest.percentage}%</p>
                  <p className="text-sm">Rank in class: #{latest.rankInClass}</p>
                </div>
                <StatusBadge status={latest.label} />
              </div>
              {latest.teacherRemarks && (
                <p className="mt-4 text-sm bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  <strong>Teacher:</strong> {latest.teacherRemarks}
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {latest.subjects?.length ? (
                  latest.subjects.map((s) => (
                    <div key={s.name} className="text-center p-3 bg-brand-light/50 dark:bg-brand/10 rounded-lg">
                      <p className="text-xs text-slate-500">{s.name}</p>
                      <p className="font-bold">{s.marks}/{s.maxMarks}</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center p-3 bg-brand-light/50 dark:bg-brand/10 rounded-lg">
                    <p className="text-xs text-slate-500">Score</p>
                    <p className="font-bold">
                      {latest.obtainedMarks ?? '—'} / {latest.totalMarks ?? latest.testId?.totalMarks ?? '—'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card p-5">
            <h2 className="font-semibold mb-4">Score Trend</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="percentage" stroke="#4A69BD" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold">Monthly Reports</h2>
            {performance?.map((m) => (
              <div key={m._id} className="card p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{m.testId?.name}</p>
                  <p className="text-sm text-slate-500">{m.percentage}% · Rank #{m.rankInClass}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={m.label} />
                  <p className={`text-xs mt-1 ${m.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {m.delta > 0 ? '+' : ''}{m.delta}% vs prev
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
