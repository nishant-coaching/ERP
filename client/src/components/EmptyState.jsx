export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && <Icon className="w-12 h-12 text-slate-300 mb-4" />}
      <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200">{title}</h3>
      {description && <p className="text-slate-500 mt-2 max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
