'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useSession } from '../../components/Providers';

const ROLES = [
  ['student', 'Student'],
  ['parent', 'Parent'],
  ['teacher', 'Teacher'],
];

export default function Signup() {
  const { user, setUser } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', code: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => { if (user) router.replace('/dashboard'); }, [user, router]);

  const codeLabel = form.role === 'teacher' ? 'Staff code' : form.role === 'parent' ? 'Your child’s admission number' : 'Your admission number';
  const codeHint = form.role === 'teacher' ? 'Ask the school office. Demo code: STAFF-142' : 'Printed on the school card. Demo numbers: VS-2401 to VS-2412';

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { user } = await api('/auth/signup', { method: 'POST', body: form });
      setUser(user);
      router.replace('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <div className="box">
        <div className="brand">VidyaSaarthi</div>
        <h1>Create your account</h1>
        <form onSubmit={submit}>
          <label id="role-label">I am a</label>
          <div className="chips" role="group" aria-labelledby="role-label">
            {ROLES.map(([value, label]) => (
              <button type="button" key={value} className="chip" aria-pressed={form.role === value} onClick={() => setForm({ ...form, role: value, code: '' })}>{label}</button>
            ))}
          </div>
          <label htmlFor="name">Full name</label>
          <input id="name" autoComplete="name" value={form.name} onChange={set('name')} required />
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} required />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={set('password')} required />
          <p className="small muted">At least 8 characters.</p>
          <label htmlFor="code">{codeLabel}</label>
          <input id="code" value={form.code} onChange={set('code')} required />
          <p className="small muted">{codeHint}</p>
          {error && <p className="error" role="alert">{error}</p>}
          <p style={{ marginTop: 18 }}><button className="btn primary wide" disabled={busy}>Create account</button></p>
        </form>
        <p className="small muted" style={{ marginTop: 16 }}>Already have an account? <Link href="/login">Sign in</Link></p>
      </div>
    </main>
  );
}
