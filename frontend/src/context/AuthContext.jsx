import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('campushire_token');
    if (!token) {
      setLoading(false);
      return;
    }
    client
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('campushire_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const api = useMemo(
    () => ({
      user,
      loading,
      async login(payload) {
        const { data } = await client.post('/auth/login', payload);
        localStorage.setItem('campushire_token', data.token);
        setUser(data.user);
        return data.user;
      },
      async register(payload) {
        const { data } = await client.post('/auth/register', payload);
        localStorage.setItem('campushire_token', data.token);
        setUser(data.user);
        return data.user;
      },
      logout() {
        localStorage.removeItem('campushire_token');
        setUser(null);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function homeFor(role) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'RECRUITER') return '/recruiter';
  return '/student';
}
