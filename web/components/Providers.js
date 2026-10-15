'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { closeSocket } from '../lib/socket';

const SessionContext = createContext(null);
export const useSession = () => useContext(SessionContext);

// user is undefined while we check the session, null when signed out, or the user object.
export default function Providers({ children }) {
  const [user, setUser] = useState(undefined);

  const refresh = useCallback(async () => {
    try {
      const { user } = await api('/auth/me');
      setUser(user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    closeSocket();
    setUser(null);
  }, []);

  return <SessionContext.Provider value={{ user, setUser, refresh, logout }}>{children}</SessionContext.Provider>;
}
