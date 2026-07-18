import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Player, Room, RoundCalculationResult, SocketResponse, MarketHistory } from '@ecorace/shared';
import { ActionType, RoomStatus } from '@ecorace/shared';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  player: Player | null;
  room: Room | null;
  results: Record<string, RoundCalculationResult> | null;
  marketHistories: MarketHistory[] | null;
  leaderboard: Player[] | null;
  error: string | null;
  createRoom: (adminUsername: string) => Promise<void>;
  joinRoom: (roomId: string, username: string) => Promise<void>;
  submitAction: (actionType: ActionType) => void;
  adminStartGame: () => void;
  adminNextRound: () => void;
  adminUpdateSettings: (maxRounds: number, roundDuration: number, summaryDuration?: number, spectatorMode?: boolean) => void;
  adminAdjustPoints: (playerId: string, capitalDelta: number, scoreDelta: number) => void;
  adminForceEndGame: () => void;
  adminSetSpectatorMode: (spectatorMode: boolean) => void;
  usePowerup: (powerupCode: string, targetId?: string) => void;
  resolvePendingPowerup: (choice: 'discard' | 'swap', swapIndex?: number) => void;
  adminAwardPowerup: (playerId: string, powerupCode: string) => void;
  lastNotification: any | null;
  clearNotification: () => void;
  leaveRoom: () => void;
  clearError: () => void;
  macroEventTriggered: string | null;
  lastActionTaken: ActionType | null;
  votingState: { round: number; duration: number } | null;
  votes: any[] | null;
  activePartnershipProposal: any | null;
  submitPolicyVote: (choice: string) => void;
  proposePartnership: (targetPlayerId: string, ratioA: number, ratioB: number) => void;
  respondPartnership: (partnershipId: string, status: 'ACCEPTED' | 'REJECTED') => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [results, setResults] = useState<Record<string, RoundCalculationResult> | null>(null);
  const [marketHistories, setMarketHistories] = useState<MarketHistory[] | null>(null);
  const [leaderboard, setLeaderboard] = useState<Player[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<any | null>(null);
  const [macroEventTriggered, setMacroEventTriggered] = useState<string | null>(null);
  const [lastActionTaken, setLastActionTaken] = useState<ActionType | null>(null);
  const [votingState, setVotingState] = useState<{ round: number; duration: number } | null>(null);
  const [votes, setVotes] = useState<any[] | null>(null);
  const [activePartnershipProposal, setActivePartnershipProposal] = useState<any | null>(null);

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

  // Sync lastActionTaken with player.hasSubmitted to prevent lockups on sync/refresh
  useEffect(() => {
    if (player) {
      if (!player.hasSubmitted) {
        setLastActionTaken(null);
      } else if (lastActionTaken === null) {
        setLastActionTaken(ActionType.PRODUCE);
      }
    }
  }, [player?.hasSubmitted]);

  const checkAndHandleSocketIdError = (errMessage?: string) => {
    if (errMessage && (
      errMessage.includes('Unique constraint failed') ||
      errMessage.includes('socketId') ||
      errMessage.includes('prisma.player.update')
    )) {
      const lastReload = sessionStorage.getItem('lastSocketErrorReload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload) > 10000) {
        sessionStorage.setItem('lastSocketErrorReload', now.toString());
        console.warn('[SocketContext] Unique constraint error detected for socketId. Reloading page to reset socket connection.');
        window.location.reload();
      }
    }
  };

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
        }, (res: SocketResponse<{ player: Player; room: Room }>) => {
          if (res.success && res.data) {
            const rData = res.data.room;
            setPlayer(res.data.player);
            setRoom((prev) => ({
              ...prev,
              ...rData,
              players: rData.players || prev?.players || [],
            }));
          } else {
            checkAndHandleSocketIdError(res.error);
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
          maxRounds: data.room?.maxRounds ?? 5,
          roundDuration: data.room?.roundDuration ?? 40,
          spectatorMode: data.room?.spectatorMode ?? false,
          warActive: data.room?.warActive ?? false,
          macroBudget: data.room?.macroBudget ?? 0.0,
          marketPrice: data.room?.marketPrice ?? 100.0,
          currentTaxPolicy: data.room?.currentTaxPolicy ?? 'STIMULUS',
          activeEvent: data.room?.activeEvent ?? null,
          createdAt: data.room?.createdAt ?? '',
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

    newSocket.on('game_started', (data: { roomId: string; players: Player[]; room: Room }) => {
      setRoom((prev) => ({
        ...prev,
        ...data.room,
        players: data.players || data.room?.players || prev?.players || [],
      }));
      const self = data.players.find(
        (p) => p.socketId === newSocket.id || p.id === playerIdRef.current,
      );
      if (self) setPlayer(self);
      setResults(null);
      setMarketHistories(null);
      setMacroEventTriggered(null);
      setLeaderboard(null);
    });

    newSocket.on('round_started', (data: { round: number; duration: number; macroBudget: number }) => {
      setRoom((prev) => prev ? { ...prev, currentRound: data.round, roundDuration: data.duration, macroBudget: data.macroBudget } : null);
      setResults(null);
      setLastActionTaken(null);
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
      epicDraws?: any[];
      marketHistories?: MarketHistory[];
    }) => {
      setResults(data.results);
      if (data.marketHistories) setMarketHistories(data.marketHistories);
      setRoom((prev) => prev ? {
        ...prev,
        players: data.players,
        macroBudget: data.macroBudget,
      } : null);
      const self = data.players.find((p) => p.id === playerIdRef.current);
      if (self) setPlayer(self);

      // If any epic draws (WAR, TERRORIST) occurred, highlight the first one
      if (data.epicDraws && data.epicDraws.length > 0) {
        setLastNotification(data.epicDraws[0]);
      }
    });

    newSocket.on('macro_event_triggered', (data: { macroEventTriggered: string; activeEvent?: string | null }) => {
      setResults(null);
      setMacroEventTriggered(data.macroEventTriggered);
      if (data.activeEvent) {
        setRoom((prev) => prev ? { ...prev, activeEvent: data.activeEvent ?? null } : null);
      }
      setTimeout(() => setMacroEventTriggered(null), 10000);
    });

    newSocket.on('market_price_updated', (data: { marketHistories: MarketHistory[] }) => {
      setMarketHistories(data.marketHistories);
    });

    newSocket.on('powerup_activated', (notification: any) => {
      setLastNotification(notification);
    });

    newSocket.on('game_ended', (data: { leaderboard: Player[] }) => {
      setLeaderboard(data.leaderboard);
      setRoom((prev) => prev ? { ...prev, status: RoomStatus.FINISHED } : null);
    });

    newSocket.on('voting_started', (data: { round: number; duration: number }) => {
      setVotingState(data);
      setVotes([]);
      setResults(null);
    });

    newSocket.on('voting_ended', (data: { winner: string; progressiveCount: number; stimulusCount: number; room: Room }) => {
      setVotingState(null);
      setRoom((prev) => prev ? { ...prev, ...data.room } : null);
      setLastNotification({
        type: 'voting_result',
        winner: data.winner,
        progressiveCount: data.progressiveCount,
        stimulusCount: data.stimulusCount,
      });
    });

    newSocket.on('votes_updated', (data: { round: number; votes: any[] }) => {
      setVotes(data.votes);
    });

    newSocket.on('partnership_proposed', (data: { partnership: any }) => {
      setActivePartnershipProposal(data.partnership);
    });

    newSocket.on('partnership_responded', (data: { partnership: any; status: 'ACCEPTED' | 'REJECTED' }) => {
      setActivePartnershipProposal((prev: any) => {
        if (prev && prev.id === data.partnership.id) {
          return null;
        }
        return prev;
      });

      setLastNotification({
        type: 'partnership_response',
        partnership: data.partnership,
        status: data.status,
      });
    });

    return () => {
      newSocket.close();
    };
  }, []); // Empty: socket created once, never torn down by state changes

  // -----------------------------------------------------------------------
  // Periodic background state sync (Option 3) to keep lobby and players list async-proof
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!socket || !room?.id) return;

    const intervalId = setInterval(() => {
      if (socket.connected) {
        socket.emit('get_room_state', { roomId: room.id }, (res: SocketResponse<{ room: Room }>) => {
          if (res.success && res.data?.room) {
            const rData = res.data.room;
            setRoom((prev) => ({
              ...prev,
              ...rData,
              players: rData.players || prev?.players || [],
            }));
          }
        });
      }
    }, 15000);

    return () => {
      clearInterval(intervalId);
    };
  }, [socket, room?.id]);

  // -----------------------------------------------------------------------
  // Keep-alive ping to prevent Render free-tier spin-down during gameplay
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!room?.id || room?.status !== 'PLAYING') return;
    const keepAliveId = setInterval(() => {
      fetch('/api').catch(() => {});
    }, 240000);
    return () => clearInterval(keepAliveId);
  }, [room?.id, room?.status]);

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
      }, (socketRes: SocketResponse<{ player: Player; room: Room }>) => {
        if (!socketRes.success) {
          setError(socketRes.error || 'Lỗi khi kết nối socket');
          checkAndHandleSocketIdError(socketRes.error);
        } else if (socketRes.data) {
          const rData = socketRes.data.room;
          setPlayer(socketRes.data.player);
          setRoom((prev) => ({
            ...prev,
            ...rData,
            players: rData.players || prev?.players || [],
          }));
        }
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

      s.emit('join_room', { roomId: formattedRoomId, username }, (res: SocketResponse<{ player: Player; room: Room }>) => {
        if (res.success && res.data) {
          localStorage.setItem('playerId', res.data.player.id);
          localStorage.setItem('roomId', formattedRoomId);
          const rData = res.data.room;
          setPlayer(res.data.player);
          setRoom((prev) => ({
            ...prev,
            ...rData,
            players: rData.players || prev?.players || [],
          }));
        } else {
          setError(res.error || 'Lỗi khi vào phòng');
          checkAndHandleSocketIdError(res.error);
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
        else setLastActionTaken(actionType);
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

  const adminUpdateSettings = (maxRounds: number, roundDuration: number, summaryDuration?: number, spectatorMode?: boolean) => {
    const adminToken = localStorage.getItem('adminToken');
    const s = socketRef.current;
    const r = roomRef.current;
    if (s && r && adminToken) {
      s.emit('admin_update_settings', { roomId: r.id, maxRounds, roundDuration, summaryDuration, spectatorMode }, (res: SocketResponse) => {
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

  const usePowerup = (powerupCode: string, targetId?: string) => {
    const s = socketRef.current;
    const r = roomRef.current;
    if (s && r) {
      s.emit('use_powerup', { roomId: r.id, powerupCode, targetId }, (res: SocketResponse) => {
        if (!res.success) setError(res.error || 'Lỗi khi sử dụng thẻ bài');
      });
    }
  };

  const resolvePendingPowerup = (choice: 'discard' | 'swap', swapIndex?: number) => {
    const s = socketRef.current;
    const r = roomRef.current;
    if (s && r) {
      s.emit('resolve_pending_powerup', { roomId: r.id, choice, swapIndex }, (res: SocketResponse) => {
        if (!res.success) setError(res.error || 'Lỗi khi xử lý thẻ bài chờ');
      });
    }
  };

  const adminAwardPowerup = (playerId: string, powerupCode: string) => {
    const adminToken = localStorage.getItem('adminToken');
    const s = socketRef.current;
    const r = roomRef.current;
    if (s && r && adminToken) {
      s.emit('admin_award_powerup', { roomId: r.id, playerId, powerupCode }, (res: SocketResponse) => {
        if (!res.success) setError(res.error || 'Lỗi khi tặng thẻ bài');
      });
    }
  };

  const clearNotification = () => {
    setLastNotification(null);
  };

  const submitPolicyVote = (choice: string) => {
    const s = socketRef.current;
    const r = roomRef.current;
    if (s && r) {
      s.emit('submit_policy_vote', { roomId: r.id, choice }, (res: SocketResponse) => {
        if (!res.success) setError(res.error || 'Lỗi khi bỏ phiếu chính sách');
      });
    }
  };

  const proposePartnership = (targetPlayerId: string, ratioA: number, ratioB: number) => {
    const s = socketRef.current;
    const r = roomRef.current;
    if (s && r) {
      s.emit('propose_partnership', { roomId: r.id, targetPlayerId, ratioA, ratioB }, (res: SocketResponse) => {
        if (!res.success) setError(res.error || 'Lỗi khi gửi đề xuất liên doanh');
      });
    }
  };

  const respondPartnership = (partnershipId: string, status: 'ACCEPTED' | 'REJECTED') => {
    const s = socketRef.current;
    const r = roomRef.current;
    if (s && r) {
      s.emit('respond_partnership', { roomId: r.id, partnershipId, status }, (res: SocketResponse) => {
        if (!res.success) {
          setError(res.error || 'Lỗi khi phản hồi liên doanh');
        } else {
          setActivePartnershipProposal(null);
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
    setMarketHistories(null);
    setMacroEventTriggered(null);
    setLeaderboard(null);
    setLastNotification(null);
    setVotingState(null);
    setVotes(null);
    setActivePartnershipProposal(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        player,
        room,
        results,
        marketHistories,
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
        usePowerup,
        resolvePendingPowerup,
        adminAwardPowerup,
        lastNotification,
        clearNotification,
        leaveRoom,
        clearError,
        macroEventTriggered,
        lastActionTaken,
        votingState,
        votes,
        activePartnershipProposal,
        submitPolicyVote,
        proposePartnership,
        respondPartnership,
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