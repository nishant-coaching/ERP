export default function Logo({ size = 40, showText = true, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="rounded-full bg-brand flex items-center justify-center text-white font-display font-bold shrink-0"
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        N
      </div>
      {showText && (
        <div className="hidden sm:block">
          <p className="font-display font-bold text-slate-900 dark:text-white leading-tight text-sm md:text-base">
            Nishant Coaching
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Classes ERP</p>
        </div>
      )}
    </div>
  );
}
