import { useQuery } from '@tanstack/react-query';
import { Download, FileText } from 'lucide-react';
import api from '../../api/client';

export default function ParentReports() {
  const { data: dash } = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: () => api.get('/dashboard/parent').then((r) => r.data.data),
  });

  const download = (studentId) => {
    const token = localStorage.getItem('accessToken');
    fetch(`/api/reports/report-card?format=pdf&studentId=${studentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'performance-report.pdf';
        a.click();
      });
  };

  return (
    <div className="space-y-6 md:ml-52">
      <h1 className="font-display text-2xl font-bold">Download Reports</h1>
      <div className="grid gap-4">
        {dash?.students?.map((s) => (
          <div key={s._id} className="card-brand-top p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileText className="text-brand" size={32} />
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-slate-500">Performance Report Card (PDF)</p>
              </div>
            </div>
            <button onClick={() => download(s._id)} className="btn-primary flex items-center gap-2">
              <Download size={18} /> Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
