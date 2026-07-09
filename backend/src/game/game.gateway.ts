"import {
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
        roomId: formattedRoomId,\
<truncated 4871 bytes>