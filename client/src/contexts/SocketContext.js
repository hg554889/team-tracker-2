import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      if (token) {
        const isProduction = window.location.hostname !== 'localhost';
        const apiUrl = isProduction 
          ? (process.env.REACT_APP_PRODUCTION_API_URL || 'https://team-tracker-2.onrender.com/api')
          : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
        const socketUrl = apiUrl.replace('/api', '');
        const newSocket = io(socketUrl, {
          auth: {
            token: token
          }
        });

        newSocket.on('connect', () => {
          setIsConnected(true);
          console.log('Connected to server');
        });

        newSocket.on('disconnect', () => {
          setIsConnected(false);
          console.log('Disconnected from server');
        });

        newSocket.on('error', (error) => {
          console.error('Socket error:', error);
        });

        // 승인 알림 처리
        newSocket.on('user-approved', (approvalData) => {
          console.log('User approved:', approvalData);
          
          // 사용자 정보 새로고침
          refreshUser();
          
          // 성공 메시지 표시
          window.dispatchEvent(new CustomEvent('toast', {
            detail: {
              type: 'success',
              msg: approvalData.message
            }
          }));
          
          // 사용자 업데이트 이벤트 발생
          window.dispatchEvent(new CustomEvent('userUpdated'));
        });

        // 권한 변경 알림 처리
        newSocket.on('role-updated', (data) => {
          console.log('Role updated:', data);
          
          // 새 토큰으로 교체
          localStorage.setItem('token', data.newToken);
          
          // 사용자 정보 새로고침
          refreshUser();
          
          // 성공 메시지 표시
          window.dispatchEvent(new CustomEvent('toast', {
            detail: {
              type: 'success',
              msg: '권한이 변경되었습니다. 새로고침하지 않고도 새 권한이 적용됩니다.'
            }
          }));
          
          // 사용자 업데이트 이벤트 발생
          window.dispatchEvent(new CustomEvent('userUpdated'));
        });

        setSocket(newSocket);

        return () => {
          newSocket.close();
          setSocket(null);
          setIsConnected(false);
        };
      }
    }
  }, [user]);

  const value = {
    socket,
    isConnected
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};