export default function DataTable({ columns, data, onRowClick, emptyMessage = 'No data found' }) {
  if (!data?.length) {
    return <p className="text-center py-8 text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/80 text-left">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row._id || row.id || i}
              onClick={() => onRowClick?.(row)}
              className={`border-t border-slate-100 dark:border-slate-700 hover:bg-brand-light/20 dark:hover:bg-slate-700/50 transition ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-slate-700 dark:text-slate-200">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
