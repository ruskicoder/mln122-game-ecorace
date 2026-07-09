"import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Room, Player, RoomStatus } from '@prisma/client';

@Injectable()
export class RoomService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async generateUniqueRoomId(): Promise<string> {
    let roomId = '';
    let isUnique = false;
    while (!isUnique) {
      // Generate 6 character uppercase alphanumeric code
      roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existing = await this.prisma.room.findUnique({ where: { id: roomId } });
      if (!existing) isUnique = true;
    }
    return roomId;
  }

  async createRoom(adminUsername: string): Promise<{ room: Room; token: string; adminPlayer: Player }> {
    const roomId = await this.generateUniqueRoomId();
    
    const room = await this.prisma.room.create({
      data: {
        id: roomId,
        status: RoomStatus.LOBBY,
        currentRound: 1,
        maxRounds: 5,
        macroBudget: 0.0,
      },
    });

    // Create the admin player
    const adminPlayer = await this.prisma.player.create({
      data: {
        username: adminUsername,
        socketId: `temp-admin-${Date.now()}`,
        isAdmin: true,
        role: null,
        capital: 100.0,
        roomId: room.id,
      },
    });

    // Generate JWT token containing playerId, roomId, and isAdmin flag
    const token = this.jwtService.sign({
      playerId: adminPlayer.id,
      roomId: room.id,
      isAdmin: true,
    });

    return { room, token, adminPlayer };
  }

  async validateRoom(roomId: string): Promise<{ exists: boolean; status?: RoomStatus }> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId.toUpperCase() },
    });
    if (!room) {
      return { exists: false };
    }
    return { exists: true, status: room.st
<truncated 18 bytes>