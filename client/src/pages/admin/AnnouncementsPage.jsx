import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AnnouncementsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const qc = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/notifications/announcements').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/notifications/announcements', {
        title,
        body,
        targetRoles: ['parent', 'admin'],
      }),
    onSuccess: () => {
      toast.success('Announcement sent');
      setTitle('');
      setBody('');
      qc.invalidateQueries(['announcements']);
    },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-2xl font-bold">Announcements</h1>
      <div className="card p-6 space-y-4">
        <input className="input-field" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea
          className="input-field min-h-[120px]"
          placeholder="Message body..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button
          onClick={() => createMutation.mutate()}
          disabled={!title || !body}
          className="btn-primary"
        >
          Publish Announcement
        </button>
      </div>
      <h2 className="font-semibold">Recent</h2>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <ul className="space-y-3">
          {items?.map((a) => (
            <li key={a._id} className="card p-4">
              <p className="font-medium">{a.title}</p>
              <p className="text-sm text-slate-500 mt-1">{a.body}</p>
              <p className="text-xs text-slate-400 mt-2">{new Date(a.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
