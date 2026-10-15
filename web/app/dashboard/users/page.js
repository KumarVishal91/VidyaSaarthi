'use client';
import { useState } from 'react';
import { useSession } from '../../../components/Providers';
import { api } from '../../../lib/api';
import { useApi } from '../../../lib/useApi';
import { Status } from '../../../components/ui';

const ROLES = ['student', 'teacher', 'parent', 'admin'];

export default function Users() {
  const { user } = useSession();
  const { data, error, loading, reload } = useApi(user?.role === 'admin' ? '/users' : null);
  const [actionError, setActionError] = useState('');
  if (!user) return null;
  if (user.role !== 'admin') return <p className="error">Only admins can manage users.</p>;

  async function patch(id, body) {
    setActionError('');
    try {
      await api(`/users/${id}`, { method: 'PATCH', body });
      reload();
    } catch (e) {
      setActionError(e.message);
    }
  }

  return (
    <Status loading={loading} error={error}>
      <section className="card">
        <h2>People with access</h2>
        {actionError && <p className="error" role="alert">{actionError}</p>}
        <div className="scroll" style={{ marginTop: 8 }}><table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Linked to</th><th>Status</th></tr></thead>
          <tbody>
            {(data?.users || []).map((u) => {
              const me = u.id === user.id;
              return (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td className="small">{u.email}</td>
                  <td>
                    <label className="sr" htmlFor={`role-${u.id}`}>Role for {u.name}</label>
                    <select id={`role-${u.id}`} value={u.role} disabled={me} onChange={(e) => patch(u.id, { role: e.target.value })} style={{ minHeight: 36, padding: '4px 8px', width: 'auto' }}>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="small">{u.student_name || (u.class_name ? `Class ${u.class_name}` : 'School')}</td>
                  <td><button className="btn sm" disabled={me} onClick={() => patch(u.id, { active: !u.active })}>{u.active ? 'Active' : 'Disabled'}</button></td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
        <p className="small muted" style={{ marginTop: 10 }}>A role change applies when the person next signs in.</p>
      </section>
    </Status>
  );
}
