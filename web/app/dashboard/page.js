'use client';
import Link from 'next/link';
import { useSession } from '../../components/Providers';
import { useApi } from '../../lib/useApi';
import { Delta, Dots, Meter, Pill, Status } from '../../components/ui';

export default function Home() {
  const { user } = useSession();
  if (!user) return null;
  if (user.role === 'teacher') return <TeacherHome />;
  if (user.role === 'admin') return <AdminHome />;
  return <ChildHome user={user} />;
}

function ChildHome({ user }) {
  const { data: s, error, loading } = useApi(`/students/${user.studentId}/summary`);
  return (
    <Status loading={loading} error={error}>
      {s && (
        <div className="stack">
          {s.risk.level === 'low' && <div className="callout good">{s.name.split(' ')[0]} is on track. Keep going.</div>}
          {s.risk.level !== 'low' && user.role === 'student' && (
            <div className="callout warn">Your attendance or marks have dipped. Talk to your teacher, she can help.</div>
          )}
          {s.risk.level !== 'low' && user.role === 'parent' && (
            <div className={`callout ${s.risk.level === 'high' ? 'bad' : 'warn'}`} role="alert">
              <div>
                <b>{s.name.split(' ')[0]} may need support.</b>
                <ul className="why">{s.risk.why.map((w) => <li key={w}>{w}</li>)}</ul>
              </div>
              <Link className="btn" href="/dashboard/messages">Message the teacher</Link>
            </div>
          )}
          <div className="grid stats">
            <div className="stat"><div className="k">Attendance</div><div className="v">{s.attendancePct}%</div><div className="small muted">last 20 school days</div></div>
            <div className="stat"><div className="k">Average marks</div><div className="v">{s.avgMarks}%</div><div className="small muted"><Delta value={s.marksChange} /> since the first test</div></div>
          </div>
          <section className="card">
            <h2>{s.name} · Class {s.className}</h2>
            <p className="small muted" style={{ margin: '4px 0 10px' }}>Last 10 school days</p>
            <Dots text={s.recent} />
          </section>
          <section className="card">
            <h2>Latest marks by subject</h2>
            <div className="scroll"><table>
              <thead><tr><th>Subject</th>{s.tests.map((t) => <th key={t} className="num">{t}</th>)}</tr></thead>
              <tbody>{s.subjects.map((x) => (
                <tr key={x.subject}><td>{x.subject}</td>{x.scores.map((v, i) => <td key={i} className="num mono">{v}</td>)}</tr>
              ))}</tbody>
            </table></div>
          </section>
        </div>
      )}
    </Status>
  );
}

function TeacherHome() {
  const { data, error, loading } = useApi('/students');
  const list = data?.students || [];
  const flagged = list.filter((s) => s.risk.level !== 'low');
  const avg = list.length ? Math.round(list.reduce((a, s) => a + s.attendancePct, 0) / list.length) : 0;
  return (
    <Status loading={loading} error={error}>
      <div className="stack">
        <div className="grid stats">
          <div className="stat"><div className="k">Students</div><div className="v">{list.length}</div><div className="small muted">in Class {data?.className}</div></div>
          <div className="stat"><div className="k">Class attendance</div><div className="v">{avg}%</div><div className="small muted">last 20 school days</div></div>
          <div className="stat"><div className="k">Early warnings</div><div className="v">{flagged.length}</div><div className="small muted">{flagged.filter((s) => s.risk.level === 'high').length} need attention</div></div>
        </div>
        <div className="callout"><span>Mark today’s attendance so parents hear about absences straight away.</span><Link className="btn primary" href="/dashboard/attendance">Take attendance</Link></div>
        <section className="card">
          <h2>Roster</h2>
          <div className="scroll"><table>
            <thead><tr><th>Roll</th><th>Student</th><th>Attendance</th><th className="num">Avg marks</th><th>Status</th></tr></thead>
            <tbody>{list.map((s) => (
              <tr key={s.id}>
                <td className="mono">{s.roll}</td><td>{s.name}</td><td><Meter value={s.attendancePct} /></td>
                <td className="num mono">{s.avgMarks}% <Delta value={s.marksChange} /></td><td><Pill level={s.risk.level} /></td>
              </tr>
            ))}</tbody>
          </table></div>
        </section>
      </div>
    </Status>
  );
}

function AdminHome() {
  const { data, error, loading } = useApi('/stats');
  return (
    <Status loading={loading} error={error}>
      {data && (
        <div className="stack">
          <div className="grid stats">
            <div className="stat"><div className="k">Students</div><div className="v">{data.students}</div></div>
            <div className="stat"><div className="k">Attendance</div><div className="v">{data.attendancePct}%</div></div>
            <div className="stat"><div className="k">Early warnings</div><div className="v">{data.flagged}</div></div>
            <div className="stat"><div className="k">Supplies low</div><div className="v">{data.lowSupplies}</div></div>
          </div>
          <section className="card">
            <h2>Attendance by class</h2>
            <div className="scroll"><table>
              <thead><tr><th>Class</th><th className="num">Students</th><th>Attendance</th><th className="num">Flagged</th></tr></thead>
              <tbody>{data.perClass.map((c) => (
                <tr key={c.className}><td>{c.className}</td><td className="num mono">{c.students}</td><td><Meter value={c.attendancePct} /></td><td className="num mono">{c.flagged}</td></tr>
              ))}</tbody>
            </table></div>
          </section>
        </div>
      )}
    </Status>
  );
}
