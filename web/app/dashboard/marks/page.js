'use client';
import { useSession } from '../../../components/Providers';
import { useApi } from '../../../lib/useApi';
import { Delta, Status } from '../../../components/ui';

export default function Marks() {
  const { user } = useSession();
  const { data: s, error, loading } = useApi(user?.studentId ? `/students/${user.studentId}/summary` : null);
  if (!user) return null;
  return (
    <Status loading={loading} error={error}>
      {s && (
        <section className="card">
          <h2>{s.name}: marks by subject</h2>
          <div className="scroll" style={{ marginTop: 12 }}><table>
            <thead><tr><th>Subject</th>{s.tests.map((t) => <th key={t} className="num">{t}</th>)}<th className="num">Change</th></tr></thead>
            <tbody>
              {s.subjects.map((x) => (
                <tr key={x.subject}>
                  <td>{x.subject}</td>
                  {x.scores.map((v, i) => <td key={i} className="num mono">{v}</td>)}
                  <td className="num mono"><Delta value={x.scores[x.scores.length - 1] - x.scores[0]} /></td>
                </tr>
              ))}
              <tr>
                <td><b>Class average</b></td>
                {s.classAverage.map((v, i) => <td key={i} className="num mono">{v}</td>)}
                <td />
              </tr>
            </tbody>
          </table></div>
        </section>
      )}
    </Status>
  );
}
