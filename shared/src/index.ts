export enum RoomStatus {
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
}

export enum EconomicRole {
  FDI = 'FDI',                 // Doanh nghiệp FDI
  SOE = 'SOE',                 // Doanh nghiệp Nhà nước
  POE = 'POE',                 // Doanh nghiệp Tư nhân
  COOP = 'COOP',               // Hợp tác xã
  HOUSEHOLD = 'HOUSEHOLD',     // Hộ kinh doanh
  WORKER = 'WORKER',           // Người lao động
}

export enum ActionType {
  PRODUCE = 'PRODUCE',         // Sản xuất / Làm việc
  INVEST = 'INVEST',           // Đầu tư mở rộng (Tái đầu tư)
  WELFARE = 'WELFARE',         // Tăng lương / Hỗ trợ lao động
  OPTIMIZE = 'OPTIMIZE',       // Tối ưu chi phí
  SOCIAL = 'SOCIAL',           // Đóng góp quỹ xã hội
}

export enum PowerupType {
  // Common (50% roll weight)
  TREND_CATCH = 'TREND_CATCH',   // Bắt Trend: +0.5 capitalMultiplier (self)
  INFLUENCER  = 'INFLUENCER',    // Sóng KOLs: +20 capital +1 social (POE/Coop/Household)
  HARDSHIP    = 'HARDSHIP',      // Vượt Khó: +2 welfare, floor capital at 50 (self/Coop)
  // Rare (25% roll weight)
  SHIELD      = 'SHIELD',        // Lá Chắn: passive, auto-blocks 50% of incoming negative cards
  USA_TAX     = 'USA_TAX',       // Thuế Quan Mỹ: cuts target yield by 40% (FDI/POE)
  FDI_FLUX    = 'FDI_FLUX',      // Biến Động FDI: -15 capital -0.2 multiplier (FDI)
  PRIDE       = 'PRIDE',         // Tự Hào VN: +10 capital +1 social to all domestic roles
  GLOBAL      = 'GLOBAL',        // Vươn Tầm: +0.3 multiplier +5 totalScore (non-worker self)
  // Epic (9% roll weight)
  WAR         = 'WAR',           // Chiến Tranh: all players -10 capital, INVEST cost +10
  // Mythic (1% roll weight)
  TERRORIST   = 'TERRORIST',     // Sự Cố An Ninh: target loses 50% capital
}

export interface Player {
  id: string;
  socketId: string;
  username: string;
  role: EconomicRole | null;
  capital: number;
  capitalMultiplier: number;
  laborScore: number;
  socialScore: number;
  welfareScore: number;
  sustainabilityScore: number;
  totalScore: number;
  isOnline: boolean;
  isAdmin: boolean;
  roomId: string;
  powerups: string[];          // Current card inventory (max 3)
  pendingPowerup: string | null; // New card waiting for swap/discard decision
  partnershipsA?: Partnership[];
  partnershipsB?: Partnership[];
  votes?: PolicyVote[];
  hasSubmitted?: boolean;
}

export interface Room {
  id: string; // Mã phòng 6 ký tự
  status: RoomStatus;
  currentRound: number;
  maxRounds: number;
  roundDuration: number;
  summaryDuration?: number;
  spectatorMode: boolean;
  warActive: boolean;
  macroBudget: number;
  marketPrice: number;
  currentTaxPolicy: string;
  activeEvent: string | null;
  createdAt: Date | string;
  players?: Player[];
  marketHistories?: MarketHistory[];
  partnerships?: Partnership[];
  policyVotes?: PolicyVote[];
}

export interface RoundAction {
  id: string;
  round: number;
  actionType: ActionType;
  playerId: string;
  roomId: string;
  createdAt: Date | string;
}

export interface MarketHistory {
  id: string;
  round: number;
  price: number;
  usd: number;
  oil: number;
  gold: number;
  createdAt: Date | string;
  roomId: string;
}

export interface Partnership {
  id: string;
  round: number;
  ratioA: number;
  ratioB: number;
  status: string; // PENDING | ACCEPTED | REJECTED | EXPIRED
  createdAt: Date | string;
  roomId: string;
  playerAId: string;
  playerBId: string;
}

export interface PolicyVote {
  id: string;
  round: number;
  choice: string; // PROGRESSIVE | STIMULUS
  createdAt: Date | string;
  roomId: string;
  playerId: string;
}

export interface RoundCalculationResult {
  playerId: string;
  username: string;
  role: EconomicRole;
  actionType: ActionType;
  capitalChange: number;
  capitalBefore: number;
  capitalAfter: number;
  laborScoreChange: number;
  socialScoreChange: number;
  welfareScoreChange: number;
  taxPaid: number;
  welfareReceived: number;
  welfareScoreBonus: number;
}

export interface PowerupNotification {
  senderName: string;
  senderRole: string | null;
  targetName?: string;
  targetRole?: string | null;
  powerupCode: string;
  shieldTriggered: boolean;
  isEpicDraw?: boolean; // true for War/Terrorist draws — broadcast to all
}

export interface SocketResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}