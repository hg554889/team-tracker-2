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
  const { user } = useAuth();

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