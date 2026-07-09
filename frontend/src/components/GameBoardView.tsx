import React, { useState, useEffect } from 'react';
import { useGame } from '../context/SocketContext';
import { ActionType, EconomicRole } from '@ecorace/shared';
import { Shield, Sparkles, TrendingUp, Heart, Share2, Award, Info, Users, Clock, Landmark } from 'lucide-react';

export const GameBoardView: React.FC = () => {
  const { room, player, submitAction, results, adminNextRound } = useGame();
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [timeLeft, setTimeLeft] = useState(40);

  // Synchronize timer countdown
  useEffect(() => {
    setTimeLeft(40);
    setSelectedAction(null);
  }, [room?.currentRound]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleActionSelect = (actionType: ActionType) => {
    if (selectedAction) return; // Prevent double submission
    setSelectedAction(actionType);
    submitAction(actionType);
  };

  const getRoleDetails = (role: EconomicRole | null) => {
    switch (role) {
      case EconomicRole.FDI:
        return {
          name: 'Doanh nghiệp FDI',
          ownership: 'Sở hữu nước ngoài',
          desc: 'Có tiềm lực tài chính lớn nhất, tập trung sản xuất quy mô lớn và tối ưu hóa chuỗi cung ứng toàn cầu.',
          color: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
        };
      case EconomicRole.SOE:
        return {
          name: 'Doanh nghiệp Nhà nước (SOE)',
          ownership: 'Sở hữu toàn dân (Nhà nước đại diện)',
          desc: 'Nắm giữ các lĩnh vực then chốt, gánh vác trách nhiệm xã hội lớn, đóng thuế tích lũy ngân sách quốc gia.',
          color: 'text-red-400 border-red-500/20 bg-red-500/5',
        };
      case EconomicRole.POE:
        return {
          name: 'Doanh nghiệp Tư nhân (POE)',
          ownership: 'Sở hữu tư nhân',
          desc: 'Năng động, cạnh tranh tự do trên thị trường để tìm kiếm lợi nhuận và mở rộng quy mô sản xuất.',
          color: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
        };
      case EconomicRole.COOP:
        return {
          name: 'Hợp tác xã (COOP)',
          ownership: 'Sở hữu tập thể',
          desc: 'Liên kết tương trợ giữa các thành viên, phân phối lợi ích dựa trên mức độ tham gia đóng góp và lao động.',
          color: 'text-green-400 border-green-500/20 bg-green-500/5',
        };
      case EconomicRole.HOUSEHOLD:
        return {
          name: 'Hộ kinh doanh cá thể',
          ownership: 'Sở hữu tư nhân nhỏ',
          desc: 'Kinh doanh gia đình, linh hoạt thích ứng với thị trường nhưng quy mô vốn hạn chế.',
          color: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5',
        };
      case EconomicRole.WORKER:
        return {
          name: 'Người lao động',
          ownership: 'Không có tư liệu sản xuất',
          desc: 'Bán sức lao động để nhận tiền lương. Đóng góp công sức tạo ra của cải vật chất cho xã hội.',
          color: 'text-orange-400 border-orange-500/20 bg-orange-500/5',
        };
      default:
        return {
          name: 'Chưa phân vai',
          ownership: 'Không xác định',
          desc: '',
          color: 'text-gray-400 border-gray-500/20 bg-gray-500/5',
        };
    }
  };

  const getActionDetails = (action: ActionType) => {
    switch (action) {
      case ActionType.PRODUCE:
        return {
          title: 'Sản xuất / Làm việc',
          desc: 'Tập trung sản xuất tạo ra doanh thu trực tiếp dựa trên hệ số nhân năng suất hiện tại.',
          effects: player?.role === EconomicRole.WORKER ? 'Vốn: +15, Điểm lao động: +2' : `Vốn: +${20 * (player?.capitalMultiplier || 1.0)}, Thuế áp dụng`,
          icon: <TrendingUp className="w-5 h-5 text-green-400" />,
        };
      case ActionType.INVEST:
        return {
          title: 'Đầu tư mở rộng',
          desc: 'Chi tiền mua thiết bị hoặc đào tạo kỹ năng để tăng vĩnh viễn hệ số nhân năng suất cho các vòng sau.',
          effects: player?.role === EconomicRole.WORKER ? 'Vốn: -15, Năng suất: +20%' : 'Vốn: -30, Năng suất: +30%',
          icon: <Sparkles className="w-5 h-5 text-yellow-400" />,
        };
      case ActionType.WELFARE:
        return {
          title: 'Tăng lương / Trợ cấp',
          desc: 'Chủ sở hữu hỗ trợ cải thiện đời sống người lao động hoặc tự tăng phúc lợi.',
          effects: player?.role === EconomicRole.WORKER ? 'Vốn: +15, Điểm phúc lợi: +1' : 'Chi phí vốn, Điểm đóng góp xã hội tăng mạnh',
          icon: <Heart className="w-5 h-5 text-red-400" />,
        };
      case ActionType.OPTIMIZE:
        return {
          title: 'Tối ưu hóa chi phí',
          desc: 'Cắt giảm bảo vệ môi trường, giảm phúc lợi nhân viên để thu lợi nhuận ngắn hạn cao nhất.',
          effects: 'Vốn tăng cực mạnh vòng này, Điểm đóng góp xã hội bị trừ',
          icon: <Shield className="w-5 h-5 text-orange-400" />,
        };
      case ActionType.SOCIAL:
        return {
          title: 'Đóng góp Quỹ xã hội',
          desc: 'Tự nguyện ủng hộ quỹ xóa đói giảm nghèo hoặc quỹ từ thiện công ích của cộng đồng.',
          effects: 'Chi phí vốn thấp, Điểm đóng góp xã hội tăng',
          icon: <Share2 className="w-5 h-5 text-blue-400" />,
        };
    }
  };

  const roleInfo = getRoleDetails(player?.role || null);
  const activePlayers = room?.players || [];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col p-4 md:p-6">
      {/* Header Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Landmark className="w-6 h-6 text-red-500" />
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
                Ngân Sách Nhà Nước
              </span>
              <span className="text-xl font-bold text-yellow-400">
                {room?.macroBudget?.toFixed(1) || '0.0'}
              </span>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-blue-400" />
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
                Vòng Chơi
              </span>
              <span className="text-xl font-bold">
                {room?.currentRound} / {room?.maxRounds}
              </span>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-green-400" />
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
                Người Chơi Online
              </span>
              <span className="text-xl font-bold">
                {activePlayers.filter(p => p.isOnline).length} / {activePlayers.length}
              </span>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div className="w-full">
            <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
              <span>Thời Gian Nhận Lệnh</span>
              <span className="text-red-400 font-bold">{timeLeft}s</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/10">
              <div
                className="bg-red-500 h-full transition-all duration-1000"
                style={{ width: `${(timeLeft / 40) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-stretch">
        {/* Left Side: Profile & Personal Variables */}
        <div className="lg:col-span-1 flex flex-col space-y-6">
          {/* Identity Card */}
          <div className={`border rounded-2xl p-5 relative overflow-hidden ${roleInfo.color}`}>
            <span className="absolute top-2 right-2 text-[9px] uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 font-bold">
              Vai Trò
            </span>
            <h2 className="text-2xl font-black tracking-tight">{roleInfo.name}</h2>
            <div className="text-xs text-gray-400 font-semibold mt-1">Sở hữu: {roleInfo.ownership}</div>
            <p className="text-xs text-gray-300 mt-4 leading-relaxed">{roleInfo.desc}</p>
          </div>

          {/* Capital & Scores */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 flex-1 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 border-b border-white/5 pb-2">
              Chỉ Số Cá Nhân
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 block font-semibold">Tích Lũy Vốn</span>
                <span className="text-2xl font-black text-yellow-300">{player?.capital?.toFixed(1)}</span>
              </div>
              <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 block font-semibold">Hiệu Suất Năng Suất</span>
                <span className="text-2xl font-black text-green-400">
                  {player?.capitalMultiplier ? `x${player.capitalMultiplier.toFixed(1)}` : 'x1.0'}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs font-semibold text-gray-300 flex items-center">
                  <Award className="w-4 h-4 mr-2 text-green-400" /> Điểm Lao Động
                </span>
                <span className="font-bold text-green-400">{player?.laborScore?.toFixed(1)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs font-semibold text-gray-300 flex items-center">
                  <Share2 className="w-4 h-4 mr-2 text-blue-400" /> Điểm Đóng Góp Xã Hội
                </span>
                <span className="font-bold text-blue-400">{player?.socialScore?.toFixed(1)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-xs font-semibold text-gray-300 flex items-center">
                  <Heart className="w-4 h-4 mr-2 text-red-400" /> Điểm Phúc Lợi / Trợ Cấp
                </span>
                <span className="font-bold text-red-400">{player?.welfareScore?.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Actions Dashboard */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          {/* Action selection */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 flex-1">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">
                Quyết Định Hành Động
              </h3>
              {selectedAction && (
                <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-lg animate-pulse">
                  Đã khóa hành động
                </span>
              )}
            </div>

            <div className="space-y-3">
              {[ActionType.PRODUCE, ActionType.INVEST, ActionType.WELFARE, ActionType.OPTIMIZE, ActionType.SOCIAL].map(
                (act) => {
                  const details = getActionDetails(act);
                  if (!details) return null;
                  const isThisSelected = selectedAction === act;
                  return (
                    <button
                      key={act}
                      onClick={() => handleActionSelect(act)}
                      disabled={!!selectedAction}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isThisSelected
                          ? 'border-red-500 bg-red-950/20 shadow-lg'
                          : selectedAction
                          ? 'border-white/5 opacity-40 cursor-not-allowed'
                          : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-black/30 rounded-lg">{details.icon}</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">{details.title}</span>
                            <span className="text-[10px] font-semibold text-yellow-400/90 tracking-wide uppercase px-2 py-0.5 bg-black/20 rounded">
                              {details.effects}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{details.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            {player?.isAdmin && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <button
                  onClick={adminNextRound}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold rounded-xl transition text-red-400"
                >
                  Admin: Bỏ qua đếm ngược & Tính kết quả vòng
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Round result overlay/modal if results exist */}
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
                    <span className="font-bold text-xs">
                      {res.username} <span className="text-[10px] text-gray-400">({res.role})</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 uppercase font-semibold text-gray-400">
                      {res.actionType}
                    </span>
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
                      <div className="text-yellow-400 col-span-2">
                        Nhận trợ cấp phúc lợi: +{res.welfareReceived} từ Nhà nước (vốn dưới 50)
                      </div>
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