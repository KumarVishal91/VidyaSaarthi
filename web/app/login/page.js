'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useSession } from '../../components/Providers';

const DEMO = [
  ['Student', 'aarav@demo.in'],
  ['Teacher', 'sunita@demo.in'],
  ['Parent', 'dinesh@demo.in'],
  ['Admin', 'principal@demo.in'],
];

export default function Login() {
  const { user, setUser } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) router.replace('/dashboard'); }, [user, router]);

  async function signIn(e, creds = { email, password }) {
    e?.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { user } = await api('/auth/login', { method: 'POST', body: creds });
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
        <h1>Sign in</h1>
        <form onSubmit={signIn}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="error" role="alert">{error}</p>}
          <p style={{ marginTop: 18 }}><button className="btn primary wide" disabled={busy}>Sign in</button></p>
        </form>
        <p className="small muted" style={{ marginTop: 16 }}>
          New here? <Link href="/signup">Create an account</Link>
        </p>
        <div style={{ borderTop: '1px solid var(--line)', marginTop: 18, paddingTop: 16 }}>
          <p className="small muted" style={{ marginBottom: 8 }}>Demo accounts (run the seed first). Password: demo1234</p>
          <div className="chips">
            {DEMO.map(([label, mail]) => (
              <button key={mail} className="chip" onClick={() => signIn(null, { email: mail, password: 'demo1234' })}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
