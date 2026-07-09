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
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const player = await this.gameService.disconnectPlayer(client.id);
    if (player) {
      this.server.to(player.roomId).emit('room_updated', {
        roomId: player.roomId,
        players: await this.gameService.getRoomPlayers(player.roomId),
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
      
      // Notify all players in room
      this.server.to(formattedRoomId).emit('room_updated', {
        roomId: formattedRoomId,
        players,
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
    
    const player = await this.prismaFindPlayerBySocket(client.id);
    if (!player || !player.isAdmin) {
      return { success: false, error: 'Chỉ Admin mới có quyền bắt đầu game' };
    }

    try {
      const players = await this.gameService.startGame(formattedRoomId);
      
      this.server.to(formattedRoomId).emit('game_started', {
        roomId: formattedRoomId,
        players,
        duration: 40,
      });

      this.server.to(formattedRoomId).emit('round_started', {
        round: 1,
        duration: 40,
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

    const player = await this.prismaFindPlayerBySocket(client.id);
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
        duration: 40,
        macroBudget: room.macroBudget,
      });
    } else if (room && room.status === 'FINISHED') {
      // Sort players by totalScore desc
      const sortedPlayers = await this.gameService.getRoomPlayers(roomId);
      this.server.to(roomId).emit('game_ended', {
        leaderboard: sortedPlayers,
      });
    }
  }

  private async prismaFindPlayerBySocket(socketId: string) {
    return this.gameService.getRoomPlayersBySocket(socketId);
  }
}