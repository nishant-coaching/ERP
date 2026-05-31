import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import DataTable from '../../components/DataTable';

export default function MarksPage() {
  const [tab, setTab] = useState('add');
  const [selectedClass, setSelectedClass] = useState('');
  const [sort, setSort] = useState('topper');
  const [order, setOrder] = useState('desc');
  const [testForm, setTestForm] = useState({ testName: '', testDate: '', totalMarks: '' });
  const [markRows, setMarkRows] = useState([]);
  const qc = useQueryClient();

  const { data: classNames = [] } = useQuery({
    queryKey: ['class-names'],
    queryFn: () => api.get('/marks/class-names').then((r) => r.data.data),
  });

  const { data: classStudents, isLoading: loadingStudents } = useQuery({
    queryKey: ['class-students', selectedClass],
    queryFn: () => api.get(`/marks/students/${encodeURIComponent(selectedClass)}`).then((r) => r.data.data),
    enabled: !!selectedClass && tab === 'add',
  });

  useEffect(() => {
    if (classStudents?.length) {
      setMarkRows(
        classStudents.map((s) => ({
          studentId: s._id,
          name: s.name,
          obtainedMarks: '',
          teacherRemarks: '',
        }))
      );
    } else {
      setMarkRows([]);
    }
  }, [classStudents]);

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['performance', selectedClass, sort, order],
    queryFn: () =>
      api.get('/marks/analytics', { params: { className: selectedClass, sort, order } }).then((r) => r.data),
    enabled: !!selectedClass && tab === 'view',
  });

  const saveMarks = useMutation({
    mutationFn: () => {
      const marks = markRows
        .filter((r) => r.obtainedMarks !== '' && r.obtainedMarks != null)
        .map((r) => ({
          studentId: r.studentId,
          obtainedMarks: Number(r.obtainedMarks),
          teacherRemarks: r.teacherRemarks,
        }));
      return api.post('/marks/entry', {
        className: selectedClass,
        testName: testForm.testName,
        testDate: testForm.testDate,
        totalMarks: Number(testForm.totalMarks),
        marks,
      });
    },
    onSuccess: () => {
      toast.success('Marks saved for class ' + selectedClass);
      setTestForm({ testName: '', testDate: '', totalMarks: '' });
      qc.invalidateQueries(['performance']);
      setTab('view');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save marks'),
  });

  const chartData =
    analytics?.data?.map((d) => ({
      name: d.student?.name?.split(' ')[0],
      current: d.currentPercentage,
      previous: d.previousPercentage || 0,
      delta: d.delta,
    })) || [];

  const viewColumns = [
    { key: 'name', label: 'Student', render: (r) => r.student?.name },
    {
      key: 'marks',
      label: 'Obtained / Total',
      render: (r) => `${r.obtainedMarks ?? '—'} / ${r.totalMarks ?? analytics?.meta?.test?.totalMarks ?? '—'}`,
    },
    { key: 'current', label: '%', render: (r) => `${r.currentPercentage}%` },
    {
      key: 'delta',
      label: 'Change',
      render: (r) => (
        <span className={r.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}>
          {r.delta > 0 ? '+' : ''}
          {r.delta}%
        </span>
      ),
    },
    { key: 'rank', label: 'Rank', render: (r) => r.rankInClass || '—' },
    { key: 'label', label: 'Label', render: (r) => <StatusBadge status={r.label} /> },
    { key: 'remarks', label: 'Remarks', render: (r) => r.teacherRemarks || '—' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Marks & Performance</h1>

      <div className="flex rounded-lg bg-slate-100 dark:bg-slate-700 p-1 w-fit">
        {[
          { id: 'add', label: 'Add Marks' },
          { id: 'view', label: 'View Analytics' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === t.id ? 'bg-brand text-white shadow' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card p-4">
        <label className="block text-sm font-medium mb-1">Select Class</label>
        <select
          className="input-field max-w-md"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">Choose a class (data stays separate per class)</option>
          {classNames.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {!selectedClass && (
        <p className="text-slate-500 text-sm">Select a class to add or view marks. Classes are never mixed.</p>
      )}

      {tab === 'add' && selectedClass && (
        <div className="space-y-4">
          <div className="card-brand-top p-5 grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Test Name</label>
              <input
                className="input-field"
                placeholder="Unit Test 1"
                value={testForm.testName}
                onChange={(e) => setTestForm({ ...testForm, testName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Test Date</label>
              <input
                type="date"
                className="input-field"
                value={testForm.testDate}
                onChange={(e) => setTestForm({ ...testForm, testDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Total Marks</label>
              <input
                type="number"
                min="1"
                className="input-field"
                placeholder="100"
                value={testForm.totalMarks}
                onChange={(e) => setTestForm({ ...testForm, totalMarks: e.target.value })}
              />
            </div>
          </div>

          {loadingStudents ? (
            <LoadingSpinner />
          ) : markRows.length ? (
            <>
              <h2 className="font-semibold">Students in {selectedClass}</h2>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="text-left p-3">Student</th>
                      <th className="text-left p-3">Obtained Marks</th>
                      <th className="text-left p-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {markRows.map((row, i) => (
                      <tr key={row.studentId} className="border-t border-slate-100 dark:border-slate-700">
                        <td className="p-3 font-medium">{row.name}</td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            max={testForm.totalMarks || undefined}
                            className="input-field w-28"
                            value={row.obtainedMarks}
                            onChange={(e) => {
                              const next = [...markRows];
                              next[i].obtainedMarks = e.target.value;
                              setMarkRows(next);
                            }}
                          />
                        </td>
                        <td className="p-3">
                          <input
                            className="input-field"
                            placeholder="Optional"
                            value={row.teacherRemarks}
                            onChange={(e) => {
                              const next = [...markRows];
                              next[i].teacherRemarks = e.target.value;
                              setMarkRows(next);
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                className="btn-primary"
                disabled={
                  saveMarks.isPending ||
                  !testForm.testName ||
                  !testForm.testDate ||
                  !testForm.totalMarks ||
                  !markRows.some((r) => r.obtainedMarks !== '')
                }
                onClick={() => saveMarks.mutate()}
              >
                Save Marks for {selectedClass}
              </button>
            </>
          ) : (
            <p className="text-slate-500">No students in this class. Add students with the same class name first.</p>
          )}
        </div>
      )}

      {tab === 'view' && selectedClass && (
        <>
          <div className="card p-4 flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm font-medium block mb-1">Sort By</label>
              <select className="input-field w-48" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="topper">Highest Marks</option>
                <option value="improvement">Improvement vs Previous</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Order</label>
              <select className="input-field w-40" value={order} onChange={(e) => setOrder(e.target.value)}>
                <option value="desc">{sort === 'improvement' ? 'Most Improved' : 'Highest First'}</option>
                <option value="asc">{sort === 'improvement' ? 'Most Declined' : 'Lowest First'}</option>
              </select>
            </div>
            {analytics?.meta?.test && (
              <p className="text-sm text-slate-500 ml-auto">
                {selectedClass} · {analytics.meta.test.name} (
                {format(new Date(analytics.meta.test.date), 'dd MMM yyyy')}) · Total{' '}
                {analytics.meta.test.totalMarks}
              </p>
            )}
          </div>

          {loadingAnalytics ? (
            <LoadingSpinner />
          ) : analytics?.data?.length ? (
            <>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="card-brand-top p-5">
                  <h2 className="font-semibold mb-4">{selectedClass} — Performance</h2>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="current" fill="#4A69BD" name="Current %" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="card-brand-top p-5">
                  <h2 className="font-semibold mb-4">{selectedClass} — Improvement</h2>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={chartData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="delta" stroke="#4A69BD" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <DataTable columns={viewColumns} data={analytics.data} />
            </>
          ) : (
            <p className="text-slate-500">No marks for {selectedClass} yet. Use Add Marks tab.</p>
          )}
        </>
      )}
    </div>
  );
}
