import { Test, TestingModule } from '@nestjs/testing';
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
      create: jest.fn(),
    },
    roundAction: {
      count: jest.fn(),
      create: jest.fn(),
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
      mockPrismaService.player.update.mockImplementation(({ data }: any) => {
        return Promise.resolve({
          capital: 55.0, // 40 + 15 salary
        });
      });

      mockPrismaService.room.update.mockResolvedValue({});
      mockPrismaService.player.findMany.mockResolvedValue([
        {
          id: 'worker-id',
          username: 'WorkerPlayer',
          role: EconomicRole.WORKER,
          capital: 55.0,
          capitalMultiplier: 1.0,
          laborScore: 2.0,
          socialScore: 0.0,
          welfareScore: 0.0,
        },
      ]);

      const result = await service.resolveRound('TEST01', 1);

      expect(result.results['worker-id']).toBeDefined();
      expect(result.results['worker-id'].capitalChange).toBe(15.0);
      expect(result.results['worker-id'].taxPaid).toBe(0.0);
      expect(result.results['worker-id'].laborScoreChange).toBe(2.0);
    });

    it('should calculate SOE PRODUCE action with progressive tax', async () => {
      const mockRoom = {
        id: 'TEST01',
        status: RoomStatus.PLAYING,
        currentRound: 1,
        maxRounds: 5,
        macroBudget: 0.0,
        players: [
          {
            id: 'soe-id',
            username: 'SOEPlayer',
            role: EconomicRole.SOE,
            capital: 100.0,
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
      
      mockPrismaService.player.update.mockImplementation(({ data }: any) => {
        return Promise.resolve({
          capital: 116.0, // 100 + 20 - 4 tax
        });
      });

      mockPrismaService.room.update.mockResolvedValue({});
      mockPrismaService.player.findMany.mockResolvedValue([
        {
          id: 'soe-id',
          username: 'SOEPlayer',
          role: EconomicRole.SOE,
          capital: 118.0, // 100 + 20 - 2 tax
          capitalMultiplier: 1.0,
          laborScore: 0.0,
          socialScore: 2.0,
          welfareScore: 0.0,
        },
      ]);

      const result = await service.resolveRound('TEST01', 1);

      expect(result.results['soe-id']).toBeDefined();
      expect(result.results['soe-id'].taxPaid).toBe(2.0); // 10% of 20 since cap is <= 20
      expect(result.results['soe-id'].capitalChange).toBe(18.0); // 20 - 2
      expect(result.macroBudget).toBe(2.0);
    });
  });
});