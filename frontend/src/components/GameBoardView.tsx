import React, { useState, useEffect } from 'react';
import { useGame } from '../context/SocketContext';
import { ActionType, EconomicRole, PowerupType } from '@ecorace/shared';
import {
  Shield, Sparkles, TrendingUp, Heart, Share2, Award, Info, Users,
  Clock, Landmark, BookOpen, X, ShieldAlert, Eye, ChevronRight, AlertTriangle, Zap
} from 'lucide-react';
import { MarketChart } from './MarketChart';
import { EventPopup } from './EventPopup';
import { PartnershipPanel } from './PartnershipPanel';
import { VotingOverlay } from './VotingOverlay';
import { LessonDrawer } from './LessonDrawer';

export const GameBoardView: React.FC = () => {
  const {
    room, player, submitAction, results, adminNextRound, adminAdjustPoints,
    adminForceEndGame, usePowerup, resolvePendingPowerup, adminAwardPowerup,
    lastNotification, clearNotification, error, clearError, adminUpdateSettings,
    lastActionTaken
  } = useGame();

  // Dynamic timer bound to room duration
  const defaultDuration = room?.roundDuration || 40;
  const [timeLeft, setTimeLeft] = useState(defaultDuration);

  // Modals & Panels
  const [showHelp, setShowHelp] = useState(false);
  const [helpTab, setHelpTab] = useState<'rules' | 'lessons'>('rules');
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Admin adjust state
  const [adjustTargetId, setAdjustTargetId] = useState<string>('');
  const [capitalDelta, setCapitalDelta] = useState<number>(10);
  const [scoreDelta, setScoreDelta] = useState<number>(1);
  const [adminAwardCardCode, setAdminAwardCardCode] = useState<string>('');

  // Live settings (admin during PLAYING)
  const [liveMaxRounds, setLiveMaxRounds] = useState<number>(room?.maxRounds ?? 5);
  const [liveRoundDuration, setLiveRoundDuration] = useState<number>(room?.roundDuration ?? 40);
  const [liveSummaryDuration, setLiveSummaryDuration] = useState<number>(room?.summaryDuration ?? 10);

  // Powerups local state
  const [targetingCardCode, setTargetingCardCode] = useState<string | null>(null);
  const [swapSelectedIdx, setSwapSelectedIdx] = useState<number>(0);

  // Action selection: local for immediate feedback, fallback to server-confirmed
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const confirmedAction = selectedAction || lastActionTaken;

  // Sync live settings form when room values change
  useEffect(() => {
    setLiveMaxRounds(room?.maxRounds ?? 5);
    setLiveRoundDuration(room?.roundDuration ?? 40);
    setLiveSummaryDuration(room?.summaryDuration ?? 10);
  }, [room?.maxRounds, room?.roundDuration, room?.summaryDuration]);

  // Derived flags
  const isAdmin = player?.isAdmin ?? false;
  const isOrchestrator = isAdmin && (room?.spectatorMode ?? false);

  // Synchronize timer countdown when round shifts
  useEffect(() => {
    setTimeLeft(defaultDuration);
    setSelectedAction(null);
    setTargetingCardCode(null);
    clearError();
  }, [room?.currentRound, defaultDuration, clearError]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleActionSelect = (actionType: ActionType) => {
    if (selectedAction) return;
    setSelectedAction(actionType);
    submitAction(actionType);
  };

  const handleAdjustPointsSubmit = () => {
    if (!adjustTargetId) return;
    adminAdjustPoints(adjustTargetId, capitalDelta, scoreDelta);
  };

  const handleAdminAwardPowerupSubmit = () => {
    if (!adjustTargetId || !adminAwardCardCode) return;
    adminAwardPowerup(adjustTargetId, adminAwardCardCode);
    setAdminAwardCardCode('');
  };

  const handleApplyLiveSettings = () => {
    adminUpdateSettings(liveMaxRounds, liveRoundDuration, liveSummaryDuration);
  };

  const getPowerupInfo = (code: string) => {
    switch (code as PowerupType) {
      case PowerupType.TREND_CATCH:
        return { name: 'Bắt Trend 🚀', desc: 'Hiệu suất sản xuất: +0.5 vĩnh viễn.', color: 'border-purple-500/40 text-purple-400 bg-purple-500/10', needsTarget: false };
      case PowerupType.INFLUENCER:
        return { name: 'Sóng KOLs 📣', desc: 'POE/Coop/Hộ cá thể: +20.0 Vốn, +1.0 Điểm Xã hội.', color: 'border-teal-500/40 text-teal-400 bg-teal-500/10', needsTarget: true };
      case PowerupType.HARDSHIP:
        return { name: 'Vượt Khó 🛡️', desc: 'Nhận +2.0 Điểm Phúc lợi, bảo hiểm sàn vốn 50.0.', color: 'border-green-500/40 text-green-400 bg-green-500/10', needsTarget: false };
      case PowerupType.SHIELD:
        return { name: 'Lá Chắn 🛡️', desc: 'Bị động: Giảm 50% sát thương từ thẻ hại của đối thủ.', color: 'border-slate-500/40 text-slate-300 bg-slate-500/10', needsTarget: false };
      case PowerupType.USA_TAX:
        return { name: 'Thuế Mỹ 🇺🇸', desc: 'FDI/POE: Cắt giảm 40% doanh thu trong vòng.', color: 'border-red-500/40 text-red-400 bg-red-500/10', needsTarget: true };
      case PowerupType.FDI_FLUX:
        return { name: 'FDI Rút Vốn 📉', desc: 'FDI: Trừ -15.0 Vốn và -0.2 Hiệu suất sản xuất.', color: 'border-orange-500/40 text-orange-400 bg-orange-500/10', needsTarget: true };
      case PowerupType.PRIDE:
        return { name: 'Tự Hào VN 🇻🇳', desc: 'Tất cả người chơi nội địa: +10.0 Vốn, +1.0 Điểm Xã hội.', color: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10', needsTarget: false };
      case PowerupType.GLOBAL:
        return { name: 'Vươn Tầm 🌍', desc: 'Hiệu suất: +0.3, Điểm tổng: +5.0 (Trừ người lao động).', color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10', needsTarget: false };
      case PowerupType.WAR:
        return { name: 'Chiến Tranh ⚔️', desc: 'Toàn bộ người chơi: -10.0 Vốn, tăng giá INVEST thêm 10.0.', color: 'border-rose-600 text-rose-400 bg-rose-950/20 animate-pulse', needsTarget: false };
      case PowerupType.TERRORIST:
        return { name: 'Sự Cố An Ninh ⚠️', desc: 'Mục tiêu: Đánh sập bay mất 50% tổng số Vốn hiện có.', color: 'border-lime-500/40 text-lime-400 bg-lime-500/10 font-bold', needsTarget: true };
      default:
        return { name: code, desc: 'Thẻ chưa xác định.', color: 'border-gray-500/40 text-gray-400 bg-gray-500/10', needsTarget: false };
    }
  };

  const handleCardClick = (code: string) => {
    const info = getPowerupInfo(code);
    if (info.needsTarget) {
      // Toggle targeting mode
      if (targetingCardCode === code) {
        setTargetingCardCode(null);
      } else {
        setTargetingCardCode(code);
      }
    } else {
      // Direct activation
      usePowerup(code);
    }
  };

  const handleLeaderboardTargetSelect = (targetPlayerId: string) => {
    if (!targetingCardCode) return;
    usePowerup(targetingCardCode, targetPlayerId);
    setTargetingCardCode(null);
  };

  const getRoleDetails = (role: EconomicRole | null) => {
    switch (role) {
      case EconomicRole.FDI:
        return { name: 'Doanh nghiệp FDI', ownership: 'Sở hữu nước ngoài', desc: 'Có tiềm lực tài chính lớn nhất, tập trung sản xuất quy mô lớn và tối ưu hóa chuỗi cung ứng toàn cầu.', color: 'text-purple-400 border-purple-500/20 bg-purple-500/5' };
      case EconomicRole.SOE:
        return { name: 'Doanh nghiệp Nhà nước (SOE)', ownership: 'Sở hữu toàn dân', desc: 'Nắm giữ các lĩnh vực then chốt, gánh vác trách nhiệm xã hội lớn, đóng thuế tích lũy ngân sách quốc gia.', color: 'text-red-400 border-red-500/20 bg-red-500/5' };
      case EconomicRole.POE:
        return { name: 'Doanh nghiệp Tư nhân (POE)', ownership: 'Sở hữu tư nhân', desc: 'Năng động, cạnh tranh tự do trên thị trường để tìm kiếm lợi nhuận và mở rộng quy mô sản xuất.', color: 'text-blue-400 border-blue-500/20 bg-blue-500/5' };
      case EconomicRole.COOP:
        return { name: 'Hợp tác xã (COOP)', ownership: 'Sở hữu tập thể', desc: 'Liên kết tương trợ giữa các thành viên, phân phối lợi ích dựa trên mức độ tham gia đóng góp và lao động.', color: 'text-green-400 border-green-500/20 bg-green-500/5' };
      case EconomicRole.HOUSEHOLD:
        return { name: 'Hộ kinh doanh cá thể', ownership: 'Sở hữu tư nhân nhỏ', desc: 'Kinh doanh gia đình, linh hoạt thích ứng với thị trường nhưng quy mô vốn hạn chế.', color: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5' };
      case EconomicRole.WORKER:
        return { name: 'Người lao động', ownership: 'Không có tư liệu sản xuất', desc: 'Bán sức lao động để nhận tiền lương. Đóng góp công sức tạo ra của cải vật chất cho xã hội.', color: 'text-orange-400 border-orange-500/20 bg-orange-500/5' };
      default:
        return { name: 'Chưa phân vai', ownership: 'Không xác định', desc: '', color: 'text-gray-400 border-gray-500/20 bg-gray-500/5' };
    }
  };

  const getActionDetails = (action: ActionType) => {
    const investCost = room?.warActive ? 40.0 : 30.0;
    switch (action) {
      case ActionType.PRODUCE:
        return { title: 'Sản xuất / Làm việc', desc: 'Tập trung sản xuất tạo ra doanh thu trực tiếp dựa trên hệ số nhân năng suất hiện tại.', effects: player?.role === EconomicRole.WORKER ? 'Vốn: +15.0, Điểm lao động: +2.0' : `Vốn: +${(20 * (player?.capitalMultiplier || 1.0)).toFixed(1)}, Đóng thuế`, icon: <TrendingUp className="w-5 h-5 text-green-400" /> };
      case ActionType.INVEST:
        return { title: 'Đầu tư mở rộng', desc: room?.warActive ? 'Chi tiền tăng năng suất (Gặp khó khăn vì Chiến tranh thương mại)' : 'Chi tiền mua thiết bị hoặc đào tạo kỹ năng để tăng vĩnh viễn hệ số nhân năng suất.', effects: player?.role === EconomicRole.WORKER ? 'Vốn: -15.0, Năng suất: +20%' : `Vốn: -${investCost.toFixed(1)}, Năng suất: +30%`, icon: <Sparkles className="w-5 h-5 text-yellow-400" /> };
      case ActionType.WELFARE:
        return { title: 'Tăng lương / Trợ cấp', desc: 'Chủ doanh nghiệp hỗ trợ cải thiện đời sống người lao động hoặc tự tăng phúc lợi xã hội.', effects: player?.role === EconomicRole.WORKER ? 'Vốn: +15.0, Điểm phúc lợi: +1.0' : 'Mất Vốn đầu tư, Đóng góp Xã hội tăng mạnh', icon: <Heart className="w-5 h-5 text-red-400" /> };
      case ActionType.OPTIMIZE:
        return { title: 'Tối ưu hóa chi phí', desc: 'Cắt giảm bảo vệ môi trường, giảm phúc lợi nhân viên để thu lợi nhuận ngắn hạn cao nhất.', effects: player?.role === EconomicRole.WORKER ? 'Làm thêm giờ: Vốn +5.0, Điểm xã hội -1.0' : 'Vốn tăng cực mạnh, Điểm Đóng góp xã hội bị trừ', icon: <Shield className="w-5 h-5 text-orange-400" /> };
      case ActionType.SOCIAL:
        return { title: 'Đóng góp Quỹ xã hội', desc: 'Tự nguyện ủng hộ quỹ xóa đói giảm nghèo hoặc quỹ từ thiện công ích của cộng đồng.', effects: 'Chi phí vốn thấp, Điểm đóng góp xã hội tăng', icon: <Share2 className="w-5 h-5 text-blue-400" /> };
    }
  };

  const roleInfo = getRoleDetails(player?.role || null);
  const activePlayers = room?.players || [];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col lg:flex-row">

      {/* ============================================================ */}
      {/* MAIN GAME AREA — flex-1 */}
      {/* ============================================================ */}
      <div className="flex-1 min-w-0 flex flex-col p-4 md:p-6 overflow-y-auto">

        {/* Global Live Notifications Banner */}
        {lastNotification && (
          <div className={`mb-4 px-4 py-3 rounded-xl border flex items-center justify-between ${
            lastNotification.isEpicDraw
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
              : 'bg-blue-600/10 border-blue-500/20 text-blue-300'
          }`}>
            <div className="flex items-center space-x-2 text-xs">
              <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
              <span>
                {lastNotification.isEpicDraw ? (
                  <span>
                    ⚠️ Phát hiện thẻ nguy hiểm! Người chơi <strong>{lastNotification.senderName}</strong> vừa rút được thẻ <strong>{getPowerupInfo(lastNotification.powerupCode).name}</strong>!
                  </span>
                ) : (
                  <span>
                    ⚡ <strong>{lastNotification.senderName}</strong> sử dụng thẻ <strong>{getPowerupInfo(lastNotification.powerupCode).name}</strong>
                    {lastNotification.targetName && (
                      <span> lên <strong>{lastNotification.targetName}</strong></span>
                    )}
                    {lastNotification.shieldTriggered && (
                      <strong className="text-green-400 ml-1.5">(Lá chắn kích hoạt cản 50%)</strong>
                    )}!
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={clearNotification}
              className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl border bg-red-500/20 border-red-500/40 text-red-300 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-3 flex items-center space-x-3">
            <Landmark className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-semibold">Ngân Sách Nhà Nước</span>
              <span className="text-lg font-bold text-yellow-400">{room?.macroBudget?.toFixed(1) || '0.0'}</span>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-3 flex items-center space-x-3">
            <Clock className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-semibold">Vòng Chơi</span>
              <span className="text-lg font-bold">{room?.currentRound} / {room?.maxRounds}</span>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-3 flex items-center space-x-3">
            <Users className="w-5 h-5 text-green-400 shrink-0" />
            <div>
              <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-semibold">Online</span>
              <span className="text-lg font-bold">{activePlayers.filter(p => p.isOnline).length} / {activePlayers.length}</span>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5">
              <span>Thời Gian Nhận Lệnh</span>
              <span className="text-red-400 font-bold">{timeLeft}s</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/10">
              <div
                className="bg-red-500 h-full transition-all duration-1000"
                style={{ width: `${(timeLeft / defaultDuration) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Global War active alert banner */}
        {room?.warActive && (
          <div className="mb-4 bg-red-950/20 border border-red-500/30 text-red-400 rounded-xl px-4 py-2 text-xs flex items-center space-x-2 font-bold animate-pulse">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Đang xảy ra chiến tranh thương mại! Toàn bộ hoạt động INVEST tiêu tốn thêm +10.0 Vốn.</span>
          </div>
        )}

        {/* Help Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 border border-blue-500/20 text-white rounded-xl transition text-xs font-bold shadow-lg"
          >
            <BookOpen className="w-4 h-4" />
            <span>HELP: Luật & Công Thức</span>
          </button>
        </div>

        {/* ── ORCHESTRATOR VIEW ── */}
        {isOrchestrator ? (
          <div className="flex-1 flex flex-col space-y-4">
            <div className="backdrop-blur-md bg-yellow-500/5 border border-yellow-500/15 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
              <Eye className="w-10 h-10 text-yellow-400" />
              <h2 className="text-xl font-black text-yellow-400 uppercase tracking-wider">Chế Độ Giảng Viên – Đang Quan Sát</h2>
              <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                Bạn đang ở chế độ Orchestrator. Không tham gia chọn hành động. Sử dụng bảng điều khiển bên phải để điều hành trận đấu.
              </p>
            </div>

            {/* Macro overview cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {activePlayers.filter(p => !p.isAdmin).map(p => (
                <div key={p.id} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">{p.username}</span>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${p.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono uppercase">{p.role || '—'}</div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-yellow-400 font-bold">{p.capital.toFixed(1)} Vốn</span>
                    <span className="text-red-400 font-bold">{p.totalScore.toFixed(1)} Điểm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        ) : (
          /* ── PLAYER + ADMIN VIEW ── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-stretch">

            {/* Left: Profile & Personal Stats */}
            <div className="lg:col-span-1 flex flex-col space-y-6">
              <div className={`border rounded-2xl p-5 relative overflow-hidden ${roleInfo.color}`}>
                <span className="absolute top-2 right-2 text-[9px] uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 font-bold">Vai Trò</span>
                <h2 className="text-2xl font-black tracking-tight">{roleInfo.name}</h2>
                <div className="text-xs text-gray-400 font-semibold mt-1">Sở hữu: {roleInfo.ownership}</div>
                <p className="text-xs text-gray-300 mt-4 leading-relaxed">{roleInfo.desc}</p>
              </div>

              {/* Partnership Panel */}
              {!isOrchestrator && player?.role && (
                <PartnershipPanel />
              )}

              {/* Private Powerups Inventory Block */}
              {player && player.role && (
                <div className="backdrop-blur-md bg-[#161a29]/90 border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center">
                      <Zap className="w-4 h-4 mr-1 text-purple-400 animate-pulse" />
                      Kho Thẻ Bài ({player.powerups?.length || 0}/3)
                    </h3>
                  </div>

                  {player.powerups && player.powerups.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {player.powerups.map((code, idx) => {
                        const info = getPowerupInfo(code);
                        const isSelected = targetingCardCode === code;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleCardClick(code)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'border-purple-500 bg-purple-500/20 shadow-[0_0_15px_rgba(147,51,234,0.3)] scale-[1.02]'
                                : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/15'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold">{info.name}</span>
                              {info.needsTarget && (
                                <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">
                                  Tấn Công
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 leading-normal">{info.desc}</p>
                            {isSelected && (
                              <p className="text-[9px] text-yellow-400 font-bold mt-1.5 animate-pulse">
                                🎯 Chọn 1 mục tiêu trên Bảng điểm/Lớp học để tấn công...
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-black/10">
                      <p className="text-xs text-gray-500">Chưa sở hữu thẻ bài nào.</p>
                      <p className="text-[10px] text-gray-600 mt-1">Cơ hội rút thẻ 35% ở cuối mỗi vòng đấu.</p>
                    </div>
                  )}
                </div>
              )}

              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 flex-1 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 border-b border-white/5 pb-2">Chỉ Số Cá Nhân</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-gray-400 block font-semibold">Tích Lũy Vốn</span>
                    <span className="text-2xl font-black text-yellow-300">{player?.capital?.toFixed(1)}</span>
                  </div>
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-gray-400 block font-semibold">Hiệu Suất</span>
                    <span className="text-2xl font-black text-green-400">{player?.capitalMultiplier ? `x${player.capitalMultiplier.toFixed(1)}` : 'x1.0'}</span>
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-xs font-semibold text-gray-300 flex items-center"><Award className="w-4 h-4 mr-2 text-green-400" />Điểm Lao Động</span>
                    <span className="font-bold text-green-400">{player?.laborScore?.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-xs font-semibold text-gray-300 flex items-center"><Share2 className="w-4 h-4 mr-2 text-blue-400" />Điểm Đóng Góp Xã Hội</span>
                    <span className="font-bold text-blue-400">{player?.socialScore?.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs font-semibold text-gray-300 flex items-center"><Heart className="w-4 h-4 mr-2 text-red-400" />Điểm Phúc Lợi</span>
                    <span className="font-bold text-red-400">{player?.welfareScore?.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Action Picker */}
            <div className="lg:col-span-2 flex flex-col space-y-6">
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 flex-1">
                <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Quyết Định Hành Động</h3>
                  {confirmedAction && (
                    <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-lg animate-pulse">Đã khóa hành động</span>
                  )}
                </div>

                <div className="space-y-3">
                  {[ActionType.PRODUCE, ActionType.INVEST, ActionType.WELFARE, ActionType.OPTIMIZE, ActionType.SOCIAL].map((act) => {
                    const details = getActionDetails(act);
                    if (!details) return null;
                    const isThisSelected = confirmedAction === act;
                    return (
                      <button
                        key={act}
                        onClick={() => handleActionSelect(act)}
                        disabled={!!confirmedAction}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          isThisSelected ? 'border-red-500 bg-red-950/20 shadow-lg'
                          : confirmedAction ? 'border-white/5 opacity-40 cursor-not-allowed'
                          : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-black/30 rounded-lg">{details.icon}</div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-sm">{details.title}</span>
                              <span className="text-[10px] font-semibold text-yellow-400/90 tracking-wide uppercase px-2 py-0.5 bg-black/20 rounded">{details.effects}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{details.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* ADMIN SIDE PANEL — always visible for admin, fixed width      */}
      {/* ============================================================ */}
      <aside className="w-full lg:w-[400px] xl:w-[440px] shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#0d1120] flex flex-col overflow-y-auto">

        {/* Panel Header */}
        <div className="sticky top-0 bg-[#0d1120] border-b border-white/10 p-4 flex items-center space-x-2 z-10">
          {isAdmin ? (
            <>
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <span className="text-sm font-black uppercase tracking-wider text-red-400 block">Admin Control Board</span>
                <span className="text-[10px] text-gray-500">
                  {isOrchestrator ? 'Orchestrator – Quan sát' : 'Người chơi + Admin'}
                </span>
              </div>
            </>
          ) : (
            <>
              <Landmark className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <span className="text-sm font-black uppercase tracking-wider text-blue-400 block">Bảng Xếp Hạng Trực Tiếp</span>
                <span className="text-[10px] text-gray-500">Thành viên phòng chơi</span>
              </div>
            </>
          )}
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">

          {/* Quick Adjust Panel */}
          {isAdmin && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Điều chỉnh chỉ số người chơi</h4>

              <select
                value={adjustTargetId}
                onChange={(e) => setAdjustTargetId(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white outline-none"
              >
                <option value="">-- Chọn người chơi --</option>
                {activePlayers.filter(p => !p.isAdmin || !room?.spectatorMode).map(p => (
                  <option key={p.id} value={p.id}>{p.username} ({p.role || 'Chưa phân vai'})</option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Vốn (+/-)</label>
                  <input
                    type="number"
                    value={capitalDelta}
                    onChange={(e) => setCapitalDelta(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Điểm (+/-)</label>
                  <input
                    type="number"
                    value={scoreDelta}
                    onChange={(e) => setScoreDelta(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleAdjustPointsSubmit}
                disabled={!adjustTargetId}
                className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition flex items-center justify-center space-x-1"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span>Áp dụng cộng/trừ</span>
              </button>

              {/* Admin Award Powerup Interface */}
              <div className="border-t border-white/5 pt-3 mt-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tặng thẻ bài kinh tế</label>
                <div className="flex gap-2">
                  <select
                    value={adminAwardCardCode}
                    onChange={(e) => setAdminAwardCardCode(e.target.value)}
                    className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white outline-none"
                  >
                    <option value="">-- Chọn thẻ bài --</option>
                    <option value="TREND_CATCH">Bắt Trend (Common)</option>
                    <option value="INFLUENCER">Sóng KOLs (Common)</option>
                    <option value="HARDSHIP">Vượt Khó (Common)</option>
                    <option value="SHIELD">Lá Chắn (Rare)</option>
                    <option value="USA_TAX">Thuế Mỹ (Rare)</option>
                    <option value="FDI_FLUX">Biến Động FDI (Rare)</option>
                    <option value="PRIDE">Tự Hào VN (Rare)</option>
                    <option value="GLOBAL">Vươn Tầm (Rare)</option>
                    <option value="WAR">Chiến Tranh (Epic)</option>
                    <option value="TERRORIST">Sự Cố An Ninh (Mythic)</option>
                  </select>
                  <button
                    onClick={handleAdminAwardPowerupSubmit}
                    disabled={!adjustTargetId || !adminAwardCardCode}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition shrink-0"
                  >
                    Tặng
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Live Settings (admin only, during PLAYING) */}
          {isAdmin && room?.status === 'PLAYING' && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Cài đặt vòng đấu (Trực tiếp)</h4>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Số vòng tối đa (tối thiểu: {room.currentRound + 1})
                </label>
                <input
                  type="number"
                  min={room.currentRound + 1}
                  value={liveMaxRounds}
                  onChange={(e) => setLiveMaxRounds(parseInt(e.target.value) || room.currentRound + 1)}
                  className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white outline-none"
                />
                <p className="text-[9px] text-gray-500 mt-0.5">Hiện tại: vòng {room.currentRound}/{room.maxRounds}</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Thời gian mỗi vòng (giây)</label>
                <input
                  type="number"
                  min={10}
                  value={liveRoundDuration}
                  onChange={(e) => setLiveRoundDuration(parseInt(e.target.value) || 10)}
                  className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white outline-none"
                />
                <p className="text-[9px] text-gray-500 mt-0.5">Tối thiểu 10 giây</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Thời gian tổng kết (giây)</label>
                <input
                  type="number"
                  min={3}
                  value={liveSummaryDuration}
                  onChange={(e) => setLiveSummaryDuration(parseInt(e.target.value) || 3)}
                  className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white outline-none"
                />
                <p className="text-[9px] text-gray-500 mt-0.5">Tối thiểu 3 giây</p>
              </div>

              <button
                onClick={handleApplyLiveSettings}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center space-x-1"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span>Áp dụng cài đặt</span>
              </button>
            </div>
          )}

          {/* Live Scores Table (Acts as targeting selector when targetingCardCode is active) */}
          <div className={`border rounded-xl overflow-hidden transition-all ${
            targetingCardCode
              ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
              : 'border-white/10'
          }`}>
            <div className="bg-white/5 border-b border-white/10 px-3 py-2 flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {targetingCardCode ? '🎯 Nhấp vào hàng để CHỌN MỤC TIÊU' : 'Bảng xếp hạng trực tiếp'}
              </span>
              {targetingCardCode && (
                <button
                  onClick={() => setTargetingCardCode(null)}
                  className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded hover:bg-red-500/30 transition uppercase font-bold"
                >
                  Hủy
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[360px]">
                <thead>
                  <tr className="text-gray-400 uppercase tracking-widest text-[9px] border-b border-white/10">
                    <th className="p-2">Người chơi</th>
                    <th className="p-2">Vai</th>
                    <th className="p-2">Vốn</th>
                    <th className="p-2">HS</th>
                    <th className="p-2">Tổng</th>
                    <th className="p-2">ST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activePlayers.map((p) => {
                    const isSelf = p.id === player?.id;
                    
                    // Card-specific targeting validation matching backend rules
                    let isRoleMatch = true;
                    if (targetingCardCode) {
                      if (targetingCardCode === PowerupType.INFLUENCER) {
                        isRoleMatch = p.role === EconomicRole.POE || p.role === EconomicRole.COOP || p.role === EconomicRole.HOUSEHOLD;
                      } else if (targetingCardCode === PowerupType.USA_TAX) {
                        isRoleMatch = p.role === EconomicRole.FDI || p.role === EconomicRole.POE;
                      } else if (targetingCardCode === PowerupType.FDI_FLUX) {
                        isRoleMatch = p.role === EconomicRole.FDI;
                      }
                    }
                    
                    // A player is targetable if we're in targeting mode, they have a role (playing), matches the card criteria, and isn't self.
                    const isTargetable = !!(
                      targetingCardCode &&
                      p.role &&
                      isRoleMatch &&
                      !isSelf
                    );
                    return (
                      <tr
                        key={p.id}
                        onClick={() => {
                          if (isAdmin) {
                            setAdjustTargetId(p.id);
                          } else if (isTargetable) {
                            handleLeaderboardTargetSelect(p.id);
                          }
                        }}
                        className={`transition-colors ${
                          isAdmin
                            ? p.id === adjustTargetId
                              ? 'bg-green-500/10 border-l-2 border-green-500 cursor-pointer'
                              : 'hover:bg-white/[0.02] cursor-pointer'
                            : isTargetable
                            ? 'hover:bg-purple-500/10 cursor-pointer bg-purple-500/5 animate-pulse'
                            : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <td className="p-2 font-semibold">
                          {p.username}
                          {p.isAdmin && <span className="text-[8px] text-red-400 font-bold ml-1">(Admin)</span>}
                        </td>
                        <td className="p-2 text-[9px] uppercase font-mono text-gray-400">{p.role || '—'}</td>
                        <td className="p-2 text-yellow-400 font-bold">{p.capital.toFixed(1)}</td>
                        <td className="p-2 text-green-400 font-mono text-[10px]">x{p.capitalMultiplier.toFixed(1)}</td>
                        <td className="p-2 text-red-400 font-bold">{p.totalScore.toFixed(1)}</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${p.isOnline ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                            {p.isOnline ? '●' : '○'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Admin Actions */}
          {isAdmin && (
            <div className="space-y-2 pb-4">
              <button
                onClick={adminNextRound}
                className="w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold rounded-xl transition text-yellow-400"
              >
                ⏭ Bỏ qua đếm ngược & Tính kết quả vòng
              </button>

              <button
                onClick={() => setShowEndConfirm(true)}
                className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition uppercase tracking-wider shadow-lg"
              >
                🛑 Kết Thúc Game Ngay Lập Tức
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ============================================================ */}
      {/* HELP MODAL */}
      {/* ============================================================ */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="backdrop-blur-md bg-[#111625] border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <div className="flex items-center space-x-2 text-blue-400">
                <BookOpen className="w-5 h-5" />
                <h3 className="text-lg font-black uppercase tracking-wider">Luật Chơi & Công Thức MLN122</h3>
              </div>
              <button onClick={() => setShowHelp(false)} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs Row */}
            <div className="flex space-x-2 border-b border-white/5 pb-2 shrink-0">
              <button
                onClick={() => setHelpTab('rules')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                  helpTab === 'rules'
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Luật & Công Thức
              </button>
              <button
                onClick={() => setHelpTab('lessons')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                  helpTab === 'lessons'
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Lớp học vĩ mô 🎓
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-gray-300 scrollbar-thin">
              {helpTab === 'rules' ? (
                <>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed">
                    <strong className="text-yellow-400 block mb-1">Cách tính điểm chiến thắng:</strong>
                    <div className="font-mono text-[10px] text-gray-300 bg-black/45 p-2 rounded mt-2 text-center border border-white/5">
                      Final Score = (Vốn / 10) + Điểm Lao Động + Điểm Đóng Góp Xã Hội + Điểm Phúc Lợi + Điểm Thưởng Bền Vững
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-gray-300 block">Các thành phần kinh tế (6 Vai trò):</span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px]">
                      <div className="bg-purple-500/5 p-2 rounded border border-purple-500/10"><strong className="text-purple-400">FDI (120.0 vốn):</strong> Doanh nghiệp ngoại, vốn lớn.</div>
                      <div className="bg-red-500/5 p-2 rounded border border-red-500/10"><strong className="text-red-400">SOE (100.0 vốn):</strong> Quốc doanh, vai trò chủ đạo.</div>
                      <div className="bg-blue-500/5 p-2 rounded border border-blue-500/10"><strong className="text-blue-400">POE (90.0 vốn):</strong> Doanh nghiệp tư nhân trong nước.</div>
                      <div className="bg-green-500/5 p-2 rounded border border-green-500/10"><strong className="text-green-400">COOP (80.0 vốn):</strong> Hợp tác xã, sở hữu tập thể.</div>
                      <div className="bg-yellow-500/5 p-2 rounded border border-yellow-500/10"><strong className="text-yellow-400">Hộ cá thể (70.0):</strong> Kinh tế gia đình tự chủ.</div>
                      <div className="bg-orange-500/5 p-2 rounded border border-orange-500/10"><strong className="text-orange-400">Lao động (50.0):</strong> Nhận lương, không có tư liệu.</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-gray-300 block">Công thức các hành động:</span>
                    <div className="space-y-2 text-[11px] text-gray-400">
                      <div className="bg-black/20 p-2.5 rounded border border-white/5">
                        <strong className="text-white">PRODUCE (Sản xuất):</strong><br />
                        • Lao động: <span className="text-green-400">+15.0 Vốn</span> (lương), <span className="text-green-400">+2.0 Điểm Lao động</span>.<br />
                        • Khác: <span className="text-green-400">+(20.0 x Hiệu suất) Vốn</span>. Phải đóng thuế tương ứng.
                      </div>
                      <div className="bg-black/20 p-2.5 rounded border border-white/5">
                        <strong className="text-white">INVEST (Đầu tư):</strong><br />
                        • Lao động: Tốn <span className="text-red-400">-15.0 Vốn</span>, tăng vĩnh viễn <span className="text-green-400">+20% Hiệu suất</span>.<br />
                        • Khác: Tốn <span className="text-red-400">-30.0 Vốn</span> (hoặc <span className="text-red-400">-40.0</span> nếu đang chiến tranh), tăng vĩnh viễn <span className="text-green-400">+30% Hiệu suất</span>.
                      </div>
                      <div className="bg-black/20 p-2.5 rounded border border-white/5">
                        <strong className="text-white">WELFARE (Phúc lợi):</strong><br />
                        • Lao động: Nhận trợ cấp <span className="text-green-400">+15.0 Vốn</span>, <span className="text-green-400">+1.0 Điểm Phúc lợi</span>.<br />
                        • Khác: Tốn vốn (<span className="text-red-400">-10.0</span> tới <span className="text-red-400">-20.0</span>), tăng <span className="text-green-400">+2.0 / +3.0 Điểm Xã hội</span>.
                      </div>
                      <div className="bg-black/20 p-2.5 rounded border border-white/5">
                        <strong className="text-white">OPTIMIZE (Tối ưu chi phí):</strong><br />
                        • Lao động: Tăng ca nhận <span className="text-green-400">+5.0 Vốn</span>, bị trừ <span className="text-red-400">-1.0 Điểm Xã hội</span>.<br />
                        • Khác: Tăng mạnh vốn (<span className="text-green-400">COOP +20.0</span>, <span className="text-green-400">DN +35.0</span>) nhưng bị phạt <span className="text-red-400">-1.0 / -2.0 Điểm Xã hội</span>.
                      </div>
                      <div className="bg-black/20 p-2.5 rounded border border-white/5">
                        <strong className="text-white">SOCIAL (Từ thiện):</strong><br />
                        • Tốn vốn nhỏ (<span className="text-red-400">-4.0</span> tới <span className="text-red-400">-15.0</span>), tăng mạnh <span className="text-green-400">+2.0 / +3.0 Điểm Đóng góp Xã hội</span>.
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="font-bold text-gray-300 block flex items-center">
                      <Zap className="w-4 h-4 mr-1 text-purple-400" />
                      Hệ Thống Thẻ Bài Quyền Lực (Powerups):
                    </span>
                    
                    <div className="bg-[#161a29]/95 border border-purple-500/20 p-3.5 rounded-xl space-y-3">
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        • <strong>Quy tắc rút thẻ:</strong> Cuối mỗi vòng đấu, mỗi người chơi có <strong>35% cơ hội</strong> rút ngẫu nhiên 1 thẻ bài kinh tế (không áp dụng ở vòng cuối).<br />
                        • <strong>Giới hạn kho bài:</strong> Kho tối đa chứa <strong>3 thẻ</strong>. Nếu nhận thẻ thứ 4, giao diện <strong>Trao Đổi/Hủy (Swap/Discard)</strong> sẽ xuất hiện để bạn chọn thay thế thẻ cũ hoặc bỏ thẻ mới.<br />
                        • <strong>Điều kiện kích hoạt:</strong> Một số thẻ có thể kích hoạt trực tiếp lên bản thân (Self), một số thẻ yêu cầu chọn mục tiêu cụ thể trên <strong>Bảng Xếp Hạng Trực Tiếp</strong> (Targeted).
                      </p>

                      <div className="border-t border-white/5 pt-2.5 space-y-2">
                        <strong className="text-yellow-400 block text-[11px] uppercase tracking-wider">Cơ chế phòng thủ Bị Động (Lá Chắn - SHIELD):</strong>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          • <strong>Lá Chắn (SHIELD)</strong> là thẻ bài <strong>bị động (passive)</strong>, không thể chủ động nhấn sử dụng.<br />
                          • Khi bạn bị nhắm mục tiêu bởi một thẻ hại (<span className="text-red-400">Thuế Mỹ</span>, <span className="text-red-400">FDI Rút Vốn</span>, hoặc <span className="text-red-400">Sự Cố An Ninh</span>), hệ thống sẽ <strong>tự động tiêu thụ 1 thẻ Lá Chắn</strong> trong kho của bạn.<br />
                          • Khi kích hoạt, Lá Chắn sẽ <strong>giảm 50% toàn bộ thiệt hại/phạt vốn hoặc hiệu suất</strong> do thẻ đó gây ra.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-[11px]">
                      <div className="bg-black/25 p-2.5 rounded border border-white/5 space-y-1">
                        <div className="flex justify-between items-center">
                          <strong className="text-white">🚀 Bắt Trend (TREND_CATCH)</strong>
                          <span className="text-[9px] text-gray-400 px-1.5 py-0.5 rounded bg-white/5 font-mono">Tự kích hoạt | Common (50%)</span>
                        </div>
                        <p className="text-gray-400">Tăng vĩnh viễn <span className="text-green-400">+0.5 Hệ số sản xuất</span> cho bản thân.</p>
                      </div>

                      <div className="bg-black/25 p-2.5 rounded border border-white/5 space-y-1">
                        <div className="flex justify-between items-center">
                          <strong className="text-white">📣 Sóng KOLs (INFLUENCER)</strong>
                          <span className="text-[9px] text-gray-400 px-1.5 py-0.5 rounded bg-white/5 font-mono">Chọn mục tiêu | Common (50%)</span>
                        </div>
                        <p className="text-gray-400">Nhắm vào 1 người chơi thuộc nhóm <strong>POE, COOP, hoặc Hộ cá thể</strong>. Cộng ngay <span className="text-green-400">+20.0 Vốn</span> và <span className="text-green-400">+1.0 Điểm Đóng góp Xã hội</span> cho họ.</p>
                      </div>

                      <div className="bg-black/25 p-2.5 rounded border border-white/5 space-y-1">
                        <div className="flex justify-between items-center">
                          <strong className="text-white">🛡️ Vượt Khó (HARDSHIP)</strong>
                          <span className="text-[9px] text-gray-400 px-1.5 py-0.5 rounded bg-white/5 font-mono">Tự kích hoạt | Common (50%)</span>
                        </div>
                        <p className="text-gray-400">Nhận <span className="text-green-400">+2.0 Điểm Phúc lợi</span>. Nếu Vốn hiện tại dưới 50.0, bảo hiểm tự động khôi phục sàn vốn của bạn về đúng <span className="text-green-400">50.0</span>.</p>
                      </div>

                      <div className="bg-black/25 p-2.5 rounded border border-white/5 space-y-1">
                        <div className="flex justify-between items-center">
                          <strong className="text-white">🛡️ Lá Chắn (SHIELD)</strong>
                          <span className="text-[9px] text-purple-400 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 font-mono font-bold">Bị động tự động | Rare (25%)</span>
                        </div>
                        <p className="text-gray-400">Tự động tiêu thụ khi bị người khác tấn công để cản 50% sát thương nhận vào.</p>
                      </div>

                      <div className="bg-black/25 p-2.5 rounded border border-white/5 space-y-1">
                        <div className="flex justify-between items-center">
                          <strong className="text-white">🇺🇸 Thuế Mỹ (USA_TAX)</strong>
                          <span className="text-[9px] text-red-400 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 font-mono font-bold">Chọn mục tiêu | Rare (25%)</span>
                        </div>
                        <p className="text-gray-400">Tấn công nhắm vào <strong>FDI hoặc POE</strong>. Trực tiếp cắt giảm <span className="text-red-400">-40% tổng số Vốn hiện có</span> của mục tiêu (chùi mất 20% nếu đối thủ có Lá Chắn).</p>
                      </div>

                      <div className="bg-black/25 p-2.5 rounded border border-white/5 space-y-1">
                        <div className="flex justify-between items-center">
                          <strong className="text-white">📉 FDI Rút Vốn (FDI_FLUX)</strong>
                          <span className="text-[9px] text-red-400 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 font-mono font-bold">Chọn mục tiêu | Rare (25%)</span>
                        </div>
                        <p className="text-gray-400">Tấn công chỉ nhắm được vào <strong>FDI</strong>. Trừ ngay <span className="text-red-400">-15.0 Vốn</span> và <span className="text-red-400">-0.2 Hệ số sản xuất</span> (giảm một nửa nếu có Lá Chắn).</p>
                      </div>

                      <div className="bg-black/25 p-2.5 rounded border border-white/5 space-y-1">
                        <div className="flex justify-between items-center">
                          <strong className="text-white">🇻🇳 Tự Hào VN (PRIDE)</strong>
                          <span className="text-[9px] text-gray-400 px-1.5 py-0.5 rounded bg-white/5 font-mono">Tự kích hoạt | Rare (25%)</span>
                        </div>
                        <p className="text-gray-400">Cộng ngay <span className="text-green-400">+10.0 Vốn</span> và <span className="text-green-400">+1.0 Điểm Xã hội</span> cho toàn bộ người chơi nội địa (SOE, POE, COOP, Hộ cá thể, Lao động) trong phòng.</p>
                      </div>

                      <div className="bg-black/25 p-2.5 rounded border border-white/5 space-y-1">
                        <div className="flex justify-between items-center">
                          <strong className="text-white">🌍 Vươn Tầm (GLOBAL)</strong>
                          <span className="text-[9px] text-gray-400 px-1.5 py-0.5 rounded bg-white/5 font-mono">Tự kích hoạt | Rare (25%)</span>
                        </div>
                        <p className="text-gray-400">Không thể dùng bởi Lao Động. Cộng ngay <span className="text-green-400">+0.3 Hệ số sản xuất</span> và <span className="text-green-400">+5.0 Điểm tổng kết vĩnh viễn</span>.</p>
                      </div>

                      <div className="bg-black/25 p-2.5 rounded border border-white/5 space-y-1">
                        <div className="flex justify-between items-center">
                          <strong className="text-white">⚔️ Chiến Tranh (WAR)</strong>
                          <span className="text-[9px] text-orange-400 px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 font-mono font-bold">Toàn phòng | Epic (9%)</span>
                        </div>
                        <p className="text-gray-400">Tất cả người chơi bị trừ <span className="text-red-400">-10.0 Vốn</span>. Kích hoạt trạng thái chiến tranh vĩ mô: Tăng giá của lệnh INVEST thêm <span className="text-red-400">+10.0 Vốn</span> cho phần còn lại của trận đấu.</p>
                      </div>

                      <div className="bg-black/25 p-2.5 rounded border border-white/5 space-y-1">
                        <div className="flex justify-between items-center">
                          <strong className="text-white">⚠️ Sự Cố An Ninh (TERRORIST)</strong>
                          <span className="text-[9px] text-red-500 px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/30 font-mono font-black animate-pulse">Chọn mục tiêu | Mythic (1%)</span>
                        </div>
                        <p className="text-gray-400">Tấn công cực mạnh vào bất kỳ đối thủ nào. Trực tiếp tiêu diệt <span className="text-red-400">-50% tổng số Vốn tích lũy</span> của họ (chỉ mất 25% nếu đối thủ có Lá Chắn).</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-5">
                  <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20 space-y-2">
                    <h4 className="text-sm font-bold text-blue-400 flex items-center">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Chủ Đề 1: Thuế Luỹ Tiến (Progressive Tax) vs Kích Cầu Thuế (Stimulus)
                    </h4>
                    <p className="leading-relaxed text-[11px] text-gray-300">
                      • <strong>Thuế Luỹ Tiến (Progressive Tax):</strong> Thuế suất tăng dần theo mức thu nhập/vốn. Trong trò chơi, khi chính sách này có hiệu lực, người chơi có tích lũy vốn càng lớn (như FDI, SOE) sẽ phải chịu mức thuế suất cao hơn đáng kể khi dùng lệnh <strong>PRODUCE</strong>. Điều này giúp tăng ngân sách Nhà nước nhanh chóng để chi cho đầu công, đồng thời thu hẹp khoảng cách giàu nghèo (bảo vệ các hộ cá thể, lao động nghèo).<br />
                      • <strong>Kích Cầu Thuế (Stimulus):</strong> Giảm thuế đồng loạt hoặc hoàn thuế để kích thích sản xuất kinh doanh. Khi chính sách này có hiệu lực, thuế suất sản xuất giảm mạnh về mức cố định thấp (10% - 15%), giúp các doanh nghiệp bảo toàn vốn để tái đầu tư mở rộng sản xuất (INVEST). Tuy nhiên, ngân sách quốc gia sẽ tăng trưởng chậm hơn.
                    </p>
                  </div>

                  <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/20 space-y-2">
                    <h4 className="text-sm font-bold text-red-400 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Chủ Đề 2: Khủng Hoảng Kinh Tế (Crisis) & Thiên Tai (Disaster)
                    </h4>
                    <p className="leading-relaxed text-[11px] text-gray-300">
                      • <strong>Khủng hoảng toàn cầu (Global Crisis):</strong> Là sự suy giảm hoạt động kinh tế trên toàn thế giới, biểu hiện qua lạm phát tăng cao, lãi suất leo thang và thắt chặt tiền tệ. Các doanh nghiệp phụ thuộc dòng vốn quốc tế (FDI) chịu tổn thất nặng nhất (-25% vốn), tiếp đến là doanh nghiệp nội địa.<br />
                      • <strong>Thiên tai & Dịch bệnh (Disaster):</strong> Tác động bất khả kháng phá hủy trực tiếp các nhà máy, chuỗi cung ứng sản xuất vật lý Gây thiệt hại nặng cho doanh nghiệp nội địa (POE -20% vốn) và nông nghiệp tập thể.<br />
                      • <strong>Giải pháp chống chịu vĩ mô (Welfare & Social Score):</strong> Những chủ thể tích cực đóng góp vào quỹ phúc lợi xã hội (điểm Phúc lợi + điểm Xã hội ≥ 5.0) sẽ nhận được sự hỗ trợ/đồng lòng từ người dân và Nhà nước, qua đó <strong>được giảm 50% toàn bộ thiệt hại vốn</strong> khi các biến cố này xảy ra.
                    </p>
                  </div>

                  <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/20 space-y-2">
                    <h4 className="text-sm font-bold text-green-400 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Chủ Đề 3: Hợp Tác Liên Doanh (Joint Venture) & Hiệu Ứng Quy Mô
                    </h4>
                    <p className="leading-relaxed text-[11px] text-gray-300">
                      • <strong>Liên doanh (Joint Venture):</strong> Hình thức hợp tác giữa các thực thể kinh tế nhằm gộp chung nguồn lực sản xuất, tối ưu hóa công nghệ và chia sẻ rủi ro. Trong trò chơi, hai người chơi liên doanh sẽ được <strong>cộng gộp Hiệu Suất Sản Xuất</strong> của cả hai để tạo ra tổng sản lượng cực lớn khi làm lệnh <strong>PRODUCE</strong>, sau đó phân chia doanh thu theo tỷ lệ đã thỏa thuận trước (50/50, 60/40, 70/30). Đây là chìa khóa để các doanh nghiệp nhỏ bứt phá hiệu suất sản xuất.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setShowHelp(false)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition text-xs uppercase">
              Đồng ý
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* END GAME CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="backdrop-blur-md bg-[#111625] border border-red-500/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-7 h-7 text-red-500 shrink-0" />
              <h3 className="text-base font-black text-red-400 uppercase tracking-wider">Xác nhận kết thúc?</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Bạn có chắc chắn muốn <strong className="text-red-400">kết thúc game ngay bây giờ</strong>? Tất cả người chơi sẽ thấy bảng xếp hạng và không thể tiếp tục trận đấu.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold rounded-xl text-xs transition"
              >
                Hủy
              </button>
              <button
                onClick={() => { adminForceEndGame(); setShowEndConfirm(false); }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition"
              >
                Xác nhận kết thúc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* FULL INVENTORY SWAP MODAL */}
      {/* ============================================================ */}
      {player?.pendingPowerup && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="backdrop-blur-md bg-[#111625] border border-purple-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-purple-400">
              <Zap className="w-6 h-6 animate-pulse" />
              <h3 className="text-sm font-black uppercase tracking-wider">Kho thẻ bài đã đầy! (Tối đa 3)</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Bạn vừa nhận thêm thẻ <strong>{getPowerupInfo(player.pendingPowerup).name}</strong>, nhưng kho chỉ chứa được tối đa 3 thẻ. Hãy chọn bỏ thẻ bài này hoặc chọn một thẻ cũ để trao đổi.
            </p>

            {/* Display newly drawn card */}
            <div className="bg-purple-950/20 border border-purple-500/20 p-3 rounded-xl">
              <span className="text-[9px] uppercase tracking-widest text-purple-400 font-bold block mb-1">Thẻ bài mới nhận</span>
              <strong className="text-xs text-white">{getPowerupInfo(player.pendingPowerup).name}</strong>
              <p className="text-[10px] text-gray-400 mt-1">{getPowerupInfo(player.pendingPowerup).desc}</p>
            </div>

            {/* Existing inventory options */}
            <div className="space-y-2">
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block">Chọn thẻ cũ muốn thay thế</span>
              {player.powerups && player.powerups.map((code, idx) => (
                <button
                  key={idx}
                  onClick={() => setSwapSelectedIdx(idx)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all ${
                    swapSelectedIdx === idx
                      ? 'border-purple-500 bg-purple-500/10 font-bold'
                      : 'border-white/5 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{idx + 1}. {getPowerupInfo(code).name}</span>
                    {swapSelectedIdx === idx && <span className="text-purple-400 text-[10px]">Đổi thẻ này</span>}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-normal">{getPowerupInfo(code).desc}</p>
                </button>
              ))}
            </div>

            {/* Swap & Discard Controls */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => resolvePendingPowerup('discard')}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 font-bold rounded-xl text-xs transition uppercase"
              >
                Hủy thẻ bài mới
              </button>
              <button
                onClick={() => resolvePendingPowerup('swap', swapSelectedIdx)}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition uppercase shadow-lg shadow-purple-600/20"
              >
                Đồng ý trao đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ROUND RESULTS OVERLAY */}
      {/* ============================================================ */}
      {results && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="backdrop-blur-md bg-[#111625] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-yellow-400 flex items-center">
              <Info className="w-5 h-5 mr-2 text-yellow-400" /> Kết Quả Vòng Chơi {room?.currentRound ? room.currentRound - 1 : ''}
            </h3>

            <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5 text-sm max-h-[300px] overflow-y-auto">
              {Object.values(results).map((res) => (
                <div key={res.playerId} className="py-2 border-b border-white/5 last:border-0">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs">{res.username} <span className="text-[10px] text-gray-400">({res.role})</span></span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 uppercase font-semibold text-gray-400">{res.actionType}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1.5 text-[11px] text-gray-400">
                    <div>
                      Biến động vốn:{' '}
                      <span className={res.capitalChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {res.capitalChange >= 0 ? `+${res.capitalChange}` : res.capitalChange}
                      </span>
                    </div>
                    <div>Thuế đã đóng: <span className="text-red-400">{res.taxPaid}</span></div>
                    {res.welfareReceived > 0 && (
                      <div className="text-yellow-400 col-span-2">Nhận trợ cấp phúc lợi: +{res.welfareReceived} từ Nhà nước</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Trò chơi sẽ tự động chuyển sang vòng tiếp theo khi đếm ngược kết thúc...
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ADMIN CARD TARGETING LEADERBOARD POPUP                       */}
      {/* ============================================================ */}
      {isAdmin && targetingCardCode && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="backdrop-blur-md bg-[#111625] border border-purple-500/30 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <div className="flex items-center space-x-2 text-purple-400">
                <Zap className="w-5 h-5 animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-wider">
                  🎯 Chọn Mục Tiêu: {getPowerupInfo(targetingCardCode).name}
                </h3>
              </div>
              <button 
                onClick={() => setTargetingCardCode(null)} 
                className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Hãy chọn 1 người chơi từ danh sách dưới đây làm mục tiêu cho thẻ bài:
            </p>

            <div className="flex-1 overflow-y-auto border border-purple-500/20 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs min-w-[360px]">
                <thead>
                  <tr className="text-gray-400 uppercase tracking-widest text-[9px] border-b border-white/10 bg-white/5">
                    <th className="p-3">Người chơi</th>
                    <th className="p-3">Vai</th>
                    <th className="p-3">Vốn</th>
                    <th className="p-3">HS</th>
                    <th className="p-3">Tổng</th>
                    <th className="p-3">ST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activePlayers.map((p) => {
                    const isSelf = p.id === player?.id;
                    let isRoleMatch = true;
                    if (targetingCardCode) {
                      if (targetingCardCode === PowerupType.INFLUENCER) {
                        isRoleMatch = p.role === EconomicRole.POE || p.role === EconomicRole.COOP || p.role === EconomicRole.HOUSEHOLD;
                      } else if (targetingCardCode === PowerupType.USA_TAX) {
                        isRoleMatch = p.role === EconomicRole.FDI || p.role === EconomicRole.POE;
                      } else if (targetingCardCode === PowerupType.FDI_FLUX) {
                        isRoleMatch = p.role === EconomicRole.FDI;
                      }
                    }
                    const isTargetable = !!(
                      p.role &&
                      isRoleMatch &&
                      !isSelf
                    );

                    return (
                      <tr
                        key={p.id}
                        onClick={() => {
                          if (isTargetable) {
                            handleLeaderboardTargetSelect(p.id);
                          }
                        }}
                        className={`transition-colors ${
                          isTargetable
                            ? 'hover:bg-purple-500/10 cursor-pointer bg-purple-500/5 animate-pulse text-purple-200'
                            : 'opacity-40 bg-black/10'
                        }`}
                      >
                        <td className="p-3 font-semibold">
                          {p.username}
                          {p.isAdmin && <span className="text-[8px] text-red-400 font-bold ml-1">(Admin)</span>}
                        </td>
                        <td className="p-3 text-[9px] uppercase font-mono text-gray-400">{p.role || '—'}</td>
                        <td className="p-3 text-yellow-400 font-bold">{p.capital.toFixed(1)}</td>
                        <td className="p-3 text-green-400 font-mono text-[10px]">x{p.capitalMultiplier.toFixed(1)}</td>
                        <td className="p-3 text-red-400 font-bold">{p.totalScore.toFixed(1)}</td>
                        <td className="p-3">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${p.isOnline ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                            {p.isOnline ? '●' : '○'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button 
              onClick={() => setTargetingCardCode(null)} 
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold rounded-xl transition text-xs uppercase"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Live Market Chart */}
      <MarketChart />

      {/* Macro Event Popup */}
      <EventPopup />

      {/* Voting Overlay */}
      <VotingOverlay />

      {/* Lesson Takeaway Drawer */}
      <LessonDrawer />
    </div>
  );
};