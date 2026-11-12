import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  clearSession,
  clearStashedAdminSession,
  fetchMe,
  getStashedAdminSession,
  getStoredSession,
  logoutAccount,
  restoreAdminSession,
  stashAdminSession,
  storeSession,
} from '../services/authApi';

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
      .catch(async () => {
        // Sesi "masuk sebagai pengguna" sudah habis: kembali ke sesi admin yang disimpan.
        if (restoreAdminSession()) {
          try {
            setUser(await fetchMe());
            return;
          } catch {
            /* sesi admin juga sudah habis */
          }
        }
        clearSession();
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback((session) => {
    clearStashedAdminSession();
    storeSession({ token: session.token, expiresAt: session.expiresAt });
    setUser(session.user);
  }, []);

  // Super admin masuk sebagai pengguna: sesi admin disimpan dulu, lalu sesi pengguna dipakai.
  const impersonate = useCallback((session) => {
    stashAdminSession();
    storeSession({ token: session.token, expiresAt: session.expiresAt });
    setUser(session.user);
  }, []);

  // Akhiri sesi pengguna dan kembali ke akun admin. Mengembalikan true bila sesi admin berhasil dipulihkan.
  const stopImpersonating = useCallback(async () => {
    await logoutAccount();
    if (restoreAdminSession()) {
      try {
        setUser(await fetchMe());
        return true;
      } catch {
        /* sesi admin sudah habis: perlu masuk ulang */
      }
    }
    clearSession();
    setUser(null);
    return false;
  }, []);

  // Keluar. Bila sedang masuk sebagai pengguna, keluar berarti kembali ke akun admin (hasilnya true).
  const signOut = useCallback(async () => {
    if (getStashedAdminSession()?.token) return stopImpersonating();
    await logoutAccount();
    clearSession();
    setUser(null);
    return false;
  }, [stopImpersonating]);

  const updateUser = useCallback((next) => setUser(next), []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updateUser, impersonate, stopImpersonating }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}
