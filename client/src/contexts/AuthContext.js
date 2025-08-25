import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getMe } from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 사용자 정보 새로고침 함수
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      return;
    }
    
    try {
      const res = await getMe();
      setUser(res.data);
    } catch (err) {
      console.error('Failed to refresh user:', err);
      localStorage.removeItem('token');
      setUser(null);
    }
  }, []);

  // 로그아웃 함수
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { 
      setLoading(false); 
      return; 
    }
    
    getMe()
      .then(res => { setUser(res.data); })
      .catch(err => {
        console.error('Auth check failed:', err);
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // localStorage 변경 감지 (다른 탭에서의 로그인/로그아웃)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (e.newValue === null) {
          // 토큰이 삭제됨 (다른 탭에서 로그아웃)
          setUser(null);
        } else if (e.newValue !== e.oldValue) {
          // 새로운 토큰 (다른 탭에서 로그인)
          refreshUser();
        }
      }
    };

    // 사용자 정보 업데이트 이벤트 리스너
    const handleUserUpdate = () => {
      refreshUser();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userUpdated', handleUserUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);