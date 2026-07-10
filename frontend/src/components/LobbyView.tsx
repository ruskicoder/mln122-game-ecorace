import React, { useState, useEffect } from 'react';
import { useGame } from '../context/SocketContext';
import { Users, Play, Copy, LogOut, Settings, BookOpen, Calculator, Award } from 'lucide-react';

export const LobbyView: React.FC = () => {
  const { room, player, adminStartGame, adminUpdateSettings, adminSetSpectatorMode, leaveRoom, error } = useGame();
  
  // Local state for admin customization form inputs
  const [maxRounds, setMaxRounds] = useState(room?.maxRounds || 5);
  const [roundDuration, setRoundDuration] = useState(room?.roundDuration || 40);
  const [spectatorMode, setSpectatorMode] = useState(room?.spectatorMode ?? false);

  // Sync state if room changes
  useEffect(() => {
    if (room) {
      setMaxRounds(room.maxRounds);
      setRoundDuration(room.roundDuration);
      setSpectatorMode(room.spectatorMode ?? false);
    }
  }, [room?.maxRounds, room?.roundDuration, room?.spectatorMode]);

  const handleCopyCode = () => {
    if (room?.id) {
      navigator.clipboard.writeText(room.id);
      alert(`Đã sao chép mã phòng: ${room.id}`);
    }
  };

  const handleApplySettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (player?.isAdmin) {
      adminUpdateSettings(maxRounds, roundDuration, spectatorMode);
    }
  };

  const players = room?.players || [];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col items-center justify-start py-8 px-4 relative overflow-y-auto">
      {/* Dynamic Backgrounds */}
      <div className="absolute top-[10%] left-[10%] w-[50%] h-[50%] rounded-full bg-red-600/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] rounded-full bg-yellow-500/5 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-6xl z-10 flex flex-col space-y-6">
        {/* Header Bar */}
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div className="flex items-center space-x-3">
            <Users className="w-7 h-7 text-red-500" />
            <div>
              <span className="text-xl font-black uppercase tracking-wider block">Phòng Chờ Game</span>
              <span className="text-xs text-gray-400">Chờ người chơi chuẩn bị trước khi vào trận</span>
            </div>
          </div>
          <button
            onClick={leaveRoom}
            className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl transition text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Thoát phòng</span>
          </button>
        </div>

        {/* Main Content Grid: Left Column (Lobby & Config) | Right Column (Rules) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT SIDE (8 cols) - Lobby Info, Admin Settings, Players List */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            
            {/* Quick Stats & Room ID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 text-center flex flex-col justify-center items-center">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Mã Phòng</span>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-black tracking-widest text-yellow-400">{room?.id}</span>
                  <button
                    onClick={handleCopyCode}
                    className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition"
                    title="Sao chép mã phòng"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 text-center flex flex-col justify-center">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Số Lượng</span>
                <span className="text-2xl font-black text-blue-400">{players.length} / 50</span>
              </div>

              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 text-center flex flex-col justify-center">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Cấu Hình Trận</span>
                <span className="text-sm font-semibold text-gray-300">
                  {room?.maxRounds} Vòng | {room?.roundDuration}s / Lượt
                </span>
              </div>
            </div>

            {/* Admin Configuration Settings panel */}
            {player?.isAdmin && (
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
                  <Settings className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs uppercase tracking-widest font-bold text-gray-300">
                    Cấu Hình Phòng Chơi (Chỉ Admin/Giảng viên)
                  </span>
                </div>
                <form onSubmit={handleApplySettings} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 pl-1">
                      Tổng số vòng chơi
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={maxRounds}
                      onChange={(e) => setMaxRounds(parseInt(e.target.value) || 5)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl focus:border-red-500 text-white text-xs outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 pl-1">
                      Thời gian mỗi vòng (giây)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={roundDuration}
                      onChange={(e) => setRoundDuration(parseInt(e.target.value) || 40)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl focus:border-red-500 text-white text-xs outline-none transition"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold rounded-xl transition"
                  >
                    Áp dụng thiết lập
                  </button>
                </form>

                {/* Spectator Mode Toggle */}
                <div className="border-t border-white/5 pt-4">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Chế độ giảng viên
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSpectatorMode(false);
                        adminSetSpectatorMode(false);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                        !spectatorMode
                          ? 'bg-green-600/20 border-green-500/40 text-green-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      👤 Tham gia chơi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSpectatorMode(true);
                        adminSetSpectatorMode(true);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                        spectatorMode
                          ? 'bg-yellow-600/20 border-yellow-500/40 text-yellow-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      👁️ Quan sát (Orchestrator)
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">
                    {spectatorMode
                      ? 'Giảng viên không tham gia chơi — không được phân vai, không xuất hiện trên bảng xếp hạng.'
                      : 'Giảng viên được phân vai và tham gia như người chơi bình thường.'}
                  </p>
                </div>
              </div>
            )}

            {/* Players List Panel */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col flex-1 min-h-[300px]">
              <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                  Danh Sách Người Chơi ({players.length})
                </span>
                <span className="text-[10px] text-green-400 animate-pulse font-semibold">
                  Đang chờ...
                </span>
              </div>

              {error && (
                <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center animate-pulse">
                  {error}
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-2 max-h-[350px] pr-1">
                {players.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-gray-500 italic">
                    Chưa có người chơi nào tham gia...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {players.map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5"
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${p.isOnline ? 'bg-green-500' : 'bg-gray-500 animate-pulse'}`} />
                          <span className="font-semibold text-xs tracking-wide">
                            {p.username} {p.isAdmin && <span className="text-[9px] text-red-400 font-black ml-1">(Admin)</span>}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {p.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Start Button inside lobby column */}
              {player?.isAdmin && (
                <button
                  onClick={adminStartGame}
                  disabled={players.length === 0}
                  className="w-full mt-5 py-3.5 bg-gradient-to-r from-red-600 to-yellow-500 hover:from-red-500 hover:to-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-lg transition duration-200 flex items-center justify-center space-x-2 uppercase tracking-wider"
                >
                  <Play className="w-4 h-4" />
                  <span>Bắt đầu game</span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT SIDE (5 cols) - DEFAULT RULES PANEL */}
          <div className="lg:col-span-5 backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col space-y-4">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
              <BookOpen className="w-5 h-5 text-red-500" />
              <span className="text-sm font-black uppercase tracking-wider">Cách Chơi & Quy Luật Game</span>
            </div>

            <div className="text-xs text-gray-300 space-y-4 overflow-y-auto max-h-[580px] pr-1 scrollbar-thin">
              
              {/* Introduction */}
              <div className="bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed">
                <strong className="text-yellow-400 block mb-1">Tổng quan luật chơi:</strong>
                Mỗi người chơi được phân ngẫu nhiên 1 trong 6 vai trò kinh tế. Qua các vòng chơi, bạn cần chọn hành động để tối ưu hóa chỉ số Vốn (Capital) và các chỉ số điểm cống hiến xã hội. Kết quả chung cuộc sẽ tính theo công thức Phát Triển Bền Vững.
              </div>

              {/* Roles list */}
              <div className="space-y-2">
                <span className="font-bold text-gray-300 block">6 Vai trò kinh tế & Vốn ban đầu:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-purple-500/5 border border-purple-500/10 p-2 rounded">
                    <span className="text-purple-400 font-bold block">1. FDI: 120.0 vốn</span>
                    Doanh nghiệp ngoại.
                  </div>
                  <div className="bg-red-500/5 border border-red-500/10 p-2 rounded">
                    <span className="text-red-400 font-bold block">2. SOE (Nhà nước): 100.0</span>
                    Lĩnh vực then chốt.
                  </div>
                  <div className="bg-blue-500/5 border border-blue-500/10 p-2 rounded">
                    <span className="text-blue-400 font-bold block">3. POE (Tư nhân): 90.0</span>
                    Năng động cạnh tranh.
                  </div>
                  <div className="bg-green-500/5 border border-green-500/10 p-2 rounded">
                    <span className="text-green-400 font-bold block">4. COOP (HTX): 80.0</span>
                    Sở hữu tập thể.
                  </div>
                  <div className="bg-yellow-500/5 border border-yellow-500/10 p-2 rounded">
                    <span className="text-yellow-400 font-bold block">5. Hộ cá thể: 70.0</span>
                    Gia đình, linh hoạt.
                  </div>
                  <div className="bg-orange-500/5 border border-orange-500/10 p-2 rounded">
                    <span className="text-orange-400 font-bold block">6. Lao động: 50.0</span>
                    Bán sức lao động.
                  </div>
                </div>
              </div>

              {/* Actions & Formulas */}
              <div className="space-y-2">
                <span className="font-bold text-gray-300 flex items-center">
                  <Calculator className="w-4 h-4 mr-1 text-red-500" />
                  Công thức hành động mỗi vòng:
                </span>
                <ul className="list-disc pl-4 space-y-1.5 text-gray-400 text-[11px]">
                  <li>
                    <strong className="text-white">Sản xuất (PRODUCE)</strong>: 
                    <br />
                    Lao động nhận <span className="text-yellow-400">+15.0 lương</span>. Các vai trò khác nhận <span className="text-yellow-400">+20.0 x Hệ số nhân</span>.
                  </li>
                  <li>
                    <strong className="text-white">Đầu tư (INVEST)</strong>: 
                    <br />
                    Lao động tốn <span className="text-red-400">-15.0 vốn</span> tăng vĩnh viễn <span className="text-green-400">+20% hiệu suất</span>. Khác tốn <span className="text-red-400">-30.0 vốn</span> tăng vĩnh viễn <span className="text-green-400">+30% hiệu suất</span>.
                  </li>
                  <li>
                    <strong className="text-white">Phúc lợi (WELFARE)</strong>: 
                    <br />
                    Lao động nhận hỗ trợ <span className="text-yellow-400">+15.0 vốn, +1 điểm phúc lợi</span>. Người sử dụng lao động trả chi phí vốn, đổi lại nhận <span className="text-green-400">điểm Đóng góp xã hội tăng mạnh</span>.
                  </li>
                  <li>
                    <strong className="text-white">Tối ưu chi phí (OPTIMIZE)</strong>: 
                    <br />
                    Tăng mạnh vốn trong vòng này (<span className="text-yellow-400">lên tới +35.0</span>) nhưng bị <span className="text-red-500">trừ điểm Đóng góp xã hội</span> do cắt giảm phúc lợi/gây ô nhiễm.
                  </li>
                  <li>
                    <strong className="text-white">Đóng góp xã hội (SOCIAL)</strong>: 
                    <br />
                    Ủng hộ từ thiện xã hội. Trả chi phí vốn nhỏ, nhận <span className="text-green-400">tăng mạnh điểm Đóng góp xã hội</span>.
                  </li>
                </ul>
              </div>

              {/* Macroeconomics policies */}
              <div className="space-y-2">
                <span className="font-bold text-gray-300 flex items-center">
                  <Calculator className="w-4 h-4 mr-1 text-red-500" />
                  Cơ chế vĩ mô & Điều tiết của Nhà nước:
                </span>
                <ul className="list-disc pl-4 space-y-1.5 text-gray-400 text-[11px]">
                  <li>
                    <strong className="text-white">Thuế lũy tiến (Taxation)</strong>:
                    Đóng góp tự động vào ngân sách khi có thu nhập dương: Lao động đóng <span className="text-red-400">2%</span> (nếu trên 15.0), COOP/Hộ cá thể <span className="text-red-400">5%</span>, FDI/SOE/POE đóng <span className="text-red-400">10-20%</span>.
                  </li>
                  <li>
                    <strong className="text-white">Quỹ trợ cấp khó khăn (Welfare Injection)</strong>:
                    Nếu vốn của một người chơi <span className="text-red-400">dưới 50.0</span>, ngân sách tự động trợ cấp <span className="text-green-400">+20.0 vốn</span> (yêu cầu ngân sách còn ít nhất 20.0).
                  </li>
                  <li>
                    <strong className="text-white">Đầu tư công (Public Investment Event)</strong>:
                    Khi ngân sách nhà nước tích lũy đạt <span className="text-green-400">500.0</span>, tự động kích hoạt gói xây dựng cơ sở hạ tầng giao thông trị giá <span className="text-red-400">300.0</span>, tăng vĩnh viễn <span className="text-green-400">+10% hiệu suất sản xuất</span> cho toàn dân.
                  </li>
                </ul>
              </div>

              {/* Final Score Formula */}
              <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
                <span className="font-bold text-red-400 flex items-center mb-1">
                  <Award className="w-4 h-4 mr-1" />
                  Điểm tổng kết cuối cùng (Final Score):
                </span>
                <div className="text-[10px] text-gray-400 font-mono bg-black/30 p-2 rounded">
                  Score = (Vốn cuối cùng / 10) + Điểm Lao động + Điểm Đóng góp xã hội + Điểm Phúc lợi + Thưởng bền vững
                </div>
                <ul className="list-disc pl-4 mt-2 text-[10px] space-y-1 text-gray-400">
                  <li><strong className="text-white">Thưởng bền vững:</strong> +5.0 điểm nếu Vốn &gt; 0 và Điểm xã hội đạt &gt;= 10.0.</li>
                  <li><strong className="text-white">Thưởng phúc lợi:</strong> +3.0 điểm nếu nhận trợ cấp và tích lũy vốn vượt mức ban đầu.</li>
                </ul>
              </div>

              {/* Powerups Rules */}
              <div className="bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-xl">
                <span className="font-bold text-yellow-400 flex items-center mb-1">
                  ⚡ Hệ Thống Thẻ Bài Quyền Lực (Powerups):
                </span>
                <ul className="list-disc pl-4 space-y-1.5 text-gray-400 text-[11px]">
                  <li>
                    <strong className="text-white">Cơ chế rút thẻ</strong>: Cuối mỗi vòng chơi, mỗi người chơi có <span className="text-yellow-400">30% cơ hội</span> nhận ngẫu nhiên một thẻ bài (không rút ở vòng cuối).
                  </li>
                  <li>
                    <strong className="text-white">Giới hạn bài trên tay</strong>: Tối đa <span className="text-yellow-400">3 thẻ</span>. Nếu rút được thẻ thứ 4, hệ thống sẽ mở bảng lựa chọn yêu cầu bạn <span className="text-yellow-400">Hủy (Discard)</span> thẻ mới hoặc <span className="text-yellow-400">Đổi (Swap)</span> với thẻ đang có.
                  </li>
                  <li>
                    <strong className="text-white">Cơ chế nhắm mục tiêu (Target)</strong>: Một số thẻ bài yêu cầu chọn người chơi chịu ảnh hưởng. Bạn cần chọn mục tiêu bằng cách nhấp chọn người chơi trên bảng xếp hạng ở góc phải khi chơi.
                  </li>
                  <li>
                    <strong className="text-white">Lá chắn bảo vệ (SHIELD Passive)</strong>: Nếu bạn sở hữu thẻ <span className="text-blue-400">Lá Chắn (SHIELD)</span> trên tay khi bị người khác tấn công (bởi Thuế Mỹ, Sự Cố An Ninh...), Lá Chắn sẽ <span className="text-green-400">tự động kích hoạt</span> để giảm 50% thiệt hại và tự hủy sau đó.
                  </li>
                  <li>
                    <strong className="text-white">Các loại thẻ đặc biệt</strong>:
                    <ul className="list-circle pl-4 mt-1 space-y-1">
                      <li><strong className="text-white">Chiến tranh (WAR - Epic)</strong>: Tất cả người chơi mất 10 Vốn, phí Đầu Tư tăng 10 Vốn trong suốt game.</li>
                      <li><strong className="text-white">Sự cố an ninh (TERRORIST - Mythic)</strong>: Mục tiêu mất 50% tổng số Vốn hiện có.</li>
                      <li><strong className="text-white">Thuế quan Mỹ (USA_TAX)</strong>: Giảm 40% Vốn của mục tiêu (chỉ nhắm FDI/POE).</li>
                      <li><strong className="text-white">Tự hào VN (PRIDE)</strong>: Tăng 10 Vốn, +1 điểm xã hội cho tất cả người chơi trong nước.</li>
                    </ul>
                  </li>
                </ul>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};