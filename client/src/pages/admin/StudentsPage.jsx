import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../../api/client';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const emptyForm = {
  admissionNo: '',
  name: '',
  className: '',
  joiningDate: '',
  monthlyFeeAmount: '',
  parentName: '',
  parentPhone: '',
  contact: { phone: '', email: '' },
};

function displayClass(row) {
  return row.className || row.classId?.name || '—';
}

function formatJoinDate(row) {
  if (!row.joiningDate) return '—';
  return format(new Date(row.joiningDate), 'dd MMM yyyy');
}

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const qc = useQueryClient();

  const { data: students, isLoading } = useQuery({
    queryKey: ['students', search, classFilter],
    queryFn: () =>
      api.get('/students', { params: { search, className: classFilter || undefined } }).then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        admissionNo: form.admissionNo,
        name: form.name,
        className: form.className,
        joiningDate: form.joiningDate,
        monthlyFeeAmount: form.monthlyFeeAmount,
        parentName: form.parentName,
        parentPhone: form.parentPhone,
        contact: form.contact,
      };
      if (editing) return api.put(`/students/${editing._id}`, payload);
      return api.post('/students', payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Student updated' : 'Student added');
      qc.invalidateQueries(['students']);
      qc.invalidateQueries(['fees']);
      qc.invalidateQueries(['admin-dashboard']);
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/students/${id}`),
    onSuccess: () => {
      toast.success('Student removed');
      qc.invalidateQueries(['students']);
    },
  });

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      admissionNo: row.admissionNo,
      name: row.name,
      className: row.className || row.classId?.name || '',
      joiningDate: row.joiningDate ? format(new Date(row.joiningDate), 'yyyy-MM-dd') : '',
      monthlyFeeAmount: row.monthlyFeeAmount ?? '',
      parentName: row.parentId?.name || '',
      parentPhone: row.parentId?.phone === 'N/A' ? '' : row.parentId?.phone || '',
      contact: row.contact || { phone: '', email: '' },
    });
    setModalOpen(true);
  };

  const columns = [
    { key: 'admissionNo', label: 'Admission No' },
    { key: 'name', label: 'Name' },
    { key: 'class', label: 'Class', render: displayClass },
    { key: 'joiningDate', label: 'Joining Date', render: formatJoinDate },
    { key: 'fee', label: 'Monthly Fee', render: (r) => (r.monthlyFeeAmount ? `₹${r.monthlyFeeAmount}` : 'Default') },
    { key: 'parent', label: 'Parent', render: (r) => r.parentId?.name },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(r)} className="p-1 text-brand hover:bg-brand-light rounded">
            <Pencil size={16} />
          </button>
          <button
            onClick={() => deleteMutation.mutate(r._id)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="font-display text-2xl font-bold">Student Management</h1>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => {
            setEditing(null);
            setForm(emptyForm);
            setModalOpen(true);
          }}
        >
          <Plus size={18} /> Add Student
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="input-field pl-10"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <input
          className="input-field w-48"
          placeholder="Filter by class"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
        />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : students?.length ? (
        <DataTable columns={columns} data={students} />
      ) : (
        <EmptyState icon={Users} title="No students" description="Add your first student to get started." />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Student' : 'Add Student'} size="lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Admission No</label>
            <input
              className="input-field"
              placeholder="e.g. NCC001"
              value={form.admissionNo}
              onChange={(e) => setForm({ ...form, admissionNo: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Student Name</label>
            <input
              className="input-field"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Class</label>
            <input
              className="input-field"
              placeholder="e.g. Class 10, JEE Batch"
              value={form.className}
              onChange={(e) => setForm({ ...form, className: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Joining Date</label>
            <input
              type="date"
              className="input-field"
              value={form.joiningDate}
              onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
              required
            />
            <p className="text-xs text-slate-500 mt-1">Monthly fee is due on this date each month</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Monthly Fee (₹)</label>
            <input
              type="number"
              min="0"
              className="input-field"
              placeholder="e.g. 3500 (leave empty for default)"
              value={form.monthlyFeeAmount}
              onChange={(e) => setForm({ ...form, monthlyFeeAmount: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Parent Name</label>
            <input
              className="input-field"
              placeholder="Parent / guardian name"
              value={form.parentName}
              onChange={(e) => setForm({ ...form, parentName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Parent Phone</label>
            <input
              className="input-field"
              placeholder="Parent contact number"
              value={form.parentPhone}
              onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Student Phone</label>
            <input
              className="input-field"
              placeholder="Optional"
              value={form.contact.phone}
              onChange={(e) => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Student Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="Optional"
              value={form.contact.email}
              onChange={(e) => setForm({ ...form, contact: { ...form.contact, email: e.target.value } })}
            />
          </div>
          <button type="submit" className="btn-primary sm:col-span-2" disabled={saveMutation.isPending}>
            {editing ? 'Update' : 'Create'} Student
          </button>
        </form>
      </Modal>
    </div>
  );
}
