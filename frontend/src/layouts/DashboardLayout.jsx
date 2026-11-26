import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, Briefcase, Building2, LayoutDashboard, LogOut, Menu, UserRound, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const navByRole = {
  STUDENT: [
    { to: '/student', label: 'Overview', icon: LayoutDashboard },
    { to: '/student/jobs', label: 'Browse jobs', icon: Briefcase },
    { to: '/student/applications', label: 'Applications', icon: Building2 },
    { to: '/student/profile', label: 'Profile', icon: UserRound }
  ],
  RECRUITER: [
    { to: '/recruiter', label: 'Overview', icon: LayoutDashboard },
    { to: '/recruiter/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/recruiter/profile', label: 'Company profile', icon: UserRound }
  ],
  ADMIN: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/admin/applications', label: 'Applications', icon: Building2 }
  ]
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notes, setNotes] = useState([]);
  const [showNotes, setShowNotes] = useState(false);

  const links = navByRole[user?.role] || [];

  useEffect(() => {
    client.get('/notifications').then((res) => {
      setNotes(res.data.notifications);
      setUnread(res.data.unread);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-slate-200 bg-white p-4 transition lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-900">CampusHire</p>
            <p className="text-xs text-slate-400">Placement workspace</p>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <nav className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to.split('/').length === 2}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <link.icon size={16} />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {open ? (
        <button
          className="fixed inset-0 z-20 bg-slate-900/30 lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
          <button className="rounded-lg p-2 text-slate-600 lg:hidden" onClick={() => setOpen(true)}>
            <Menu size={18} />
          </button>
          <div className="hidden text-sm text-slate-500 lg:block">
            Signed in as <span className="font-medium text-slate-900">{user?.profile?.fullName}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button className="btn-secondary relative" onClick={() => setShowNotes((v) => !v)}>
                <Bell size={16} />
                {unread ? (
                  <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-brand-600 px-1 text-[10px] text-white">
                    {unread}
                  </span>
                ) : null}
              </button>
              {showNotes ? (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium">Notifications</p>
                    <button
                      className="text-xs text-brand-600"
                      onClick={async () => {
                        await client.patch('/notifications/read-all');
                        setUnread(0);
                        setNotes((current) => current.map((n) => ({ ...n, is_read: true })));
                      }}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 space-y-2 overflow-auto">
                    {notes.length === 0 ? (
                      <p className="py-6 text-center text-sm text-slate-400">No notifications yet.</p>
                    ) : (
                      notes.map((note) => (
                        <button
                          type="button"
                          key={note.id}
                          className="block w-full rounded-xl bg-slate-50 p-3 text-left"
                          onClick={() => {
                            if (note.link) navigate(note.link);
                            setShowNotes(false);
                          }}
                        >
                          <p className="text-sm font-medium text-slate-800">{note.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{note.message}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            <button
              className="btn-secondary"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
