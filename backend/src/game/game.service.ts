import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Player, Room, RoundAction, RoomStatus, EconomicRole, ActionType, Partnership, PolicyVote, MarketHistory } from '@prisma/client';
import { RoundCalculationResult, EconomicRole as SharedEconomicRole, ActionType as SharedActionType, PowerupType, PowerupNotification } from '@ecorace/shared';

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoomPlayers(roomId: string): Promise<any[]> {
    const formattedRoomId = roomId.toUpperCase();
    const room = await this.prisma.room.findUnique({
      where: { id: formattedRoomId },
      select: { currentRound: true },
    });
    const currentRound = room?.currentRound ?? 1;

    const players = await this.prisma.player.findMany({
      where: { roomId: formattedRoomId },
      include: {
        actions: {
          where: { round: currentRound },
          select: { id: true },
        },
      },
      orderBy: { totalScore: 'desc' },
    });

    return players.map((p) => {
      const { actions, ...playerData } = p;
      return {
        ...playerData,
        hasSubmitted: actions.length > 0,
      };
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

  async updateRoomSettings(
    roomId: string,
    maxRounds: number,
    roundDuration: number,
    summaryDuration?: number,
    spectatorMode?: boolean,
  ): Promise<Room> {
    const formattedRoomId = roomId.toUpperCase();
    const room = await this.prisma.room.findUnique({ where: { id: formattedRoomId } });
    if (!room) throw new NotFoundException('Phòng chơi không tồn tại');

    if (room.status === RoomStatus.PLAYING) {
      if (maxRounds < room.currentRound + 1) {
        throw new BadRequestException(
          `Số vòng tối đa không thể ít hơn ${room.currentRound + 1} (vòng hiện tại + 1)`,
        );
      }
      if (roundDuration < 10) {
        throw new BadRequestException('Thời gian mỗi vòng tối thiểu là 10 giây');
      }
    }

    if (summaryDuration !== undefined && summaryDuration < 3) {
      throw new BadRequestException('Thời gian tổng kết tối thiểu là 3 giây');
    }

    return this.prisma.room.update({
      where: { id: formattedRoomId },
      data: {
        maxRounds,
        roundDuration,
        ...(summaryDuration !== undefined ? { summaryDuration } : {}),
        ...(spectatorMode !== undefined ? { spectatorMode } : {}),
      },
    });
  }

  async getRoomLeaderboard(roomId: string): Promise<Player[]> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    return this.prisma.player.findMany({
      where: {
        roomId,
        ...(room?.spectatorMode ? { isAdmin: false } : {}),
      },
      orderBy: { totalScore: 'desc' },
    });
  }

  async adjustPlayerPoints(playerId: string, capitalDelta: number, scoreDelta: number): Promise<Player> {
    return this.prisma.player.update({
      where: { id: playerId },
      data: {
        capital: { increment: capitalDelta },
        totalScore: { increment: scoreDelta },
      },
    });
  }

  async forceEndGame(roomId: string): Promise<Room> {
    const formattedRoomId = roomId.toUpperCase();
    return this.prisma.room.update({
      where: { id: formattedRoomId },
      data: {
        status: RoomStatus.FINISHED,
      },
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

    // In spectator mode, the admin is excluded from role assignment
    const eligiblePlayers = room.spectatorMode
      ? room.players.filter((p) => !p.isAdmin)
      : room.players;

    const updatePromises = eligiblePlayers.map((player, idx) => {
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
    const room = await this.prisma.room.findUnique({ where: { id: formattedRoomId } });

    const onlinePlayersCount = await this.prisma.player.count({
      where: {
        roomId: formattedRoomId,
        isOnline: true,
        // In spectator mode the admin has no role and never submits an action
        ...(room?.spectatorMode ? { isAdmin: false } : {}),
      },
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
    epicDraws?: any[];
    marketHistories: MarketHistory[];
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

    // --- Calculate Dynamic Market Price ---
    let produceCount = 0;
    let investCount = 0;
    for (const p of room.players) {
      if (!p.role) continue;
      const action = p.actions[0];
      const actionType = action ? action.actionType : ActionType.PRODUCE;
      if (actionType === ActionType.PRODUCE) produceCount++;
      else if (actionType === ActionType.INVEST) investCount++;
    }
    const totalPlayers = room.players.filter(p => p.role !== null).length || 1;
    const totalCung = produceCount + (investCount * 1.5);
    const equilibrium = totalPlayers * 0.5;
    const chenhLech = totalCung - equilibrium;
    const oldMarketPrice = room.marketPrice ?? 100.0;
    let newMarketPrice = oldMarketPrice * (1.0 - (chenhLech / totalPlayers) * 0.3);
    newMarketPrice = Math.max(60.0, Math.min(150.0, newMarketPrice));
    newMarketPrice = parseFloat(newMarketPrice.toFixed(2));

    // --- Random Event Trigger ---
    let activeEvent: string | null = null;
    let eventDescription = '';
    // Every 3 rounds starting round 3
    if (round > 1 && round % 3 === 0) {
      const eventList = [
        { code: 'GLOBAL_CRISIS', name: 'Khủng hoảng tài chính toàn cầu' },
        { code: 'DISASTER', name: 'Thiên tai / dịch bệnh' },
        { code: 'COOP_SUPPORT', name: 'Chính sách ưu đãi COOP' },
        { code: 'FDI_BOOM', name: 'Bùng nổ FDI' }
      ];
      const idx = Math.floor(Math.random() * eventList.length);
      activeEvent = eventList[idx].code;
      eventDescription = eventList[idx].name;
      macroEventTriggered = `Sự kiện vĩ mô: ${eventDescription}`;
    }

    // First pass: Calculate individual actions and apply events
    for (const player of room.players) {
      if (!player.role) continue;

      const action = player.actions[0];
      const actionType = action ? action.actionType : ActionType.PRODUCE; // Default to PRODUCE if did not submit

      let capitalChange = 0;
      let laborScoreChange = 0;
      let socialScoreChange = 0;
      let welfareScoreChange = 0;
      let multiplierChange = 0;

      // Event modifiers
      let capitalPenalty = 0;
      let incomeMultiplier = 1.0;
      let autoWelfare = 0;

      const hasShield = (player.socialScore + player.welfareScore >= 5.0);
      const shieldFactor = hasShield ? 0.5 : 1.0;

      if (activeEvent === 'GLOBAL_CRISIS') {
        if (player.role === EconomicRole.FDI) capitalPenalty = -player.capital * 0.25 * shieldFactor;
        else if (player.role === EconomicRole.POE) capitalPenalty = -player.capital * 0.10 * shieldFactor;
        else if (player.role === EconomicRole.SOE) capitalPenalty = -player.capital * 0.05 * shieldFactor;
        else if (player.role === EconomicRole.COOP) capitalPenalty = -player.capital * 0.05 * shieldFactor;
        else if (player.role === EconomicRole.HOUSEHOLD) capitalPenalty = -player.capital * 0.08 * shieldFactor;
        else if (player.role === EconomicRole.WORKER) incomeMultiplier = 0.95;
      } else if (activeEvent === 'DISASTER') {
        if (player.role === EconomicRole.POE) capitalPenalty = -player.capital * 0.10 * shieldFactor;
        else if (player.role === EconomicRole.COOP) capitalPenalty = -player.capital * 0.05 * shieldFactor;
        else if (player.role === EconomicRole.HOUSEHOLD) capitalPenalty = -player.capital * 0.20 * shieldFactor;
        else if (player.role === EconomicRole.FDI) capitalPenalty = -player.capital * 0.10 * shieldFactor;
        else if (player.role === EconomicRole.WORKER) {
          incomeMultiplier = 0.85;
          autoWelfare = 10.0;
        }
      }

      // Core Logic Calculations with Trade-offs
      switch (actionType) {
        case ActionType.PRODUCE:
          if (player.role === EconomicRole.WORKER) {
            capitalChange = 15.0 * player.capitalMultiplier * incomeMultiplier; // Salary
            laborScoreChange = 2.0;
          } else {
            let baseProfit = 20.0 * player.capitalMultiplier * (newMarketPrice / 100.0);
            if (activeEvent === 'COOP_SUPPORT' && player.role === EconomicRole.COOP) {
              baseProfit *= 1.15;
            } else if (activeEvent === 'FDI_BOOM' && player.role === EconomicRole.POE) {
              baseProfit *= 0.95;
            }
            capitalChange = baseProfit;
          }
          break;

        case ActionType.INVEST:
          if (player.role === EconomicRole.WORKER) {
            capitalChange = -15.0; // Spend on training
            multiplierChange = 0.2;
          } else {
            // Non-worker: 20% of current capital (min 15, max 50)
            let investCost = player.capital * 0.20;
            if (investCost < 15.0) investCost = 15.0;
            if (investCost > 50.0) investCost = 50.0;
            if (room.warActive) {
              investCost += 10.0;
            }
            capitalChange = -investCost;
            multiplierChange = 0.4;
          }
          break;

        case ActionType.WELFARE:
          if (player.role === EconomicRole.WORKER) {
            capitalChange = 15.0 * player.capitalMultiplier * incomeMultiplier; // Support bonus received
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
            // 15% of capital (min 8, max 20)
            let socialCost = player.capital * 0.15;
            if (socialCost < 8.0) socialCost = 8.0;
            if (socialCost > 20.0) socialCost = 20.0;
            capitalChange = -socialCost;
            socialScoreChange = 4.0;
          } else {
            // 25% of capital (min 15, max 40)
            let socialCost = player.capital * 0.25;
            if (socialCost < 15.0) socialCost = 15.0;
            if (socialCost > 40.0) socialCost = 40.0;
            capitalChange = -socialCost;
            socialScoreChange = 5.0;
          }
          break;
      }

      // Add auto-welfare and subtract event penalty
      capitalChange += autoWelfare + capitalPenalty;

      // Calculate taxation based on Room policy
      let taxPaid = 0;
      if (capitalChange > 0) {
        let taxRate = 0.0;
        if (room.currentTaxPolicy === 'PROGRESSIVE') {
          if (player.role === EconomicRole.WORKER) {
            taxRate = capitalChange > 15 ? 0.02 : 0.0;
          } else if (player.role === EconomicRole.COOP || player.role === EconomicRole.HOUSEHOLD) {
            taxRate = 0.08;
          } else {
            taxRate = 0.25;
          }
        } else if (room.currentTaxPolicy === 'STIMULUS') {
          if (player.role === EconomicRole.WORKER) {
            taxRate = 0.0;
          } else if (player.role === EconomicRole.COOP || player.role === EconomicRole.HOUSEHOLD) {
            taxRate = 0.02;
          } else {
            taxRate = 0.10;
          }
        } else {
          // Default fallback progressive
          if (player.role === EconomicRole.WORKER) {
            taxRate = capitalChange > 15 ? 0.02 : 0.0;
          } else if (player.role === EconomicRole.COOP || player.role === EconomicRole.HOUSEHOLD) {
            taxRate = 0.05;
          } else {
            taxRate = capitalChange > 20 ? 0.20 : 0.10;
          }
        }

        taxPaid = parseFloat((capitalChange * taxRate).toFixed(2));
        capitalChange -= taxPaid;
        macroBudget += taxPaid;
        socialScoreChange += 2.0; // Tax contribution point
      }

      // FDI BOOM / other event effects on multiplier
      if (activeEvent === 'FDI_BOOM' && player.role === EconomicRole.WORKER) {
        multiplierChange += 0.1;
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

    // --- Partnership Pooling & Sharing Pass ---
    const partnerships = await this.prisma.partnership.findMany({
      where: {
        roomId: formattedRoomId,
        round,
        status: 'ACCEPTED',
      },
    });

    for (const p of partnerships) {
      const resA = results[p.playerAId];
      const resB = results[p.playerBId];
      if (resA && resB) {
        const totalCapitalChange = resA.capitalChange + resB.capitalChange;
        resA.capitalChange = parseFloat((totalCapitalChange * p.ratioA).toFixed(2));
        resB.capitalChange = parseFloat((totalCapitalChange * p.ratioB).toFixed(2));
        
        resA.capitalAfter = parseFloat((resA.capitalBefore + resA.capitalChange).toFixed(2));
        resB.capitalAfter = parseFloat((resB.capitalBefore + resB.capitalChange).toFixed(2));
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

    // Third pass: Public Investment based on policy thresholds
    let threshold = 500.0;
    let deduction = 300.0;
    let socialBonus = 5.0;
    let multBonus = 0.1;

    if (room.currentTaxPolicy === 'PROGRESSIVE') {
      threshold = 300.0;
      deduction = 200.0;
      socialBonus = 5.0;
      multBonus = 0.1;
    } else if (room.currentTaxPolicy === 'STIMULUS') {
      threshold = 700.0;
      deduction = 400.0;
      socialBonus = 7.0;
      multBonus = 0.15;
    }

    if (macroBudget >= threshold) {
      macroBudget -= deduction;
      const displayEvent = `Xây dựng cơ sở hạ tầng quốc gia (Ngân sách -${deduction}. Mỗi người dân nhận +${socialBonus} Điểm Xã Hội và +${multBonus} Hệ số sản xuất)`;
      macroEventTriggered = macroEventTriggered ? `${macroEventTriggered} | ${displayEvent}` : displayEvent;
      
      for (const player of room.players) {
        if (!player.role) continue;
        const res = results[player.id];
        
        res.socialScoreChange += socialBonus;

        await this.prisma.player.update({
          where: { id: player.id },
          data: {
            capitalMultiplier: { increment: multBonus },
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

    // Save Market Price History
    await this.prisma.marketHistory.create({
      data: {
        round,
        price: newMarketPrice,
        usd: newMarketPrice * 250.0,
        oil: newMarketPrice * 0.8,
        gold: newMarketPrice * 0.85,
        roomId: formattedRoomId,
      },
    });

    const marketHistories = await this.prisma.marketHistory.findMany({
      where: { roomId: formattedRoomId },
      orderBy: { round: 'asc' },
    });

    // Advance room round counter
    const nextRound = round + 1;
    const isFinished = nextRound > room.maxRounds;

    await this.prisma.room.update({
      where: { id: formattedRoomId },
      data: {
        currentRound: nextRound,
        status: isFinished ? RoomStatus.FINISHED : RoomStatus.PLAYING,
        macroBudget,
        marketPrice: newMarketPrice,
        activeEvent,
        // Persist warActive if WAR has been played this game
        warActive: room.warActive,
      },
    });

    const finalPlayers = await this.prisma.player.findMany({
      where: { roomId: formattedRoomId },
    });

    // If game finished, calculate sustainable development points and finalize scores
    if (isFinished) {
      await this.calculateEndGameScores(formattedRoomId);
    }

    // Card drawing phase (skip final round)
    const epicDraws: PowerupNotification[] = [];
    if (!isFinished) {
      const drawablePlayers = finalPlayers.filter(p => p.role !== null);
      for (const p of drawablePlayers) {
        if (Math.random() > 0.35) continue;
        const drawn = this.rollPowerup();
        const isEpic = drawn === PowerupType.WAR || drawn === PowerupType.TERRORIST;
        const pPowerups = p.powerups || [];
        if (pPowerups.length < 3) {
          await this.prisma.player.update({
            where: { id: p.id },
            data: { powerups: { push: drawn } },
          });
          if (isEpic) {
            epicDraws.push({
              senderName: p.username,
              senderRole: p.role as string | null,
              powerupCode: drawn,
              shieldTriggered: false,
              isEpicDraw: true,
            });
          }
        } else {
          await this.prisma.player.update({
            where: { id: p.id },
            data: { pendingPowerup: drawn },
          });
          if (isEpic) {
            epicDraws.push({
              senderName: p.username,
              senderRole: p.role as string | null,
              powerupCode: drawn,
              shieldTriggered: false,
              isEpicDraw: true,
            });
          }
        }
      }
    }

    // Re-fetch players after drawing phase so inventories are current
    const playersAfterDraw = await this.prisma.player.findMany({
      where: { roomId: formattedRoomId },
    });

    return {
      round,
      results,
      players: playersAfterDraw,
      macroBudget,
      macroEventTriggered,
      epicDraws,
      marketHistories,
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

  // -------------------------------------------------------------------------
  // POWERUP: Roll a random card based on rarity weights
  // -------------------------------------------------------------------------
  private rollPowerup(): string {
    const table: [string, number][] = [
      [PowerupType.TREND_CATCH, 50],
      [PowerupType.INFLUENCER,  50],
      [PowerupType.HARDSHIP,    50],
      [PowerupType.SHIELD,      25],
      [PowerupType.USA_TAX,     25],
      [PowerupType.FDI_FLUX,    25],
      [PowerupType.PRIDE,       25],
      [PowerupType.GLOBAL,      25],
      [PowerupType.WAR,          9],
      [PowerupType.TERRORIST,    1],
    ];
    const totalWeight = table.reduce((s, [, w]) => s + w, 0);
    let roll = Math.random() * totalWeight;
    for (const [code, weight] of table) {
      roll -= weight;
      if (roll <= 0) return code;
    }
    return PowerupType.TREND_CATCH;
  }

  // -------------------------------------------------------------------------
  // POWERUP: Execute an instant card activation
  // -------------------------------------------------------------------------
  async usePowerup(
    senderId: string,
    powerupCode: string,
    targetId?: string,
  ): Promise<{ notification: PowerupNotification; updatedPlayers: Player[] }> {
    const sender = await this.prisma.player.findUnique({ where: { id: senderId } });
    if (!sender) throw new NotFoundException('Người gửi không tồn tại');
    if (!sender.powerups.includes(powerupCode)) {
      throw new BadRequestException('Bạn không có thẻ này trong kho');
    }

    const DOMESTIC = [EconomicRole.POE, EconomicRole.COOP, EconomicRole.HOUSEHOLD, EconomicRole.SOE, EconomicRole.WORKER];
    const NEGATIVE_CARDS = [PowerupType.USA_TAX, PowerupType.FDI_FLUX, PowerupType.WAR, PowerupType.TERRORIST];

    let target: Player | null = null;
    if (targetId) {
      target = await this.prisma.player.findUnique({ where: { id: targetId } });
      if (!target) throw new NotFoundException('Người chơi mục tiêu không tồn tại');
    }

    // ----- Shield check (passive) -----------------------------------------
    let shieldTriggered = false;
    let damageMultiplier = 1.0;
    if (target && NEGATIVE_CARDS.includes(powerupCode as PowerupType) && target.powerups.includes(PowerupType.SHIELD)) {
      shieldTriggered = true;
      damageMultiplier = 0.5;
      // Auto-consume shield from target's inventory
      const newInventory = target.powerups.filter((c, i) => {
        if (c === PowerupType.SHIELD && !shieldTriggered) { shieldTriggered = true; return false; }
        return true;
      });
      const shieldIdx = target.powerups.indexOf(PowerupType.SHIELD);
      const inventoryAfterShield = [...target.powerups];
      inventoryAfterShield.splice(shieldIdx, 1);
      await this.prisma.player.update({
        where: { id: target.id },
        data: { powerups: inventoryAfterShield },
      });
      // Refresh target reference
      target = await this.prisma.player.findUnique({ where: { id: targetId! } });
    }

    // ----- Apply card effects ---------------------------------------------
    const roomId = sender.roomId;
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });

    switch (powerupCode as PowerupType) {

      case PowerupType.TREND_CATCH:
        await this.prisma.player.update({
          where: { id: senderId },
          data: { capitalMultiplier: { increment: 0.5 } },
        });
        break;

      case PowerupType.INFLUENCER:
        if (!target) throw new BadRequestException('Cần chọn người chơi mục tiêu');
        if (!target.role || !( [EconomicRole.POE, EconomicRole.COOP, EconomicRole.HOUSEHOLD] as any[] ).includes(target.role)) {
          throw new BadRequestException('KOL chỉ hiệu quả với POE, Coop, Hộ cá thể');
        }
        await this.prisma.player.update({
          where: { id: target.id },
          data: { capital: { increment: 20.0 }, socialScore: { increment: 1.0 } },
        });
        break;

      case PowerupType.HARDSHIP:
        // Self: +2 welfare, ensure capital >= 50
        await this.prisma.player.update({
          where: { id: senderId },
          data: {
            welfareScore: { increment: 2.0 },
            capital: sender.capital < 50 ? 50.0 : undefined,
          },
        });
        break;

      case PowerupType.SHIELD:
        throw new BadRequestException('Lá Chắn là thẻ bị động, tự động kích hoạt khi bị tấn công');

      case PowerupType.USA_TAX: {
        if (!target) throw new BadRequestException('Cần chọn người chơi mục tiêu');
        if (!target.role || !( [EconomicRole.FDI, EconomicRole.POE] as any[] ).includes(target.role)) {
          throw new BadRequestException('Thuế Quan Mỹ chỉ nhắm được FDI hoặc POE');
        }
        const capitalCut = parseFloat((target.capital * 0.4 * damageMultiplier).toFixed(2));
        await this.prisma.player.update({
          where: { id: target.id },
          data: { capital: { decrement: capitalCut } },
        });
        break;
      }

      case PowerupType.FDI_FLUX: {
        if (!target) throw new BadRequestException('Cần chọn người chơi mục tiêu');
        if (target.role !== EconomicRole.FDI) {
          throw new BadRequestException('Biến Động FDI chỉ nhắm được doanh nghiệp FDI');
        }
        const capLoss = parseFloat((15.0 * damageMultiplier).toFixed(2));
        const multLoss = parseFloat((0.2 * damageMultiplier).toFixed(2));
        await this.prisma.player.update({
          where: { id: target.id },
          data: {
            capital: { decrement: capLoss },
            capitalMultiplier: { decrement: multLoss },
          },
        });
        break;
      }

      case PowerupType.PRIDE: {
        // Boost all domestic players in the room
        await this.prisma.player.updateMany({
          where: {
            roomId,
            role: { in: DOMESTIC },
          },
          data: { capital: { increment: 10.0 }, socialScore: { increment: 1.0 } },
        });
        break;
      }

      case PowerupType.GLOBAL:
        if (sender.role === EconomicRole.WORKER) {
          throw new BadRequestException('Người lao động không thể dùng Vươn Tầm Thế Giới');
        }
        await this.prisma.player.update({
          where: { id: senderId },
          data: {
            capitalMultiplier: { increment: 0.3 },
            totalScore: { increment: 5.0 },
          },
        });
        break;

      case PowerupType.WAR: {
        // All playing players lose -10 capital (halved by shield? WAR hits everyone so no individual shield check here)
        const warCapLoss = parseFloat((10.0 * damageMultiplier).toFixed(2));
        await this.prisma.player.updateMany({
          where: { roomId, role: { not: null } },
          data: { capital: { decrement: warCapLoss } },
        });
        // Activate persistent WAR flag on the room
        await this.prisma.room.update({
          where: { id: roomId },
          data: { warActive: true },
        });
        break;
      }

      case PowerupType.TERRORIST: {
        if (!target) throw new BadRequestException('Cần chọn người chơi mục tiêu');
        const terrorLoss = parseFloat((target.capital * 0.5 * damageMultiplier).toFixed(2));
        await this.prisma.player.update({
          where: { id: target.id },
          data: { capital: { decrement: terrorLoss } },
        });
        break;
      }
    }

    // Remove card from sender's inventory
    const senderInventory = [...sender.powerups];
    const idx = senderInventory.indexOf(powerupCode);
    if (idx !== -1) senderInventory.splice(idx, 1);
    await this.prisma.player.update({
      where: { id: senderId },
      data: { powerups: senderInventory },
    });

    const updatedPlayers = await this.getRoomPlayers(roomId);
    const notification: PowerupNotification = {
      senderName: sender.username,
      senderRole: sender.role as string | null,
      targetName: target?.username,
      targetRole: target?.role as string | null ?? undefined,
      powerupCode,
      shieldTriggered,
    };

    return { notification, updatedPlayers };
  }

  // -------------------------------------------------------------------------
  // POWERUP: Player resolves a full-inventory swap or discard
  // -------------------------------------------------------------------------
  async resolvePendingPowerup(
    playerId: string,
    choice: 'discard' | 'swap',
    swapIndex?: number,
  ): Promise<Player> {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Người chơi không tồn tại');
    if (!player.pendingPowerup) throw new BadRequestException('Không có thẻ chờ xử lý');

    if (choice === 'discard') {
      return this.prisma.player.update({
        where: { id: playerId },
        data: { pendingPowerup: null },
      });
    }

    // Swap: replace the card at swapIndex with the pending card
    if (swapIndex === undefined || swapIndex < 0 || swapIndex > 2) {
      throw new BadRequestException('Chỉ số thẻ cần thay không hợp lệ');
    }
    const newInventory = [...player.powerups];
    newInventory[swapIndex] = player.pendingPowerup;
    return this.prisma.player.update({
      where: { id: playerId },
      data: { powerups: newInventory, pendingPowerup: null },
    });
  }

  // -------------------------------------------------------------------------
  // POWERUP: Admin / Orchestrator force-awards a card to a player
  // -------------------------------------------------------------------------
  async adminAwardPowerup(playerId: string, powerupCode: string): Promise<Player> {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Người chơi không tồn tại');

    if (player.powerups.length < 3) {
      return this.prisma.player.update({
        where: { id: playerId },
        data: { powerups: { push: powerupCode } },
      });
    }
    // Inventory full — park as pending
    return this.prisma.player.update({
      where: { id: playerId },
      data: { pendingPowerup: powerupCode },
    });
  }

  async submitPolicyVote(
    playerId: string,
    roomId: string,
    round: number,
    choice: string,
  ): Promise<PolicyVote> {
    const formattedRoomId = roomId.toUpperCase();
    return this.prisma.policyVote.upsert({
      where: {
        playerId_round: {
          playerId,
          round,
        },
      },
      update: {
        choice,
      },
      create: {
        playerId,
        roomId: formattedRoomId,
        round,
        choice,
      },
    });
  }

  async invitePartnership(
    playerAId: string,
    playerBId: string,
    roomId: string,
    round: number,
    ratioA: number,
    ratioB: number,
  ): Promise<Partnership> {
    const formattedRoomId = roomId.toUpperCase();
    
    // Check if player B is already in a partnership for this round
    const existing = await this.prisma.partnership.findFirst({
      where: {
        roomId: formattedRoomId,
        round,
        status: 'ACCEPTED',
        OR: [
          { playerAId: playerBId },
          { playerBId },
          { playerAId: playerAId },
          { playerBId: playerAId },
        ],
      },
    });
    if (existing) {
      throw new BadRequestException('Một trong hai người chơi đã tham gia liên doanh ở vòng này');
    }

    return this.prisma.partnership.create({
      data: {
        playerAId,
        playerBId,
        roomId: formattedRoomId,
        round,
        ratioA,
        ratioB,
        status: 'PENDING',
      },
      include: {
        playerA: true,
        playerB: true,
      },
    });
  }

  async respondPartnership(
    partnershipId: string,
    status: 'ACCEPTED' | 'REJECTED',
  ): Promise<Partnership> {
    const partnership = await this.prisma.partnership.findUnique({
      where: { id: partnershipId },
    });
    if (!partnership) throw new NotFoundException('Lời mời liên doanh không tồn tại');

    if (status === 'ACCEPTED') {
      // Check again if either player is already in an accepted partnership
      const existing = await this.prisma.partnership.findFirst({
        where: {
          roomId: partnership.roomId,
          round: partnership.round,
          status: 'ACCEPTED',
          OR: [
            { playerAId: partnership.playerAId },
            { playerBId: partnership.playerAId },
            { playerAId: partnership.playerBId },
            { playerBId: partnership.playerBId },
          ],
        },
      });
      if (existing) {
        throw new BadRequestException('Một trong hai người chơi đã có liên doanh khác được chấp nhận');
      }
    }

    return this.prisma.partnership.update({
      where: { id: partnershipId },
      data: { status },
      include: {
        playerA: true,
        playerB: true,
      },
    });
  }

  async getRoundVotes(roomId: string, round: number): Promise<PolicyVote[]> {
    return this.prisma.policyVote.findMany({
      where: { roomId: roomId.toUpperCase(), round },
    });
  }

  async updateRoomTaxPolicy(roomId: string, policy: string): Promise<Room> {
    return this.prisma.room.update({
      where: { id: roomId.toUpperCase() },
      data: { currentTaxPolicy: policy },
    });
  }
}