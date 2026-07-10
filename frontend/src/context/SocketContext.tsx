import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  adminUpdateSettings: (maxRounds: number, roundDuration: number, spectatorMode?: boolean) => void;
  adminAdjustPoints: (playerId: string, capitalDelta: number, scoreDelta: number) => void;
  adminForceEndGame: () => void;
  adminSetSpectatorMode: (spectatorMode: boolean) => void;
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

  // socketRef gives synchronous access to the socket instance from callbacks and
  // action handlers without requiring the socket to be in the useEffect deps array.
  const socketRef = useRef<Socket | null>(null);

  // playerIdRef gives event handlers access to the current player id without
  // stale closures — no need to re-register handlers when player changes.
  const playerIdRef = useRef<string | null>(null);
  useEffect(() => {
    playerIdRef.current = player?.id ?? null;
  }, [player?.id]);

  // roomRef allows submitAction / adminNextRound to always read current room.
  const roomRef = useRef<Room | null>(null);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  // -----------------------------------------------------------------------
  // Socket lifecycle — created ONCE on mount. Never recreated.
  // -----------------------------------------------------------------------
  useEffect(() => {
    const newSocket = io({
      // No explicit URL: socket.io-client connects to window.location.origin
      // (port 5173 in dev), and Vite proxies /socket.io/* → localhost:3000
      autoConnect: true,
      transports: ['polling', 'websocket'],
      path: '/socket.io',
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('[socket] connected:', newSocket.id);

      // On page refresh: re-join the room the player was already in
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
            setRoom((prev) => prev ?? {
              id: res.data!.roomId,
              status: res.data!.role ? RoomStatus.PLAYING : RoomStatus.LOBBY,
              currentRound: 1,
              maxRounds: 5,
              roundDuration: 40,
              spectatorMode: false,
              macroBudget: 0.0,
              createdAt: '',
            });
          } else {
            localStorage.removeItem('playerId');
            localStorage.removeItem('roomId');
            localStorage.removeItem('adminToken');
          }
        });
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[socket] disconnected');
    });

    newSocket.on('room_updated', (data: { roomId: string; players: Player[]; room?: Partial<Room> }) => {
      setRoom((prev) => {
        const base = prev ?? {
          id: data.roomId,
          status: RoomStatus.LOBBY,
          currentRound: 1,
          maxRounds: 5,
          roundDuration: 40,
          spectatorMode: false,
          macroBudget: 0.0,
          createdAt: '',
        };
        // Merge full room snapshot when server sends it (settings updates, join, disconnect)
        return { ...base, ...data.room, players: data.players };
      });

      // Keep own player object in sync (use ref, no stale closure)
      const self = data.players.find(
        (p) => p.socketId === newSocket.id || p.id === playerIdRef.current,
      );
      if (self) setPlayer(self);
    });

    newSocket.on('game_started', (data: { roomId: string; players: Player[]; duration: number }) => {
      setRoom((prev) => {
        const base = prev ?? {
          id: data.roomId,
          status: RoomStatus.PLAYING,
          currentRound: 1,
          maxRounds: 5,
          roundDuration: data.duration,
          spectatorMode: false,
          macroBudget: 0.0,
          createdAt: '',
        };
        return { ...base, status: RoomStatus.PLAYING, roundDuration: data.duration, players: data.players };
      });
      const self = data.players.find(
        (p) => p.socketId === newSocket.id || p.id === playerIdRef.current,
      );
      if (self) setPlayer(self);
      setResults(null);
      setLeaderboard(null);
    });

    newSocket.on('round_started', (data: { round: number; duration: number; macroBudget: number }) => {
      setRoom((prev) => prev ? { ...prev, currentRound: data.round, roundDuration: data.duration, macroBudget: data.macroBudget } : null);
      setResults(null);
    });

    newSocket.on('action_submitted', () => {
      // Triggers re-render so UI can reflect submitted status of other players
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
      const self = data.players.find((p) => p.id === playerIdRef.current);
      if (self) setPlayer(self);
    });

    newSocket.on('game_ended', (data: { leaderboard: Player[] }) => {
      setLeaderboard(data.leaderboard);
      setRoom((prev) => prev ? { ...prev, status: RoomStatus.FINISHED } : null);
    });

    return () => {
      newSocket.close();
    };
  }, []); // Empty: socket created once, never torn down by state changes

  // -----------------------------------------------------------------------
  // Actions — all use socketRef.current so they never need socket in scope
  // -----------------------------------------------------------------------

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
      if (!res.ok) throw new Error(data.message || 'Lỗi khi tạo phòng');

      localStorage.setItem('playerId', data.adminPlayer.id);
      localStorage.setItem('roomId', data.room.id);
      localStorage.setItem('adminToken', data.token);

      setPlayer(data.adminPlayer);
      setRoom(data.room);

      const s = socketRef.current;
      if (!s) { setError('Socket chưa kết nối, vui lòng thử lại'); return; }

      s.emit('join_room', {
        roomId: data.room.id,
        username: adminUsername,
        playerId: data.adminPlayer.id,
      }, (socketRes: SocketResponse) => {
        if (!socketRes.success) setError(socketRes.error || 'Lỗi khi kết nối socket');
      });
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
      if (!validateRes.ok) throw new Error(validateData.message || 'Mã phòng không hợp lệ');

      const s = socketRef.current;
      if (!s) { setError('Socket chưa kết nối, vui lòng thử lại'); return; }

      s.emit('join_room', { roomId: formattedRoomId, username }, (res: SocketResponse<Player>) => {
        if (res.success && res.data) {
          localStorage.setItem('playerId', res.data.id);
          localStorage.setItem('roomId', formattedRoomId);
          setPlayer(res.data);
          setRoom({
            id: formattedRoomId,
            status: RoomStatus.LOBBY,
            currentRound: 1,
            maxRounds: 5,
            roundDuration: 40,
            spectatorMode: false,
            macroBudget: 0.0,
            createdAt: '',
          });
        } else {
          setError(res.error || 'Lỗi khi vào phòng');
        }
      });
    } catch (err: any) {
      setError(err.message || 'Lỗi khi vào phòng');
    }
  };

  const submitAction = (actionType: ActionType) => {
    const s = socketRef.current;
    const r = roomRef.current;
    if (s && r && playerIdRef.current) {
      s.emit('submit_action', { roomId: r.id, actionType }, (res: SocketResponse) => {
        if (!res.success) setError(res.error || 'Lỗi khi gửi hành động');
      });
    }
  };

  const adminStartGame = () => {
    const adminToken = localStorage.getItem('adminToken');
    const s = socketRef.current;
    const r = roomRef.current;
    if (s && r && adminToken) {
      s.emit('admin_start_game', { roomId: r.id }, (res: SocketResponse) => {
        if (!res.success) setError(res.error || 'Lỗi khi bắt đầu game');
      });
    }
  };

  const adminNextRound = () => {
    const adminToken = localStorage.getItem('adminToken');
    const s = socketRef.current;
    const r = roomRef.current;
    if (s && r && adminToken) {
      s.emit('admin_next_round', { roomId: r.id }, (res: SocketResponse) => {
        if (!res.success) setError(res.error || 'Lỗi khi chuyển vòng');
      });
    }
  };

  const adminUpdateSettings = (maxRounds: number, roundDuration: number, spectatorMode?: boolean) => {
    const adminToken = localStorage.getItem('adminToken');
    const s = socketRef.current;
    const r = roomRef.current;
    if (s && r && adminToken) {
      s.emit('admin_update_settings', { roomId: r.id, maxRounds, roundDuration, spectatorMode }, (res: SocketResponse) => {
        if (!res.success) setError(res.error || 'Lỗi khi cập nhật cài đặt');
      });
    }
  };

  const adminSetSpectatorMode = (spectatorMode: boolean) => {
    const adminToken = localStorage.getItem('adminToken');
    const s = socketRef.current;
    const r = roomRef.current;
    if (s && r && adminToken) {
      s.emit('admin_update_settings', {
        roomId: r.id,
        maxRounds: r.maxRounds,
        roundDuration: r.roundDuration,
        spectatorMode,
      }, (res: SocketResponse) => {
        if (!res.success) setError(res.error || 'Lỗi khi cập nhật chế độ quan sát');
      });
    }
  };

  const adminAdjustPoints = (playerId: string, capitalDelta: number, scoreDelta: number) => {
    const adminToken = localStorage.getItem('adminToken');
    const s = socketRef.current;
    const r = roomRef.current;
    if (s && r && adminToken) {
      s.emit('admin_adjust_points', { roomId: r.id, playerId, capitalDelta, scoreDelta }, (res: SocketResponse) => {
        if (!res.success) setError(res.error || 'Lỗi khi cộng/trừ điểm');
      });
    }
  };

  const adminForceEndGame = () => {
    const adminToken = localStorage.getItem('adminToken');
    const s = socketRef.current;
    const r = roomRef.current;
    if (s && r && adminToken) {
      s.emit('admin_force_end', { roomId: r.id }, (res: SocketResponse) => {
        if (!res.success) setError(res.error || 'Lỗi khi kết thúc game sớm');
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
        adminUpdateSettings,
        adminAdjustPoints,
        adminForceEndGame,
        adminSetSpectatorMode,
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
  if (!context) throw new Error('useGame must be used within a SocketProvider');
  return context;
};