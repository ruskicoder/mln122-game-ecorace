"import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Player, Room, RoundCalculationResult, SocketResponse } from '@ecorace/shared';
import { ActionType, RoomStatus } from '@ecorace/shared';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  player: Player | null;
  room: Room | null;
  results: Record<string, RoundCalculationResult> | null;
  leaderboard: Player[] | null;
  error: string | null;
  createRoom: (adminUsername: string) => Promise<void>;
  joinRoom: (roomId: string, username: string) => Promise<void>;
  submitAction: (actionType: ActionType) => void;
  adminStartGame: () => void;
  adminNextRound: () => void;
  leaveRoom: () => void;
  clearError: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [results, setResults] = useState<Record<string, RoundCalculationResult> | null>(null);
  const [leaderboard, setLeaderboard] = useState<Player[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Extract socket connection URL from window location
  const socketUrl = window.location.origin;

  useEffect(() => {
    const newSocket = io(socketUrl, {
      autoConnect: true,
      transports: ['websocket'],
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected:', newSocket.id);

      // Reconnect if local storage contains session parameters
      const storedPlayerId = localStorage.getItem('playerId');
      const storedRoomId = localStorage.getItem('roomId');

      if (storedPlayerId && storedRoomId)
<truncated 7828 bytes>