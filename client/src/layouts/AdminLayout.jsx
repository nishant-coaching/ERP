import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  IndianRupee,
  BarChart3,
  FileText,
  Bell,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  BookOpenCheck,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';

const nav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/students', icon: Users, label: 'Students' },
  { to: '/admin/fees', icon: IndianRupee, label: 'Fees' },
  { to: '/admin/marks', icon: BarChart3, label: 'Marks & Performance' },
  { to: '/admin/teacher-report', icon: BookOpenCheck, label: 'Teacher Report' },
  { to: '/admin/reports', icon: FileText, label: 'Student Reports' },
  { to: '/admin/announcements', icon: Bell, label: 'Announcements' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications?unread=true').then((r) => r.data),
    refetchInterval: 60000,
  });

  const unread = notifData?.unreadCount || 0;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-brand text-white transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-white/10">
          <Logo showText className="[&_p]:text-white [&_span]:text-white/70" />
        </div>
        <nav className="p-3 space-y-1">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
                  isActive ? 'bg-white/20 font-medium' : 'hover:bg-white/10'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
          <button className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <p className="font-medium text-slate-600 dark:text-slate-300 hidden sm:block">
            Welcome, {user?.name}
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <NavLink to="/admin" className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
              <Bell size={20} />
              {unread > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {unread}
                </span>
              )}
            </NavLink>
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600">
              <LogOut size={20} />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
