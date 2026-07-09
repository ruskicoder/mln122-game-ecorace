"import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Player, Room, RoundAction, RoomStatus, EconomicRole, ActionType } from '@prisma/client';
import { RoundCalculationResult, EconomicRole as SharedEconomicRole, ActionType as SharedActionType } from '@ecorace/shared';

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoomPlayers(roomId: string): Promise<Player[]> {
    return this.prisma.player.findMany({
      where: { roomId },
      orderBy: { totalScore: 'desc' },
    });
  }

  async getRoomPlayersBySocket(socketId: string): Promise<Player | null> {
    return this.prisma.player.findUnique({
      where: { socketId },
    });
  }

  async getRoom(roomId: string): Promise<Room | null> {
    return this.prisma.room.findUnique({
      where: { id: roomId },
    });
  }

  async joinRoom(roomId: string, username: string, socketId: string): Promise<Player> {
    const formattedRoomId = roomId.toUpperCase();
    const room = await this.prisma.room.findUnique({
      where: { id: formattedRoomId },
      include: { players: true },
    });

    if (!room) {
      throw new NotFoundException('Phòng chơi không tồn tại');
    }

    if (room.status !== RoomStatus.LOBBY) {
      throw new BadRequestException('Trò chơi đã bắt đầu hoặc đã kết thúc');
    }

    if (room.players.length >= 50) {
      throw new BadRequestException('Phòng chơi đã đầy (tối đa 50 người)');
    }

    // Check if username is already taken in the room
    const existingPlayer = room.players.find(p => p.username === username);
    if (existingPlayer) {
      // If it's the same username and it's offline, reconnect it
      if (!existingPlayer.isOnline) {
        return this.prisma.player.update({
          where: { id: existingPlayer.id },
          data: { socketId, isOnline: true },
        });
      }
      throw new BadRequestException('Tên người dùng đã được sử dụng trong phòng này');
    }

    // Create new player
    return this.prisma.player.create({
      data: {
        username,
        so
<truncated 13979 bytes>