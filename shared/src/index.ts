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
}

export interface Room {
  id: string; // Mã phòng 6 ký tự
  status: RoomStatus;
  currentRound: number;
  maxRounds: number;
  macroBudget: number;
  createdAt: Date | string;
  players?: Player[];
}

export interface RoundAction {
  id: string;
  round: number;
  actionType: ActionType;
  playerId: string;
  roomId: string;
  createdAt: Date | string;
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

export interface SocketResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}