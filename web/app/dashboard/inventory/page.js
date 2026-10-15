'use client';
import { useState } from 'react';
import { useSession } from '../../../components/Providers';
import { api } from '../../../lib/api';
import { useApi } from '../../../lib/useApi';
import { Pill, Status } from '../../../components/ui';

const STATUS = { ok: ['low', 'In stock'], low: ['medium', 'Running low'], short: ['high', 'Short'] };

export default function Inventory() {
  const { user } = useSession();
  const { data, error, loading, reload } = useApi(user?.role === 'admin' ? '/inventory' : null);
  const [actionError, setActionError] = useState('');
  if (!user) return null;
  if (user.role !== 'admin') return <p className="error">Only admins can see inventory.</p>;

  async function adjust(item, delta) {
    setActionError('');
    try {
      await api(`/inventory/${item.id}`, { method: 'PATCH', body: { stock: Math.max(0, item.stock + delta) } });
      reload();
    } catch (e) {
      setActionError(e.message);
    }
  }

  return (
    <Status loading={loading} error={error}>
      <section className="card">
        <h2>School supplies</h2>
        {actionError && <p className="error" role="alert">{actionError}</p>}
        <div className="scroll" style={{ marginTop: 8 }}><table>
          <thead><tr><th>Item</th><th>Category</th><th className="num">In stock</th><th className="num">Needed</th><th>Status</th></tr></thead>
          <tbody>
            {(data?.items || []).map((i) => (
              <tr key={i.id}>
                <td>{i.item}</td>
                <td className="muted">{i.category}</td>
                <td className="num">
                  <span className="mono">{i.stock}</span> <span className="small muted">{i.unit}</span>{' '}
                  <button className="btn sm" aria-label={`Remove one ${i.item}`} onClick={() => adjust(i, -1)}>−</button>{' '}
                  <button className="btn sm" aria-label={`Add one ${i.item}`} onClick={() => adjust(i, 1)}>+</button>
                </td>
                <td className="num mono">{i.needed}</td>
                <td><Pill level={STATUS[i.status][0]}>{STATUS[i.status][1]}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </section>
    </Status>
  );
}
