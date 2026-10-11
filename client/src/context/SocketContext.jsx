import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const initializeSocket = useCallback(() => {
    if (!isAuthenticated || !user) return;
    
    if (socket?.connected) return;
    
    setConnecting(true);
    
    const newSocket = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('access_token') },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);
      setConnecting(false);
      reconnectAttempts.current = 0;
      
      if (user.role === 'DOCTOR') {
        newSocket.emit('join:department', { departmentId: user.doctorProfile?.department?.id });
      }
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
      setConnecting(false);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setConnecting(false);
      reconnectAttempts.current += 1;
    });
    
    newSocket.on('reconnect_attempt', (attempt) => {
      console.log('Socket reconnect attempt:', attempt);
      reconnectAttempts.current = attempt;
    });
    
    newSocket.on('reconnect', (attempt) => {
      console.log('Socket reconnected after:', attempt, 'attempts');
      setConnected(true);
      reconnectAttempts.current = 0;
      
      if (user.role === 'DOCTOR') {
        newSocket.emit('join:department', { departmentId: user.doctorProfile?.department?.id });
      }
    });
    
    setSocket(newSocket);
  }, [isAuthenticated, user, socket]);

  const joinDepartment = useCallback((departmentId) => {
    if (socket?.connected) {
      socket.emit('join:department', { departmentId });
    }
  }, [socket]);

  const leaveDepartment = useCallback((departmentId) => {
    if (socket?.connected) {
      socket.emit('leave:department', { departmentId });
    }
  }, [socket]);

  const joinSession = useCallback((sessionId) => {
    if (socket?.connected) {
      socket.emit('join:session', { sessionId });
    }
  }, [socket]);

  const leaveSession = useCallback((sessionId) => {
    if (socket?.connected) {
      socket.emit('leave:session', { sessionId });
    }
  }, [socket]);

  useEffect(() => {
    if (isAuthenticated && user) {
      initializeSocket();
    } else if (socket) {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
    }
  }, [isAuthenticated, user, initializeSocket, socket]);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const value = {
    socket,
    connected,
    connecting,
    joinDepartment,
    leaveDepartment,
    joinSession,
    leaveSession,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;