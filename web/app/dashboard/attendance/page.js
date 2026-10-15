'use client';
import { useEffect, useState } from 'react';
import { useSession } from '../../../components/Providers';
import { api, localISO } from '../../../lib/api';
import { useApi } from '../../../lib/useApi';
import { Status } from '../../../components/ui';

export default function Attendance() {
  const { user } = useSession();
  if (!user) return null;
  return user.role === 'teacher' ? <TakeAttendance /> : <ChildAttendance studentId={user.studentId} />;
}

const OPTIONS = [['P', 'Present'], ['L', 'Late'], ['A', 'Absent']];

function TakeAttendance() {
  const [date, setDate] = useState(localISO());
  const { data, error, loading, reload } = useApi(`/attendance/class?date=${date}`);
  const [marks, setMarks] = useState({});
  const [message, setMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [busy, setBusy] = useState(false);

  // Start from what is already saved, and treat unmarked students as present.
  useEffect(() => {
    if (!data) return;
    setMarks(Object.fromEntries(data.students.map((s) => [s.id, s.status || 'P'])));
  }, [data]);

  const students = data?.students || [];
  const count = (c) => students.filter((s) => marks[s.id] === c).length;

  async function save() {
    setBusy(true);
    setMessage('');
    setSaveError('');
    try {
      const res = await api('/attendance', {
        method: 'POST',
        body: { date, marks: students.map((s) => ({ studentId: s.id, status: marks[s.id] || 'P' })) },
      });
      setMessage(`Saved. ${res.parentsNotified} parent${res.parentsNotified === 1 ? '' : 's'} notified.`);
      reload();
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <div className="row">
        <div>
          <h2>Take attendance</h2>
          <p className="small muted">Present {count('P')} · Late {count('L')} · Absent {count('A')}</p>
        </div>
        <div className="chips">
          <label className="sr" htmlFor="date">Date</label>
          <input id="date" type="date" value={date} max={localISO()} onChange={(e) => setDate(e.target.value)} style={{ width: 'auto' }} />
          <button className="btn sm" onClick={() => setMarks(Object.fromEntries(students.map((s) => [s.id, 'P'])))}>Mark all present</button>
          <button className="btn primary sm" onClick={save} disabled={busy || !students.length}>Save attendance</button>
        </div>
      </div>
      {message && <p className="small" role="status" style={{ marginTop: 8, color: 'var(--good)' }}>{message}</p>}
      {saveError && <p className="error" role="alert">{saveError}</p>}
      <Status loading={loading} error={error}>
        <div style={{ marginTop: 8 }}>
          {students.map((s) => (
            <div className="line" key={s.id}>
              <span><span className="mono muted">{String(s.roll).padStart(2, '0')}</span> &nbsp;{s.name}</span>
              <div className="seg att" role="group" aria-label={`Attendance for ${s.name}`}>
                {OPTIONS.map(([value, label]) => (
                  <button key={value} className={value} aria-pressed={marks[s.id] === value} onClick={() => setMarks({ ...marks, [s.id]: value })}>{label}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Status>
    </section>
  );
}

function ChildAttendance({ studentId }) {
  const { data, error, loading } = useApi(`/students/${studentId}/attendance`);
  const days = data?.days || [];
  const c = { P: 0, L: 0, A: 0 };
  days.forEach((d) => { c[d.status] += 1; });
  const pct = days.length ? Math.round(((c.P + c.L) / days.length) * 100) : 0;
  return (
    <Status loading={loading} error={error}>
      <div className="stack">
        <div className="grid stats">
          <div className="stat"><div className="k">Attendance</div><div className="v">{pct}%</div><div className="small muted">late counts as present</div></div>
          <div className="stat"><div className="k">Present</div><div className="v">{c.P}</div></div>
          <div className="stat"><div className="k">Late</div><div className="v">{c.L}</div></div>
          <div className="stat"><div className="k">Absent</div><div className="v">{c.A}</div></div>
        </div>
        <section className="card">
          <h2>Last few weeks</h2>
          <div className="days" style={{ marginTop: 12 }}>
            {days.map((d) => (
              <span key={d.date} className={`day ${d.status}`}>{d.date.slice(8)}/{d.date.slice(5, 7)}<small>{d.status}</small></span>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 10 }}>P present · L late · A absent</p>
        </section>
      </div>
    </Status>
  );
}
