'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '../../components/Providers';
import { api, since } from '../../lib/api';
import { getSocket } from '../../lib/socket';

const NAV = {
  student: [['/dashboard', 'Home'], ['/dashboard/attendance', 'Attendance'], ['/dashboard/marks', 'Marks'], ['/dashboard/resources', 'Resources'], ['/dashboard/assistant', 'Saarthi']],
  parent: [['/dashboard', 'My child'], ['/dashboard/attendance', 'Attendance'], ['/dashboard/marks', 'Marks'], ['/dashboard/messages', 'Messages'], ['/dashboard/assistant', 'Saarthi']],
  teacher: [['/dashboard', 'Class'], ['/dashboard/attendance', 'Attendance'], ['/dashboard/warnings', 'Warnings'], ['/dashboard/messages', 'Messages'], ['/dashboard/resources', 'Resources'], ['/dashboard/assistant', 'Saarthi']],
  admin: [['/dashboard', 'School'], ['/dashboard/warnings', 'Warnings'], ['/dashboard/inventory', 'Inventory'], ['/dashboard/users', 'Users'], ['/dashboard/assistant', 'Saarthi']],
};
const ROLE_LABEL = { student: 'Student', parent: 'Parent', teacher: 'Teacher', admin: 'Admin' };

export default function DashboardLayout({ children }) {
  const { user, logout } = useSession();
  const router = useRouter();
  const path = usePathname();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { if (user === null) router.replace('/login'); }, [user, router]);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await api('/notifications');
      setItems(data.items);
      setUnread(data.unread);
    } catch { /* the page shows its own errors */ }
  }, []);

  // Live alerts arrive over Socket.IO. The list is also loaded over REST so a refresh loses nothing.
  useEffect(() => {
    if (!user) return undefined;
    loadNotifications();
    const socket = getSocket();
    const onNotification = (n) => {
      setItems((list) => [n, ...list]);
      setUnread((u) => u + 1);
      setToast(n);
      setTimeout(() => setToast(null), 5000);
    };
    socket.on('notification', onNotification);
    return () => socket.off('notification', onNotification);
  }, [user, loadNotifications]);

  async function toggleBell() {
    const next = !open;
    setOpen(next);
    if (next && unread) {
      await api('/notifications/seen', { method: 'POST' }).catch(() => {});
      setUnread(0);
    }
  }

  if (!user) return <p className="muted" style={{ padding: 24 }}>Loading…</p>;

  return (
    <div className="app">
      <nav className="rail" aria-label="Main">
        <div className="brand" style={{ marginBottom: 0 }}>VidyaSaarthi</div>
        <div className="who"><b>{user.name}</b><span className="small muted">{ROLE_LABEL[user.role]}</span></div>
        <div className="nav">
          {NAV[user.role].map(([href, label]) => (
            <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>{label}</Link>
          ))}
        </div>
      </nav>
      <main className="main">
        <header className="top">
          <h1>{ROLE_LABEL[user.role]} dashboard</h1>
          <div className="acts">
            <div className="bell">
              <button className="btn" onClick={toggleBell} aria-expanded={open} aria-label={`Notifications, ${unread} unread`}>
                Alerts{unread > 0 && <span className="badge">{unread}</span>}
              </button>
              {open && (
                <div className="panel" role="region" aria-label="Notifications">
                  {items.length === 0 && <p className="muted small">Nothing yet. New alerts appear here as they happen.</p>}
                  {items.map((n) => (
                    <div className="item" key={n.id}>
                      <b>{n.title}</b>
                      <p className="small">{n.body}</p>
                      <span className="small muted">{since(n.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="btn" onClick={logout}>Sign out</button>
          </div>
        </header>
        {children}
      </main>
      {toast && <div className="toast" role="status"><b>{toast.title}</b><span className="small">{toast.body}</span></div>}
    </div>
  );
}
