import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { ActionType } from '@prisma/client';
import { SocketResponse } from '@ecorace/shared';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  async handleConnection(client: Socket) {
    console.log(`[gateway] Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`[gateway] Client disconnected: ${client.id}`);
    const player = await this.gameService.disconnectPlayer(client.id);
    if (player) {
      const room = await this.gameService.getRoom(player.roomId);
      this.server.to(player.roomId).emit('room_updated', {
        roomId: player.roomId,
        players: await this.gameService.getRoomPlayers(player.roomId),
        room,
      });
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; username: string; playerId?: string },
  ): Promise<SocketResponse> {
    const { roomId, username, playerId } = data;
    try {
      let player;
      const formattedRoomId = roomId.toUpperCase();
      if (playerId && playerId.trim() !== '') {
        // Reconnection flow
        player = await this.gameService.reconnectPlayer(playerId, formattedRoomId, client.id);
      } else {
        // First connection flow
        player = await this.gameService.joinRoom(formattedRoomId, username, client.id);
      }

      await client.join(formattedRoomId);
      
      const players = await this.gameService.getRoomPlayers(formattedRoomId);
      const room = await this.gameService.getRoom(formattedRoomId);

      // Notify all players in room
      this.server.to(formattedRoomId).emit('room_updated', {
        roomId: formattedRoomId,
        players,
        room,
      });

      // Option 2: Redundant push directly to joining client to prevent race conditions
      client.emit('room_updated', {
        roomId: formattedRoomId,
        players,
        room,
      });

      return { success: true, data: { player, room: room ? { ...room, players } : null } };
    } catch (err: any) {
      return { success: false, error: err.message || 'Không thể tham gia phòng' };
    }
  }

  @SubscribeMessage('admin_start_game')
  async handleStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): Promise<SocketResponse> {
    const { roomId } = data;
    const formattedRoomId = roomId.toUpperCase();

    // Primary lookup: by current socket id (works after join_room is processed)
    let player = await this.prismaFindPlayerBySocket(client.id);
    // Fallback: find admin player by roomId (handles socketId-update race condition)
    if (!player || !player.isAdmin) {
      player = await this.gameService.getRoomAdminPlayer(formattedRoomId);
    }
    console.log(`[gateway] admin_start_game | socket=${client.id} | player=${JSON.stringify(player?.id)} | isAdmin=${player?.isAdmin}`);

    if (!player || !player.isAdmin) {
      return { success: false, error: 'Chỉ Admin mới có quyền bắt đầu game' };
    }

    try {
      const players = await this.gameService.startGame(formattedRoomId);
      const room = await this.gameService.getRoom(formattedRoomId);
      const duration = room ? room.roundDuration : 40;

      this.server.to(formattedRoomId).emit('game_started', {
        roomId: formattedRoomId,
        players,
        room: room ? { ...room, players } : null,
      });

      this.server.to(formattedRoomId).emit('round_started', {
        round: 1,
        duration,
        macroBudget: 0.0,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi khi bắt đầu game' };
    }
  }

  @SubscribeMessage('submit_action')
  async handleSubmitAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; actionType: ActionType },
  ): Promise<SocketResponse> {
    const { roomId, actionType } = data;
    const formattedRoomId = roomId.toUpperCase();

    try {
      const player = await this.prismaFindPlayerBySocket(client.id);
      if (!player) {
        return { success: false, error: 'Không tìm thấy người chơi' };
      }

      const room = await this.gameService.getRoom(formattedRoomId);
      if (!room || room.status !== 'PLAYING') {
        return { success: false, error: 'Game chưa bắt đầu hoặc đã kết thúc' };
      }

      const action = await this.gameService.submitAction(
        player.id,
        formattedRoomId,
        room.currentRound,
        actionType,
      );

      // Broadcast that this player submitted their action
      this.server.to(formattedRoomId).emit('action_submitted', {
        playerId: player.id,
      });

      // Check if all players submitted
      const allSubmitted = await this.gameService.checkAllActionsSubmitted(formattedRoomId, room.currentRound);
      if (allSubmitted) {
        // Resolve the round immediately
        await this.resolveAndAdvanceRound(formattedRoomId, room.currentRound);
      }

      return { success: true, data: action };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi khi gửi hành động' };
    }
  }

  @SubscribeMessage('admin_next_round')
  async handleNextRound(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): Promise<SocketResponse> {
    const { roomId } = data;
    const formattedRoomId = roomId.toUpperCase();

    let player = await this.prismaFindPlayerBySocket(client.id);
    if (!player || !player.isAdmin) {
      player = await this.gameService.getRoomAdminPlayer(formattedRoomId);
    }
    console.log(`[gateway] admin_next_round | socket=${client.id} | player=${JSON.stringify(player?.id)} | isAdmin=${player?.isAdmin}`);

    if (!player || !player.isAdmin) {
      return { success: false, error: 'Chỉ Admin mới có quyền chuyển vòng' };
    }

    try {
      const room = await this.gameService.getRoom(formattedRoomId);
      if (!room || room.status !== 'PLAYING') {
        return { success: false, error: 'Game chưa bắt đầu hoặc đã kết thúc' };
      }

      await this.resolveAndAdvanceRound(formattedRoomId, room.currentRound);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi khi chuyển vòng' };
    }
  }

  @SubscribeMessage('admin_update_settings')
  async handleUpdateSettings(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; maxRounds: number; roundDuration: number; spectatorMode?: boolean },
  ): Promise<SocketResponse> {
    const { roomId, maxRounds, roundDuration, spectatorMode } = data;
    const formattedRoomId = roomId.toUpperCase();

    let player = await this.prismaFindPlayerBySocket(client.id);
    if (!player || !player.isAdmin) {
      player = await this.gameService.getRoomAdminPlayer(formattedRoomId);
    }

    if (!player || !player.isAdmin) {
      return { success: false, error: 'Chỉ Admin mới có quyền cập nhật cài đặt' };
    }

    try {
      const room = await this.gameService.updateRoomSettings(formattedRoomId, maxRounds, roundDuration, spectatorMode);
      const players = await this.gameService.getRoomPlayers(formattedRoomId);

      this.server.to(formattedRoomId).emit('room_updated', {
        roomId: formattedRoomId,
        players,
        room,
      });

      return { success: true, data: room };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi khi cập nhật cài đặt' };
    }
  }

  @SubscribeMessage('admin_adjust_points')
  async handleAdjustPoints(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; playerId: string; capitalDelta: number; scoreDelta: number },
  ): Promise<SocketResponse> {
    const { roomId, playerId, capitalDelta, scoreDelta } = data;
    const formattedRoomId = roomId.toUpperCase();

    let player = await this.prismaFindPlayerBySocket(client.id);
    if (!player || !player.isAdmin) {
      player = await this.gameService.getRoomAdminPlayer(formattedRoomId);
    }

    if (!player || !player.isAdmin) {
      return { success: false, error: 'Chỉ Admin mới có quyền cộng/trừ điểm' };
    }

    try {
      await this.gameService.adjustPlayerPoints(playerId, capitalDelta, scoreDelta);
      const players = await this.gameService.getRoomPlayers(formattedRoomId);
      const room = await this.gameService.getRoom(formattedRoomId);

      this.server.to(formattedRoomId).emit('room_updated', {
        roomId: formattedRoomId,
        players,
        room,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi khi cộng/trừ điểm' };
    }
  }

  @SubscribeMessage('admin_force_end')
  async handleForceEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): Promise<SocketResponse> {
    const { roomId } = data;
    const formattedRoomId = roomId.toUpperCase();

    let player = await this.prismaFindPlayerBySocket(client.id);
    if (!player || !player.isAdmin) {
      player = await this.gameService.getRoomAdminPlayer(formattedRoomId);
    }

    if (!player || !player.isAdmin) {
      return { success: false, error: 'Chỉ Admin mới có quyền kết thúc game sớm' };
    }

    try {
      await this.gameService.forceEndGame(formattedRoomId);
      
      const leaderboard = await this.gameService.getRoomLeaderboard(formattedRoomId);
      this.server.to(formattedRoomId).emit('game_ended', {
        leaderboard,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi khi kết thúc game' };
    }
  }


  private async resolveAndAdvanceRound(roomId: string, round: number) {
    const result = await this.gameService.resolveRound(roomId, round);
    
    // Broadcast results
    this.server.to(roomId).emit('round_ended', {
      round: result.round,
      results: result.results,
      players: result.players,
      macroBudget: result.macroBudget,
      macroEventTriggered: result.macroEventTriggered,
      epicDraws: result.epicDraws,
    });

    const room = await this.gameService.getRoom(roomId);
    if (room && room.status === 'PLAYING') {
      // Broadcast new round start
      this.server.to(roomId).emit('round_started', {
        round: room.currentRound,
        duration: room.roundDuration,
        macroBudget: room.macroBudget,
      });
    } else if (room && room.status === 'FINISHED') {
      const leaderboard = await this.gameService.getRoomLeaderboard(roomId);
      this.server.to(roomId).emit('game_ended', {
        leaderboard,
      });
    }
  }

  @SubscribeMessage('use_powerup')
  async handleUsePowerup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; powerupCode: string; targetId?: string },
  ): Promise<SocketResponse> {
    const { roomId, powerupCode, targetId } = data;
    const formattedRoomId = roomId.toUpperCase();
    
    const players = await this.gameService.getRoomPlayers(formattedRoomId);
    const self = players.find(p => p.socketId === client.id);
    if (!self) {
      return { success: false, error: 'Không tìm thấy thông tin người chơi' };
    }

    try {
      const { notification, updatedPlayers } = await this.gameService.usePowerup(self.id, powerupCode, targetId);
      const room = await this.gameService.getRoom(formattedRoomId);

      // Notify all players in room of the powerup activation
      this.server.to(formattedRoomId).emit('powerup_activated', notification);

      // Sync room/player state for everyone
      this.server.to(formattedRoomId).emit('room_updated', {
        roomId: formattedRoomId,
        players: updatedPlayers,
        room,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi khi sử dụng thẻ bài' };
    }
  }

  @SubscribeMessage('resolve_pending_powerup')
  async handleResolvePendingPowerup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; choice: 'discard' | 'swap'; swapIndex?: number },
  ): Promise<SocketResponse> {
    const { roomId, choice, swapIndex } = data;
    const formattedRoomId = roomId.toUpperCase();
    
    const players = await this.gameService.getRoomPlayers(formattedRoomId);
    const self = players.find(p => p.socketId === client.id);
    if (!self) {
      return { success: false, error: 'Không tìm thấy thông tin người chơi' };
    }

    try {
      const updatedPlayer = await this.gameService.resolvePendingPowerup(self.id, choice, swapIndex);
      const allPlayers = await this.gameService.getRoomPlayers(formattedRoomId);
      const room = await this.gameService.getRoom(formattedRoomId);

      // Sync updated state
      this.server.to(formattedRoomId).emit('room_updated', {
        roomId: formattedRoomId,
        players: allPlayers,
        room,
      });

      return { success: true, data: updatedPlayer };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi khi xử lý thẻ chờ' };
    }
  }

  @SubscribeMessage('admin_award_powerup')
  async handleAdminAwardPowerup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; playerId: string; powerupCode: string },
  ): Promise<SocketResponse> {
    const { roomId, playerId, powerupCode } = data;
    const formattedRoomId = roomId.toUpperCase();

    const sender = await this.prismaFindPlayerBySocket(client.id);
    if (!sender || !sender.isAdmin) {
      return { success: false, error: 'Chỉ giảng viên mới có quyền tặng thẻ bài' };
    }

    try {
      await this.gameService.adminAwardPowerup(playerId, powerupCode);
      const allPlayers = await this.gameService.getRoomPlayers(formattedRoomId);
      const room = await this.gameService.getRoom(formattedRoomId);

      // Sync updated state
      this.server.to(formattedRoomId).emit('room_updated', {
        roomId: formattedRoomId,
        players: allPlayers,
        room,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi khi tặng thẻ bài' };
    }
  }

  @SubscribeMessage('get_room_state')
  async handleGetRoomState(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): Promise<SocketResponse> {
    const { roomId } = data;
    const formattedRoomId = roomId.toUpperCase();
    try {
      const room = await this.gameService.getRoom(formattedRoomId);
      const players = await this.gameService.getRoomPlayers(formattedRoomId);
      return { success: true, data: { room: room ? { ...room, players } : null } };
    } catch (err: any) {
      return { success: false, error: err.message || 'Không thể lấy thông tin phòng' };
    }
  }

  private async prismaFindPlayerBySocket(socketId: string) {
    return this.gameService.getRoomPlayersBySocket(socketId);
  }
}