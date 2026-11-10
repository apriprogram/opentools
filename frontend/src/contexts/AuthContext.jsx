import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearSession, fetchMe, getStoredSession, logoutAccount, storeSession } from '../services/authApi';

const AuthContext = createContext(null);

// Menyediakan status masuk ke seluruh aplikasi. Saat dibuka, sesi tersimpan diperiksa ke server.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored?.token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback((session) => {
    storeSession({ token: session.token, expiresAt: session.expiresAt });
    setUser(session.user);
  }, []);

  const signOut = useCallback(async () => {
    await logoutAccount();
    clearSession();
    setUser(null);
  }, []);

  const updateUser = useCallback((next) => setUser(next), []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}
