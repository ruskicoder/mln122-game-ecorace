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

      return { success: true, data: player };
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
      const room = await this.gameService.getRoom(formattedRoomId);
      const duration = room ? room.roundDuration : 40;

      const players = await this.gameService.startGame(formattedRoomId);

      this.server.to(formattedRoomId).emit('game_started', {
        roomId: formattedRoomId,
        players,
        duration,
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

  private async prismaFindPlayerBySocket(socketId: string) {
    return this.gameService.getRoomPlayersBySocket(socketId);
  }
}