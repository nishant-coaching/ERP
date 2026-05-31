import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Bell } from 'lucide-react';

export default function ParentNotifications() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
  });

  const markRead = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });

  const markAll = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 md:ml-52">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold">Notifications</h1>
        {data?.unreadCount > 0 && (
          <button onClick={() => markAll.mutate()} className="text-sm text-brand">
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {data?.data?.map((n) => (
          <div
            key={n._id}
            onClick={() => !n.read && markRead.mutate(n._id)}
            className={`card p-4 cursor-pointer transition ${
              !n.read ? 'border-l-4 border-l-brand bg-brand-light/20' : ''
            }`}
          >
            <div className="flex gap-3">
              <Bell size={20} className="text-brand shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-slate-500 mt-1">{n.message}</p>
                <p className="text-xs text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
        {!data?.data?.length && <p className="text-slate-500 text-center py-8">No notifications</p>}
      </div>
    </div>
  );
}
