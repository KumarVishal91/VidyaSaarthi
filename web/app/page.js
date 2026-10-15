'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../components/Providers';

export default function Index() {
  const { user } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return;
    router.replace(user ? '/dashboard' : '/login');
  }, [user, router]);

  return <p className="muted" style={{ padding: 24 }}>Loading…</p>;
}