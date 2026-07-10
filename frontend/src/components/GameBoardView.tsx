import React, { useState, useEffect } from 'react';
import { useGame } from '../context/SocketContext';
import { ActionType, EconomicRole } from '@ecorace/shared';
import {
  Shield, Sparkles, TrendingUp, Heart, Share2, Award, Info, Users,
  Clock, Landmark, BookOpen, X, ShieldAlert, Eye, ChevronRight,
} from 'lucide-react';

export const GameBoardView: React.FC = () => {
  const { room, player, submitAction, results, adminNextRound, adminAdjustPoints, adminForceEndGame } = useGame();
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);

  // Dynamic timer bound to room duration
  const defaultDuration = room?.roundDuration || 40;
  const [timeLeft, setTimeLeft] = useState(defaultDuration);

  // Modals
  const [showHelp, setShowHelp] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Admin adjust state
  const [adjustTargetId, setAdjustTargetId] = useState<string>('');
  const [capitalDelta, setCapitalDelta] = useState<number>(10);
  const [scoreDelta, setScoreDelta] = useState<number>(1);

  // Derived flags
  const isAdmin = player?.isAdmin ?? false;
  const isOrchestrator = isAdmin && (room?.spectatorMode ?? false);

  // Synchronize timer countdown when round shifts
  useEffect(() => {
    setTimeLeft(defaultDuration);
    setSelectedAction(null);
  }, [room?.currentRound, defaultDuration]);

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
    switch (action) {
      case ActionType.PRODUCE:
        return { title: 'Sản xuất / Làm việc', desc: 'Tập trung sản xuất tạo ra doanh thu trực tiếp dựa trên hệ số nhân năng suất hiện tại.', effects: player?.role === EconomicRole.WORKER ? 'Vốn: +15.0, Điểm lao động: +2.0' : `Vốn: +${(20 * (player?.capitalMultiplier || 1.0)).toFixed(1)}, Đóng thuế`, icon: <TrendingUp className="w-5 h-5 text-green-400" /> };
      case ActionType.INVEST:
        return { title: 'Đầu tư mở rộng', desc: 'Chi tiền mua thiết bị hoặc đào tạo kỹ năng để tăng vĩnh viễn hệ số nhân năng suất cho các vòng sau.', effects: player?.role === EconomicRole.WORKER ? 'Vốn: -15.0, Năng suất: +20%' : 'Vốn: -30.0, Năng suất: +30%', icon: <Sparkles className="w-5 h-5 text-yellow-400" /> };
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
                  {selectedAction && (
                    <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-lg animate-pulse">Đã khóa hành động</span>
                  )}
                </div>

                <div className="space-y-3">
                  {[ActionType.PRODUCE, ActionType.INVEST, ActionType.WELFARE, ActionType.OPTIMIZE, ActionType.SOCIAL].map((act) => {
                    const details = getActionDetails(act);
                    if (!details) return null;
                    const isThisSelected = selectedAction === act;
                    return (
                      <button
                        key={act}
                        onClick={() => handleActionSelect(act)}
                        disabled={!!selectedAction}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          isThisSelected ? 'border-red-500 bg-red-950/20 shadow-lg'
                          : selectedAction ? 'border-white/5 opacity-40 cursor-not-allowed'
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
      {isAdmin && (
        <aside className="w-full lg:w-[400px] xl:w-[440px] shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#0d1120] flex flex-col overflow-y-auto">

          {/* Panel Header */}
          <div className="sticky top-0 bg-[#0d1120] border-b border-white/10 p-4 flex items-center space-x-2 z-10">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <span className="text-sm font-black uppercase tracking-wider text-red-400 block">Admin Control Board</span>
              <span className="text-[10px] text-gray-500">
                {isOrchestrator ? 'Orchestrator – Quan sát' : 'Người chơi + Admin'}
              </span>
            </div>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto">

            {/* Quick Adjust Panel */}
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
            </div>

            {/* Live Scores Table */}
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <div className="bg-white/5 border-b border-white/10 px-3 py-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Bảng điểm trực tiếp</span>
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
                    {activePlayers.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02]">
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Admin Actions */}
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
          </div>
        </aside>
      )}

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

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-gray-300 scrollbar-thin">
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
                    • Khác: Tốn <span className="text-red-400">-30.0 Vốn</span>, tăng vĩnh viễn <span className="text-green-400">+30% Hiệu suất</span>.
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

              <div className="space-y-2">
                <span className="font-bold text-gray-300 block">Điều tiết Vĩ mô (Thuế & Trợ cấp):</span>
                <ul className="list-disc pl-4 space-y-1 text-gray-400">
                  <li><strong className="text-white">Thuế lũy tiến:</strong> Lao động <span className="text-yellow-400">2%</span>, COOP/Hộ kinh doanh <span className="text-yellow-400">5%</span>, FDI/SOE/POE <span className="text-yellow-400">10-20%</span>.</li>
                  <li><strong className="text-white">Gói cứu trợ:</strong> Vốn dưới <span className="text-red-400">50.0</span> → ngân sách tự động cứu trợ <span className="text-green-400">+20.0 Vốn</span>.</li>
                  <li><strong className="text-white">Đầu tư hạ tầng:</strong> Khi ngân sách đạt <span className="text-green-400">500.0</span>, tự động chi <span className="text-red-400">300.0</span> tăng <span className="text-green-400">+10% năng suất</span> toàn dân.</li>
                </ul>
              </div>
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
    </div>
  );
};