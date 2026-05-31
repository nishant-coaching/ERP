import { motion } from 'framer-motion';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'brand', delay = 0 }) {
  const colors = {
    brand: 'border-t-brand bg-brand-light/30 dark:bg-brand/10',
    green: 'border-t-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    amber: 'border-t-amber-500 bg-amber-50 dark:bg-amber-900/20',
    red: 'border-t-red-500 bg-red-50 dark:bg-red-900/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      className={`card-brand-top p-5 ${colors[color]}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="p-2 rounded-lg bg-brand/10 text-brand">
            <Icon size={22} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
