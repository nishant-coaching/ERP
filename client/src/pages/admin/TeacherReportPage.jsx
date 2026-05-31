import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const emptyForm = {
  className: '',
  subject: '',
  currentChapter: '',
  totalChapters: '',
  completedChapters: '',
  teacherName: '',
  notes: '',
};

export default function TeacherReportPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterClass, setFilterClass] = useState('');
  const qc = useQueryClient();

  const { data: classNames = [] } = useQuery({
    queryKey: ['class-names'],
    queryFn: () => api.get('/marks/class-names').then((r) => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['syllabus', filterClass],
    queryFn: () =>
      api.get('/syllabus', { params: filterClass ? { className: filterClass } : {} }).then((r) => r.data),
  });

  const grouped = data?.data || {};

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        totalChapters: Number(form.totalChapters),
        completedChapters: Number(form.completedChapters) || 0,
      };
      if (editing) return api.put(`/syllabus/${editing._id}`, payload);
      return api.post('/syllabus', payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Updated' : 'Added');
      qc.invalidateQueries(['syllabus']);
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/syllabus/${id}`),
    onSuccess: () => {
      toast.success('Removed');
      qc.invalidateQueries(['syllabus']);
    },
  });

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      className: item.className,
      subject: item.subject,
      currentChapter: item.currentChapter,
      totalChapters: String(item.totalChapters),
      completedChapters: String(item.completedChapters),
      teacherName: item.teacherName || '',
      notes: item.notes || '',
    });
    setModalOpen(true);
  };

  const classKeys = filterClass ? [filterClass] : Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4 items-center">
        <div>
          <h1 className="font-display text-2xl font-bold">Teacher Report</h1>
          <p className="text-sm text-slate-500 mt-1">Syllabus progress grouped by class — no mixing between classes</p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => {
            setEditing(null);
            setForm({ ...emptyForm, className: filterClass || '' });
            setModalOpen(true);
          }}
        >
          <Plus size={18} /> Add Progress
        </button>
      </div>

      <select
        className="input-field max-w-xs"
        value={filterClass}
        onChange={(e) => setFilterClass(e.target.value)}
      >
        <option value="">All classes</option>
        {classNames.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {isLoading ? (
        <LoadingSpinner />
      ) : classKeys.length ? (
        <div className="space-y-6">
          {classKeys.map((className) => (
            <section key={className} className="card-brand-top overflow-hidden">
              <div className="bg-brand/5 dark:bg-brand/10 px-5 py-3 border-b border-slate-200 dark:border-slate-700">
                <h2 className="font-display font-bold text-lg text-brand">{className}</h2>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {(grouped[className] || []).map((item) => {
                  const pct = item.completionPercent ?? Math.round((item.completedChapters / item.totalChapters) * 100);
                  return (
                    <div key={item._id} className="p-5">
                      <div className="flex flex-wrap justify-between gap-3 items-start">
                        <div>
                          <p className="font-semibold">{item.subject}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                            Current chapter: <strong>{item.currentChapter}</strong>
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {item.completedChapters} of {item.totalChapters} chapters completed
                            {item.teacherName && ` · ${item.teacherName}`}
                          </p>
                          {item.notes && <p className="text-sm text-slate-500 mt-2 italic">{item.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-brand">{pct}%</span>
                          <button onClick={() => openEdit(item)} className="p-2 text-brand hover:bg-brand-light rounded">
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(item._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No teacher reports yet"
          description="Add syllabus progress for each class and subject."
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Progress' : 'Add Syllabus Progress'}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div>
            <label className="text-sm font-medium block mb-1">Class</label>
            <input
              list="class-options"
              className="input-field"
              placeholder="Class 10"
              value={form.className}
              onChange={(e) => setForm({ ...form, className: e.target.value })}
              required
            />
            <datalist id="class-options">
              {classNames.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Subject</label>
            <input
              className="input-field"
              placeholder="Mathematics"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium block mb-1">Current Chapter</label>
            <input
              className="input-field"
              placeholder="Chapter 5 — Trigonometry"
              value={form.currentChapter}
              onChange={(e) => setForm({ ...form, currentChapter: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Total Chapters</label>
            <input
              type="number"
              min="1"
              className="input-field"
              value={form.totalChapters}
              onChange={(e) => setForm({ ...form, totalChapters: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Completed Chapters</label>
            <input
              type="number"
              min="0"
              className="input-field"
              value={form.completedChapters}
              onChange={(e) => setForm({ ...form, completedChapters: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Teacher Name</label>
            <input
              className="input-field"
              value={form.teacherName}
              onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Notes</label>
            <input
              className="input-field"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary sm:col-span-2" disabled={saveMutation.isPending}>
            {editing ? 'Update' : 'Save'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
