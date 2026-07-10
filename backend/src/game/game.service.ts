import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  async getRoomAdminPlayer(roomId: string): Promise<Player | null> {
    return this.prisma.player.findFirst({
      where: { roomId: roomId.toUpperCase(), isAdmin: true },
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
        socketId,
        isAdmin: false,
        role: null,
        capital: 50.0, // Default baseline, will be overwritten upon game start
        roomId: formattedRoomId,
      },
    });
  }

  async reconnectPlayer(playerId: string, roomId: string, socketId: string): Promise<Player> {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player || player.roomId !== roomId.toUpperCase()) {
      throw new NotFoundException('Người chơi không thuộc phòng này');
    }

    return this.prisma.player.update({
      where: { id: playerId },
      data: {
        socketId,
        isOnline: true,
      },
    });
  }

  async disconnectPlayer(socketId: string): Promise<Player | null> {
    const player = await this.prisma.player.findUnique({
      where: { socketId },
    });

    if (!player) return null;

    return this.prisma.player.update({
      where: { id: player.id },
      data: { isOnline: false },
    });
  }

  async startGame(roomId: string): Promise<Player[]> {
    const formattedRoomId = roomId.toUpperCase();
    const room = await this.prisma.room.findUnique({
      where: { id: formattedRoomId },
      include: { players: true },
    });

    if (!room) {
      throw new NotFoundException('Phòng chơi không tồn tại');
    }

    if (room.players.length === 0) {
      throw new BadRequestException('Không có người chơi trong phòng');
    }

    // Roles to assign
    const roles = [
      EconomicRole.FDI,
      EconomicRole.SOE,
      EconomicRole.POE,
      EconomicRole.COOP,
      EconomicRole.HOUSEHOLD,
      EconomicRole.WORKER,
    ];

    // Capital values corresponding to roles
    const initialCapitals: Record<EconomicRole, number> = {
      [EconomicRole.FDI]: 120.0,
      [EconomicRole.SOE]: 100.0,
      [EconomicRole.POE]: 90.0,
      [EconomicRole.COOP]: 80.0,
      [EconomicRole.HOUSEHOLD]: 70.0,
      [EconomicRole.WORKER]: 50.0,
    };

    // Shuffle and assign roles
    const players = room.players;
    const updatePromises = players.map((player, idx) => {
      const assignedRole = roles[idx % roles.length];
      const initialCapital = initialCapitals[assignedRole];

      return this.prisma.player.update({
        where: { id: player.id },
        data: {
          role: assignedRole,
          capital: initialCapital,
          capitalMultiplier: 1.0,
          laborScore: 0.0,
          socialScore: 0.0,
          welfareScore: 0.0,
          sustainabilityScore: 0.0,
          totalScore: 0.0,
        },
      });
    });

    await Promise.all(updatePromises);

    // Update room status
    await this.prisma.room.update({
      where: { id: formattedRoomId },
      data: {
        status: RoomStatus.PLAYING,
        currentRound: 1,
        macroBudget: 0.0,
      },
    });

    return this.prisma.player.findMany({
      where: { roomId: formattedRoomId },
    });
  }

  async submitAction(playerId: string, roomId: string, round: number, actionType: ActionType): Promise<RoundAction> {
    const formattedRoomId = roomId.toUpperCase();
    
    // Check if action already submitted for this round
    const existingAction = await this.prisma.roundAction.findUnique({
      where: {
        playerId_round: {
          playerId,
          round,
        },
      },
    });

    if (existingAction) {
      throw new BadRequestException('Bạn đã chọn hành động cho vòng này rồi');
    }

    return this.prisma.roundAction.create({
      data: {
        round,
        actionType,
        playerId,
        roomId: formattedRoomId,
      },
    });
  }

  async checkAllActionsSubmitted(roomId: string, round: number): Promise<boolean> {
    const formattedRoomId = roomId.toUpperCase();
    const onlinePlayersCount = await this.prisma.player.count({
      where: { roomId: formattedRoomId, isOnline: true },
    });

    const submittedActionsCount = await this.prisma.roundAction.count({
      where: { roomId: formattedRoomId, round },
    });

    return submittedActionsCount >= onlinePlayersCount;
  }

  async resolveRound(roomId: string, round: number): Promise<{
    round: number;
    results: Record<string, RoundCalculationResult>;
    players: Player[];
    macroBudget: number;
    macroEventTriggered?: string;
  }> {
    const formattedRoomId = roomId.toUpperCase();
    const room = await this.prisma.room.findUnique({
      where: { id: formattedRoomId },
      include: {
        players: {
          include: {
            actions: {
              where: { round },
            },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Phòng chơi không tồn tại');
    }

    let macroBudget = room.macroBudget;
    const results: Record<string, RoundCalculationResult> = {};
    let macroEventTriggered: string | undefined = undefined;

    // First pass: Calculate individual actions
    for (const player of room.players) {
      if (!player.role) continue;

      const action = player.actions[0];
      const actionType = action ? action.actionType : ActionType.PRODUCE; // Default to PRODUCE if did not submit

      let capitalChange = 0;
      let laborScoreChange = 0;
      let socialScoreChange = 0;
      let welfareScoreChange = 0;
      let multiplierChange = 0;

      // Core Logic Calculations
      switch (actionType) {
        case ActionType.PRODUCE:
          if (player.role === EconomicRole.WORKER) {
            capitalChange = 15.0; // Salary
            laborScoreChange = 2.0;
          } else {
            capitalChange = 20.0 * player.capitalMultiplier;
          }
          break;

        case ActionType.INVEST:
          if (player.role === EconomicRole.WORKER) {
            capitalChange = -15.0; // Spend on training
            multiplierChange = 0.2;
          } else {
            capitalChange = -30.0; // Invest in equipment
            multiplierChange = 0.3;
          }
          break;

        case ActionType.WELFARE:
          if (player.role === EconomicRole.WORKER) {
            capitalChange = 15.0; // Support bonus received
            welfareScoreChange = 1.0;
          } else if (player.role === EconomicRole.COOP || player.role === EconomicRole.HOUSEHOLD) {
            capitalChange = -10.0;
            socialScoreChange = 2.0;
          } else {
            capitalChange = -20.0; // SOE, POE, FDI
            socialScoreChange = 3.0;
          }
          break;

        case ActionType.OPTIMIZE:
          if (player.role === EconomicRole.WORKER) {
            capitalChange = 5.0; // Overtime wage
            socialScoreChange = -1.0; // Tiredness
          } else if (player.role === EconomicRole.COOP || player.role === EconomicRole.HOUSEHOLD) {
            capitalChange = 20.0;
            socialScoreChange = -1.0;
          } else {
            capitalChange = 35.0; // SOE, POE, FDI cost cutting
            socialScoreChange = -2.0; // Layoffs/Reduced benefits
          }
          break;

        case ActionType.SOCIAL:
          if (player.role === EconomicRole.WORKER) {
            capitalChange = -4.0;
            socialScoreChange = 2.0;
          } else if (player.role === EconomicRole.COOP || player.role === EconomicRole.HOUSEHOLD) {
            capitalChange = -8.0;
            socialScoreChange = 2.0;
          } else {
            capitalChange = -15.0; // FDI, SOE, POE
            socialScoreChange = 3.0;
          }
          break;
      }

      // Calculate taxation on positive earnings
      let taxPaid = 0;
      if (capitalChange > 0) {
        let taxRate = 0.0;
        if (player.role === EconomicRole.WORKER) {
          taxRate = capitalChange > 15 ? 0.02 : 0.0;
        } else if (player.role === EconomicRole.COOP || player.role === EconomicRole.HOUSEHOLD) {
          taxRate = 0.05;
        } else { // FDI, SOE, POE
          taxRate = capitalChange > 20 ? 0.20 : 0.10; // Progressive taxation
        }

        taxPaid = parseFloat((capitalChange * taxRate).toFixed(2));
        capitalChange -= taxPaid;
        macroBudget += taxPaid;
        socialScoreChange += 2.0; // Tax contribution point
      }

      results[player.id] = {
        playerId: player.id,
        username: player.username,
        role: player.role as unknown as SharedEconomicRole,
        actionType: actionType as unknown as SharedActionType,
        capitalBefore: player.capital,
        capitalChange: parseFloat(capitalChange.toFixed(2)),
        capitalAfter: parseFloat((player.capital + capitalChange).toFixed(2)),
        laborScoreChange,
        socialScoreChange,
        welfareScoreChange,
        taxPaid,
        welfareReceived: 0,
        welfareScoreBonus: 0,
      };

      // Apply multiplier changes
      if (multiplierChange > 0) {
        await this.prisma.player.update({
          where: { id: player.id },
          data: {
            capitalMultiplier: { increment: multiplierChange },
          },
        });
      }
    }

    // Second pass: Welfare assistance for players with capital < 50
    for (const player of room.players) {
      if (!player.role) continue;
      const res = results[player.id];

      if (res.capitalAfter < 50.0 && macroBudget >= 20.0) {
        macroBudget -= 20.0;
        res.capitalAfter += 20.0;
        res.capitalChange += 20.0;
        res.welfareReceived = 20.0;
        res.welfareScoreChange += 1.0;
      }
    }

    // Third pass: Public Investment if macroBudget reaches 500+
    if (macroBudget >= 500.0) {
      macroBudget -= 300.0;
      macroEventTriggered = 'Xây dựng cơ sở hạ tầng giao thông (Tăng 10% năng suất sản xuất cho toàn dân)';
      
      for (const player of room.players) {
        if (!player.role) continue;
        const res = results[player.id];
        
        res.socialScoreChange += 5.0;

        await this.prisma.player.update({
          where: { id: player.id },
          data: {
            capitalMultiplier: { increment: 0.1 },
          },
        });
      }
    }

    // Update all player scores and variables in DB
    for (const player of room.players) {
      if (!player.role) continue;
      const res = results[player.id];

      const updatedPlayer = await this.prisma.player.update({
        where: { id: player.id },
        data: {
          capital: res.capitalAfter,
          laborScore: { increment: res.laborScoreChange },
          socialScore: { increment: res.socialScoreChange },
          welfareScore: { increment: res.welfareScoreChange },
        },
      });

      res.capitalAfter = updatedPlayer.capital;
    }

    // Advance room round counter
    const nextRound = round + 1;
    const isFinished = nextRound > room.maxRounds;

    await this.prisma.room.update({
      where: { id: formattedRoomId },
      data: {
        currentRound: nextRound,
        status: isFinished ? RoomStatus.FINISHED : RoomStatus.PLAYING,
        macroBudget,
      },
    });

    const finalPlayers = await this.prisma.player.findMany({
      where: { roomId: formattedRoomId },
    });

    // If game finished, calculate sustainable development points and finalize scores
    if (isFinished) {
      await this.calculateEndGameScores(formattedRoomId);
    }

    return {
      round,
      results,
      players: finalPlayers,
      macroBudget,
      macroEventTriggered,
    };
  }

  private async calculateEndGameScores(roomId: string): Promise<void> {
    const players = await this.prisma.player.findMany({
      where: { roomId },
    });

    const initialCapitals: Record<EconomicRole, number> = {
      [EconomicRole.FDI]: 120.0,
      [EconomicRole.SOE]: 100.0,
      [EconomicRole.POE]: 90.0,
      [EconomicRole.COOP]: 80.0,
      [EconomicRole.HOUSEHOLD]: 70.0,
      [EconomicRole.WORKER]: 50.0,
    };

    for (const player of players) {
      if (!player.role) continue;

      let sustainabilityScore = 0.0;
      let welfareScoreBonus = 0.0;

      const initialCap = initialCapitals[player.role];
      if (player.welfareScore > 0 && player.capital >= initialCap) {
        welfareScoreBonus = 3.0;
      }

      if (player.capital > 0 && player.socialScore >= 10.0) {
        sustainabilityScore = 5.0;
      }

      const financialScore = player.capital / 10.0;
      
      const totalScore = parseFloat(
        (financialScore + player.laborScore + player.socialScore + player.welfareScore + welfareScoreBonus + sustainabilityScore).toFixed(2)
      );

      await this.prisma.player.update({
        where: { id: player.id },
        data: {
          welfareScore: { increment: welfareScoreBonus },
          sustainabilityScore,
          totalScore,
        },
      });
    }
  }
}