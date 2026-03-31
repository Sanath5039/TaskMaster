import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyTheme = (themeStr) => {
    let theme = themeStr || 'system';
    if (theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  };

  // On mount: try to load user from token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/api/auth/me')
        .then((res) => {
          setUser(res.data);
          api.get('/api/settings').then(setRes => {
            applyTheme(setRes.data?.appearance?.theme);
          }).catch(() => {});
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    
    // If it's a legacy login or direct success (unlikely now)
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      setUser(res.data);
      api.get('/api/settings').then(setRes => {
        applyTheme(setRes.data?.appearance?.theme);
      }).catch(() => {});
    }
    
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/api/auth/register', { name, email, password });
    
    // If it's a legacy register or direct success (unlikely now)
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      setUser(res.data);
    }
    
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    document.documentElement.classList.remove('light-theme');
  };

  const updateTheme = (themeStr) => {
    applyTheme(themeStr);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, updateTheme, applyTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
