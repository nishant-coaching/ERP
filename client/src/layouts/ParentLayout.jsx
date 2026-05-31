import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, IndianRupee, TrendingUp, Bell, FileDown, LogOut, Menu, Moon, Sun } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';

const nav = [
  { to: '/parent', icon: Home, label: 'Home', end: true },
  { to: '/parent/fees', icon: IndianRupee, label: 'Fees' },
  { to: '/parent/performance', icon: TrendingUp, label: 'Performance' },
  { to: '/parent/notifications', icon: Bell, label: 'Alerts' },
  { to: '/parent/reports', icon: FileDown, label: 'Reports' },
];

export default function ParentLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
  });

  const unread = notifData?.unreadCount || 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 md:pb-0">
      <header className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Logo size={36} />
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="p-2 text-red-600"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 md:hidden z-30">
        <div className="flex justify-around py-2">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1 text-xs ${
                  isActive ? 'text-brand font-medium' : 'text-slate-500'
                }`
              }
            >
              <div className="relative">
                <Icon size={22} />
                {to.includes('notifications') && unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                )}
              </div>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Desktop side links */}
      <aside className="hidden md:block fixed left-4 top-24 w-48 space-y-1">
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                isActive ? 'bg-brand text-white' : 'text-slate-600 hover:bg-brand-light'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        <p className="text-xs text-slate-400 px-3 mt-4">Logged in as {user?.name}</p>
      </aside>
    </div>
  );
}
