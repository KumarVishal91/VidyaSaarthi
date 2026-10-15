'use client';
import { useState } from 'react';
import { useSession } from '../../../components/Providers';
import { api } from '../../../lib/api';
import { useApi } from '../../../lib/useApi';
import { Status } from '../../../components/ui';

const SUBJECTS = ['Maths', 'Science', 'Hindi', 'English', 'Social Sci.'];

export default function Resources() {
  const { user } = useSession();
  const { data, error, loading, reload } = useApi('/resources');
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState({ title: '', subject: 'Maths', type: 'PDF', language: 'Hindi' });
  const [formError, setFormError] = useState('');
  if (!user) return null;

  const list = (data?.resources || []).filter((r) => filter === 'All' || r.subject === filter);

  async function add(e) {
    e.preventDefault();
    setFormError('');
    try {
      await api('/resources', { method: 'POST', body: form });
      setForm({ ...form, title: '' });
      reload();
    } catch (err) {
      setFormError(err.message);
    }
  }

  return (
    <div className="stack">
      {user.role === 'teacher' && (
        <section className="card">
          <h2>Add a resource</h2>
          <form onSubmit={add}>
            <div className="grid two" style={{ gap: '0 16px' }}>
              <div><label htmlFor="title">Title</label><input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required minLength={2} /></div>
              <div><label htmlFor="subject">Subject</label><select id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div><label htmlFor="type">Type</label><select id="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{['PDF', 'Audio', 'Video'].map((s) => <option key={s}>{s}</option>)}</select></div>
              <div><label htmlFor="language">Language</label><select id="language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>{['Hindi', 'English'].map((s) => <option key={s}>{s}</option>)}</select></div>
            </div>
            {formError && <p className="error" role="alert">{formError}</p>}
            <p style={{ marginTop: 16 }}><button className="btn primary">Add and notify students</button></p>
          </form>
        </section>
      )}
      <section className="card">
        <div className="row">
          <h2>Study material</h2>
          <div className="chips">
            {['All', ...SUBJECTS].map((s) => <button key={s} className="chip" aria-pressed={filter === s} onClick={() => setFilter(s)}>{s}</button>)}
          </div>
        </div>
        <Status loading={loading} error={error}>
          <div style={{ marginTop: 8 }}>
            {list.length === 0 && <p className="muted">Nothing in this subject yet.</p>}
            {list.map((r) => (
              <div className="line" key={r.id}>
                <div><b>{r.title}</b><div className="chips" style={{ marginTop: 4 }}><span className="tag">{r.subject}</span><span className="tag">{r.type}</span><span className="tag">{r.language}</span></div></div>
              </div>
            ))}
          </div>
        </Status>
      </section>
    </div>
  );
}
