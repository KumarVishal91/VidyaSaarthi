'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSession } from '../../../components/Providers';
import { useApi } from '../../../lib/useApi';
import { Pill, Spark, Status } from '../../../components/ui';

export default function Warnings() {
  const { user } = useSession();
  const { data, error, loading } = useApi('/warnings');
  const [all, setAll] = useState(false);
  if (!user) return null;
  const list = data ? (all ? data.everyone : data.flagged) : [];
  return (
    <Status loading={loading} error={error}>
      <section className="card">
        <div className="row">
          <div>
            <h2>{list.length} student{list.length === 1 ? '' : 's'} to look at</h2>
            <p className="small muted">Scored from attendance and marks trends. Higher means more urgent.</p>
          </div>
          <button className="btn sm" aria-pressed={all} onClick={() => setAll(!all)}>{all ? 'Show flagged only' : 'Show everyone'}</button>
        </div>
        <div style={{ marginTop: 8 }}>
          {list.length === 0 && <p className="muted">Nobody is flagged. Attendance and marks look steady.</p>}
          {list.map((s) => (
            <div className="line" key={s.id} style={{ alignItems: 'flex-start' }}>
              <div>
                <b>{s.name}</b> <Pill level={s.risk.level} />
                <ul className="why">{(s.risk.why.length ? s.risk.why : ['No concerns found.']).map((w) => <li key={w}>{w}</li>)}</ul>
                {user.role === 'teacher' && <p style={{ marginTop: 10 }}><Link className="btn sm" href={`/dashboard/messages?student=${s.id}`}>Message parent</Link></p>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono"><b>{s.risk.score}</b>/100</div>
                <Spark values={s.weekly} />
                <div className="small muted">weekly attendance</div>
              </div>
            </div>
          ))}
        </div>
        <details style={{ marginTop: 12 }}>
          <summary>How the score works</summary>
          <ul className="why">
            <li>Attendance under 75% in the last 10 days: +35. Under 85%: +15.</li>
            <li>Attendance down more than 15 points against the 10 days before: +25.</li>
            <li>Absent 3 or more days in a row: +15.</li>
            <li>Average marks under 50%: +25. Under 60%: +10.</li>
            <li>Marks down 8 or more points since the first test: +20.</li>
            <li>50 and above is Needs attention. 25 to 49 is Watch.</li>
          </ul>
        </details>
      </section>
    </Status>
  );
}
