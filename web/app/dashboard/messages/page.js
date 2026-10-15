'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from '../../../components/Providers';
import { api, since } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import { useApi } from '../../../lib/useApi';
import { Pill, Status } from '../../../components/ui';

export default function MessagesPage() {
  // useSearchParams needs a Suspense boundary in the Next.js app router.
  return <Suspense fallback={<p className="muted">Loading…</p>}><Messages /></Suspense>;
}

function Messages() {
  const { user } = useSession();
  const params = useSearchParams();
  const isTeacher = user?.role === 'teacher';
  const { data: roster } = useApi(isTeacher ? '/students' : null);
  const [picked, setPicked] = useState(null);
  const studentId = isTeacher ? picked || Number(params.get('student')) || roster?.students?.[0]?.id : user?.studentId;
  const { data, error, loading, reload } = useApi(studentId ? `/messages/${studentId}` : null);
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState('');

  // Reload the thread when the server says a message arrived for this student.
  useEffect(() => {
    if (!studentId) return undefined;
    const socket = getSocket();
    const onMessage = (m) => { if (m.studentId === studentId) reload(); };
    socket.on('message', onMessage);
    return () => socket.off('message', onMessage);
  }, [studentId, reload]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSendError('');
    try {
      await api(`/messages/${studentId}`, { method: 'POST', body: { body: text } });
      setText('');
      reload();
    } catch (err) {
      setSendError(err.message);
    }
  }

  if (!user) return null;
  const current = roster?.students?.find((s) => s.id === studentId);
  const thread = (
    <div>
      <h2>{isTeacher ? `Parent of ${current?.name || 'student'}` : 'Class teacher'}</h2>
      <Status loading={loading && Boolean(studentId)} error={error}>
        <div className="thread" style={{ marginTop: 12 }} aria-live="polite">
          {(data?.messages || []).length === 0 && <p className="muted">No messages yet. Say hello.</p>}
          {(data?.messages || []).map((m) => (
            <div key={m.id} className={`bub${m.sender_role === user.role ? ' me' : ''}`}>
              {m.body}<small>{m.sender_name} · {since(m.created_at)}</small>
            </div>
          ))}
        </div>
      </Status>
      <form className="compose" onSubmit={send}>
        <div>
          <label className="sr" htmlFor="msg">Message</label>
          <textarea id="msg" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a short, kind message" />
        </div>
        <button className="btn primary">Send</button>
      </form>
      {sendError && <p className="error" role="alert">{sendError}</p>}
    </div>
  );

  return (
    <section className="card">
      {isTeacher ? (
        <div className="msgs">
          <div>
            <h3 style={{ marginBottom: 8 }}>Parents</h3>
            <div className="tlist">
              {(roster?.students || []).map((s) => (
                <button key={s.id} aria-current={s.id === studentId} onClick={() => setPicked(s.id)}>
                  <span>{s.name}</span>{s.risk.level !== 'low' && <Pill level={s.risk.level}>{s.risk.level === 'high' ? 'High' : 'Watch'}</Pill>}
                </button>
              ))}
            </div>
          </div>
          {thread}
        </div>
      ) : thread}
    </section>
  );
}
