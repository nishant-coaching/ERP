import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Download, Trophy, AlertTriangle, FileText } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import DataTable from '../../components/DataTable';
import EmptyState from '../../components/EmptyState';

export default function ReportsPage() {
  const [selectedClass, setSelectedClass] = useState('');

  const { data: classNames = [] } = useQuery({
    queryKey: ['class-names'],
    queryFn: () => api.get('/marks/class-names').then((r) => r.data.data),
  });

  const { data: summary, isLoading } = useQuery({
    queryKey: ['report-summary', selectedClass],
    queryFn: () =>
      api.get('/reports/summary', { params: { className: selectedClass } }).then((r) => r.data.data),
    enabled: !!selectedClass,
  });

  const downloadReportCard = (studentId, name) => {
    const token = localStorage.getItem('accessToken');
    fetch(`/api/reports/report-card?format=pdf&studentId=${studentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `report-${name.replace(/\s+/g, '-')}.pdf`;
        a.click();
      });
  };

  const markColumns = [
    { key: 'student', label: 'Student', render: (r) => r.student?.name },
    { key: 'admission', label: 'Admission No', render: (r) => r.student?.admissionNo },
    {
      key: 'marks',
      label: 'Obtained / Total',
      render: (r) => `${r.obtainedMarks ?? '—'} / ${r.totalMarks ?? '—'}`,
    },
    { key: 'pct', label: '%', render: (r) => `${r.percentage}%` },
    { key: 'rank', label: 'Rank', render: (r) => r.rankInClass ?? '—' },
    { key: 'label', label: 'Status', render: (r) => <StatusBadge status={r.label} /> },
    {
      key: 'pdf',
      label: 'Report',
      render: (r) => (
        <button
          onClick={() => downloadReportCard(r.student._id, r.student.name)}
          className="btn-secondary text-xs py-1 px-2 flex items-center gap-1"
        >
          <Download size={12} /> PDF
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Student Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Marks, top performers, and students who need attention — by class</p>
      </div>

      <div className="card p-4 max-w-md">
        <label className="block text-sm font-medium mb-1">Select Class</label>
        <select
          className="input-field"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">Choose a class</option>
          {classNames.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {!selectedClass && (
        <EmptyState
          icon={FileText}
          title="Select a class"
          description="Reports are grouped by class. Fee reports are not shown here."
        />
      )}

      {selectedClass && isLoading && <LoadingSpinner />}

      {selectedClass && !isLoading && summary && (
        <>
          {summary.test ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Latest test: <strong>{summary.test.name}</strong> ·{' '}
              {format(new Date(summary.test.date), 'dd MMM yyyy')} · Total marks: {summary.test.totalMarks}
            </p>
          ) : (
            <p className="text-amber-600 text-sm">No marks uploaded for {selectedClass} yet. Add marks from Marks & Performance.</p>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            <section className="card-brand-top p-5 border-t-emerald-500">
              <h2 className="font-semibold flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-4">
                <Trophy size={20} /> Top Performers — {selectedClass}
              </h2>
              {summary.topPerformers?.length ? (
                <ul className="space-y-3">
                  {summary.topPerformers.map((m, i) => (
                    <li
                      key={m.student?._id}
                      className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
                    >
                      <div>
                        <span className="text-brand font-bold mr-2">#{i + 1}</span>
                        {m.student?.name}
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{m.percentage}%</span>
                        <p className="text-xs text-slate-500">
                          {m.obtainedMarks}/{m.totalMarks}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm">No data yet</p>
              )}
            </section>

            <section className="card-brand-top p-5 border-t-red-500">
              <h2 className="font-semibold flex items-center gap-2 text-red-600 mb-4">
                <AlertTriangle size={20} /> Needs Attention — {selectedClass}
              </h2>
              {summary.needsAttention?.length ? (
                <ul className="space-y-3">
                  {summary.needsAttention.map((m) => (
                    <li
                      key={m.student?._id}
                      className="flex justify-between items-start py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{m.student?.name}</p>
                        <StatusBadge status={m.label} />
                        {m.teacherRemarks && (
                          <p className="text-xs text-slate-500 mt-1">{m.teacherRemarks}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="font-bold text-red-600">{m.percentage}%</span>
                        <p className="text-xs text-slate-500">
                          {m.delta != null && (
                            <span className={m.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                              {m.delta > 0 ? '+' : ''}
                              {m.delta}%
                            </span>
                          )}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm">No students flagged</p>
              )}
            </section>
          </div>

          <section className="card p-5">
            <h2 className="font-semibold mb-4">All Student Marks — {selectedClass}</h2>
            {summary.allMarks?.length ? (
              <DataTable columns={markColumns} data={summary.allMarks} />
            ) : (
              <p className="text-slate-500 text-sm text-center py-6">No marks for this class</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
