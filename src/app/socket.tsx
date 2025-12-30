'use client';

import { useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSocketStore } from '@/stores/socketStore';
import { useSocketHandler } from '@/hooks/useSocketHandler';

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const { setSocket, setConnected } = useSocketStore();

  useEffect(() => {
    const socketInstance = io(`${process.env.NEXT_PUBLIC_API_URL}`, {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
     
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [setSocket, setConnected]);

  // Initialize socket handler
  useSocketHandler();

  return <>{children}</>;
};