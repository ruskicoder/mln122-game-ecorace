import React, { createContext, useContext, useState, useEffect } from 'react';
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

      if (storedPlayerId && storedRoomId) {
        newSocket.emit('join_room', {
          roomId: storedRoomId,
          username: '',
          playerId: storedPlayerId,
        }, (res: SocketResponse<Player>) => {
          if (res.success && res.data) {
            setPlayer(res.data);
            setRoom({
              id: res.data.roomId,
              status: res.data.role ? RoomStatus.PLAYING : RoomStatus.LOBBY,
              currentRound: 1,
              maxRounds: 5,
              macroBudget: 0.0,
              createdAt: '',
            });
          } else {
            // Clean stale local storage keys
            localStorage.removeItem('playerId');
            localStorage.removeItem('roomId');
            localStorage.removeItem('adminToken');
          }
        });
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    newSocket.on('room_updated', (data: { roomId: string; players: Player[] }) => {
      setRoom((prev) => {
        const base = prev || {
          id: data.roomId,
          status: RoomStatus.LOBBY,
          currentRound: 1,
          maxRounds: 5,
          macroBudget: 0.0,
          createdAt: '',
        };
        return { ...base, players: data.players };
      });

      // Synchronize own player object
      const self = data.players.find(p => p.socketId === newSocket.id || (player && p.id === player.id));
      if (self) setPlayer(self);
    });

    newSocket.on('game_started', (data: { roomId: string; players: Player[]; duration: number }) => {
      setRoom((prev) => {
        const base = prev || {
          id: data.roomId,
          status: RoomStatus.PLAYING,
          currentRound: 1,
          maxRounds: 5,
          macroBudget: 0.0,
          createdAt: '',
        };
        return { ...base, status: RoomStatus.PLAYING, players: data.players };
      });

      const self = data.players.find(p => p.socketId === newSocket.id || (player && p.id === player.id));
      if (self) setPlayer(self);
      setResults(null);
      setLeaderboard(null);
    });

    newSocket.on('round_started', (data: { round: number; duration: number; macroBudget: number }) => {
      setRoom((prev) => prev ? { ...prev, currentRound: data.round, macroBudget: data.macroBudget } : null);
      setResults(null);
    });

    newSocket.on('action_submitted', () => {
      // Informational socket notification triggers visual state update of players
    });

    newSocket.on('round_ended', (data: {
      round: number;
      results: Record<string, RoundCalculationResult>;
      players: Player[];
      macroBudget: number;
      macroEventTriggered?: string;
    }) => {
      setResults(data.results);
      setRoom((prev) => prev ? {
        ...prev,
        players: data.players,
        macroBudget: data.macroBudget,
      } : null);

      const self = data.players.find(p => player && p.id === player.id);
      if (self) setPlayer(self);
    });

    newSocket.on('game_ended', (data: { leaderboard: Player[] }) => {
      setLeaderboard(data.leaderboard);
      setRoom((prev) => prev ? { ...prev, status: RoomStatus.FINISHED } : null);
    });

    return () => {
      newSocket.close();
    };
  }, [player?.id]);

  const clearError = () => setError(null);

  const createRoom = async (adminUsername: string) => {
    try {
      setError(null);
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi khi tạo phòng');
      }

      localStorage.setItem('playerId', data.adminPlayer.id);
      localStorage.setItem('roomId', data.room.id);
      localStorage.setItem('adminToken', data.token);

      setPlayer(data.adminPlayer);
      setRoom(data.room);

      if (socket) {
        socket.emit('join_room', {
          roomId: data.room.id,
          username: adminUsername,
          playerId: data.adminPlayer.id,
        }, (socketRes: SocketResponse) => {
          if (!socketRes.success) {
            setError(socketRes.error || 'Lỗi khi kết nối socket');
          }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo phòng');
    }
  };

  const joinRoom = async (roomId: string, username: string) => {
    try {
      setError(null);
      const formattedRoomId = roomId.toUpperCase();
      
      const validateRes = await fetch(`/api/room/validate/${formattedRoomId}`);
      const validateData = await validateRes.json();
      if (!validateRes.ok) {
        throw new Error(validateData.message || 'Mã phòng không hợp lệ');
      }

      if (socket) {
        socket.emit('join_room', {
          roomId: formattedRoomId,
          username,
        }, (res: SocketResponse<Player>) => {
          if (res.success && res.data) {
            localStorage.setItem('playerId', res.data.id);
            localStorage.setItem('roomId', formattedRoomId);
            setPlayer(res.data);
            setRoom({
              id: formattedRoomId,
              status: RoomStatus.LOBBY,
              currentRound: 1,
              maxRounds: 5,
              macroBudget: 0.0,
              createdAt: '',
            });
          } else {
            setError(res.error || 'Lỗi khi vào phòng');
          }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi vào phòng');
    }
  };

  const submitAction = (actionType: ActionType) => {
    if (socket && room && player) {
      socket.emit('submit_action', {
        roomId: room.id,
        actionType,
      }, (res: SocketResponse) => {
        if (!res.success) {
          setError(res.error || 'Lỗi khi gửi hành động');
        }
      });
    }
  };

  const adminStartGame = () => {
    const adminToken = localStorage.getItem('adminToken');
    if (socket && room && adminToken) {
      socket.emit('admin_start_game', {
        roomId: room.id,
      }, (res: SocketResponse) => {
        if (!res.success) {
          setError(res.error || 'Lỗi khi bắt đầu game');
        }
      });
    }
  };

  const adminNextRound = () => {
    const adminToken = localStorage.getItem('adminToken');
    if (socket && room && adminToken) {
      socket.emit('admin_next_round', {
        roomId: room.id,
      }, (res: SocketResponse) => {
        if (!res.success) {
          setError(res.error || 'Lỗi khi chuyển vòng');
        }
      });
    }
  };

  const leaveRoom = () => {
    localStorage.removeItem('playerId');
    localStorage.removeItem('roomId');
    localStorage.removeItem('adminToken');
    setPlayer(null);
    setRoom(null);
    setResults(null);
    setLeaderboard(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        player,
        room,
        results,
        leaderboard,
        error,
        createRoom,
        joinRoom,
        submitAction,
        adminStartGame,
        adminNextRound,
        leaveRoom,
        clearError,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useGame must be used within a SocketProvider');
  }
  return context;
};