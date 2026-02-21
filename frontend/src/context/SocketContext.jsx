import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
