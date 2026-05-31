const styles = {
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  due_soon: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  pending: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  topper: 'bg-brand-light text-brand dark:bg-brand/30 dark:text-brand-light',
  excellent_improvement: 'bg-emerald-100 text-emerald-800',
  consistent: 'bg-blue-100 text-blue-800',
  needs_attention: 'bg-red-100 text-red-800',
};

const labels = {
  paid: 'Paid',
  due_soon: 'Due Soon',
  overdue: 'Overdue',
  pending: 'Pending',
  topper: 'Topper',
  excellent_improvement: 'Excellent Improvement',
  consistent: 'Consistent',
  needs_attention: 'Needs Attention',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}
