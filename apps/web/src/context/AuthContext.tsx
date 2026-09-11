'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: any;
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  setToken: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUserState] = useState<any>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken) setTokenState(storedToken);
    if (storedUser) {
      try {
        setUserState(JSON.parse(storedUser));
      } catch {
        setUserState(null);
      }
    }
  }, []);

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('accessToken', newToken);
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
    }
  };

  const logout = () => {
    setToken(null);
    setUserState(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
