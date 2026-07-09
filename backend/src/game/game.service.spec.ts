"import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { PrismaService } from '../prisma/prisma.service';
import { EconomicRole, ActionType, RoomStatus } from '@prisma/client';

describe('GameService', () => {
  let service: GameService;
  let prisma: PrismaService;

  // Setup mock Prisma service
  const mockPrismaService = {
    room: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    player: {
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    roundAction: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveRound', () => {
    it('should calculate WORKER PRODUCE action correctly without tax', async () => {
      const mockRoom = {
        id: 'TEST01',
        status: RoomStatus.PLAYING,
        currentRound: 1,
        maxRounds: 5,
        macroBudget: 10.0,
        players: [
          {
            id: 'worker-id',
            username: 'WorkerPlayer',
            role: EconomicRole.WORKER,
            capital: 40.0,
            capitalMultiplier: 1.0,
            laborScore: 0.0,
            socialScore: 0.0,
            welfareScore: 0.0,
            isOnline: true,
            actions: [
              {
                round: 1,
                actionType: ActionType.PRODUCE,
              },
            ],
          },
        ],
      };

      mockPrismaService.room.findUnique.mockResolvedValue(mockRoom);
      
      // Mock player updates
      mockPrismaService.player.update.mockImplementation(({ d
<truncated 2681 bytes>