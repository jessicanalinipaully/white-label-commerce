'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: any;
  token: string | null;
  setToken: (token: string | null, user?: any) => void;
  setUser: (user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  setToken: () => {},
  setUser: () => {},
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

  const setToken = (newToken: string | null, newUser?: any) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('accessToken', newToken);
      if (newUser) {
        setUserState(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
      }
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUserState(null);
    }
  };

  const setUser = (newUser: any) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, setToken, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
