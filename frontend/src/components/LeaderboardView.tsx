import React from 'react';
import { useGame } from '../context/SocketContext';
import { Award, BookOpen, LogOut, HeartHandshake, Compass } from 'lucide-react';

export const LeaderboardView: React.FC = () => {
  const { leaderboard, leaveRoom } = useGame();

  // Find specialized awards
  const topCapitalPlayer = leaderboard
    ? [...leaderboard].sort((a, b) => b.capital - a.capital)[0]
    : null;

  const topSocialPlayer = leaderboard
    ? [...leaderboard].sort((a, b) => b.socialScore - a.socialScore)[0]
    : null;

  const topSustainablePlayer = leaderboard
    ? [...leaderboard].sort((a, b) => b.sustainabilityScore - a.sustainabilityScore)[0]
    : null;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white p-4 md:p-8 flex flex-col justify-start items-center relative">
      <div className="absolute top-[5%] left-[20%] w-[40%] h-[40%] rounded-full bg-red-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[5%] right-[20%] w-[40%] h-[40%] rounded-full bg-yellow-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-4xl z-10 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div className="flex items-center space-x-2">
            <Award className="w-8 h-8 text-yellow-400" />
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider">Bảng Xếp Hạng</h1>
              <p className="text-xs text-gray-400">Kết quả phát triển bền vững chung cuộc</p>
            </div>
          </div>
          <button
            onClick={leaveRoom}
            className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl transition text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Thoát Phòng</span>
          </button>
        </div>

        {/* Special Awards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="backdrop-blur-md bg-white/5 border border-yellow-500/20 rounded-2xl p-4 flex items-center space-x-4">
            <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold block">
                Vua Tài Chính (Vốn cao nhất)
              </span>
              <span className="font-bold text-sm text-yellow-300">
                {topCapitalPlayer ? `${topCapitalPlayer.username} (${topCapitalPlayer.capital?.toFixed(1)} vốn)` : '---'}
              </span>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/5 border border-blue-500/20 rounded-2xl p-4 flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold block">
                Nhà Đóng Góp Xã Hội Lớn Nhất
              </span>
              <span className="font-bold text-sm text-blue-300">
                {topSocialPlayer ? `${topSocialPlayer.username} (${topSocialPlayer.socialScore?.toFixed(1)} điểm)` : '---'}
              </span>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/5 border border-green-500/20 rounded-2xl p-4 flex items-center space-x-4">
            <div className="p-3 bg-green-500/10 rounded-xl text-green-400">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold block">
                Phát Triển Bền Vững (Xanh nhất)
              </span>
              <span className="font-bold text-sm text-green-300">
                {topSustainablePlayer ? `${topSustainablePlayer.username} (${topSustainablePlayer.sustainabilityScore?.toFixed(1)} điểm)` : '---'}
              </span>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5">
          <span className="block text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4">
            Bảng Điểm Phát Triển Bền Vững Lũy Kế
          </span>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-xs uppercase font-bold">
                  <th className="pb-3 pl-2">Hạng</th>
                  <th className="pb-3">Tên Người Chơi</th>
                  <th className="pb-3">Vai Trò</th>
                  <th className="pb-3">Vốn / Điểm quy đổi</th>
                  <th className="pb-3">Điểm Lao Động</th>
                  <th className="pb-3">Điểm Xã Hội</th>
                  <th className="pb-3">Điểm Phúc Lợi</th>
                  <th className="pb-3">Thưởng Bền Vững</th>
                  <th className="pb-3 text-right pr-2">Tổng Điểm</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard?.map((p, idx) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 last:border-0">
                    <td className="py-4 pl-2 font-bold text-yellow-400">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                    <td className="py-4 font-semibold">{p.username}</td>
                    <td className="py-4 text-xs text-gray-400">{p.role}</td>
                    <td className="py-4 text-xs font-mono">
                      {p.capital?.toFixed(1)} <span className="text-[10px] text-gray-500">({(p.capital / 10).toFixed(1)}đ)</span>
                    </td>
                    <td className="py-4 text-xs font-mono">{p.laborScore?.toFixed(1)}</td>
                    <td className="py-4 text-xs font-mono">{p.socialScore?.toFixed(1)}</td>
                    <td className="py-4 text-xs font-mono">{p.welfareScore?.toFixed(1)}</td>
                    <td className="py-4 text-xs font-mono text-green-400">+{p.sustainabilityScore?.toFixed(1)}</td>
                    <td className="py-4 text-right pr-2 font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-yellow-400">
                      {p.totalScore?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Theoretical Review Block (MLN122 Lesson) */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-md font-bold text-yellow-400 flex items-center border-b border-white/5 pb-2">
            <BookOpen className="w-5 h-5 mr-2 text-yellow-400" /> BÀI HỌC KINH TẾ CHÍNH TRỊ MÁC - LÊNIN (CHƯƠNG 5)
          </h3>
          <div className="text-xs text-gray-300 space-y-3 leading-relaxed">
            <p>
              <strong>1. Thành phần kinh tế và hình thức sở hữu:</strong> Trong game, bạn đã trải nghiệm các vai trò kinh tế khác nhau đại diện cho các thành phần kinh tế tại Việt Nam: Kinh tế nhà nước (SOE), Kinh tế tập thể (COOP), Kinh tế tư nhân (POE, Household) và Kinh tế có vốn đầu tư nước ngoài (FDI). Cơ cấu này thể hiện rõ nét tính chất đa dạng sở hữu về tư liệu sản xuất trong thời kỳ quá độ lên chủ nghĩa xã hội.
            </p>
            <p>
              <strong>2. Cơ chế phân phối lại và Vai trò điều tiết vĩ mô:</strong> Nhà nước thực hiện điều tiết vĩ mô thông qua cơ chế <strong>Thuế thu nhập lũy tiến</strong> (tính trực tiếp từ lợi nhuận dương của doanh nghiệp) để đóng góp vào <strong>Quỹ Ngân sách Quốc gia</strong>. Ngân sách này sau đó được sử dụng cho hai mục đích: trích quỹ <strong>Trợ cấp phúc lợi xã hội</strong> để cứu vớt những người chơi yếu thế khỏi nguy cơ phá sản, và thực hiện <strong>Đầu tư công</strong> xây dựng hạ tầng để cộng hưởng tăng năng suất sản xuất cho toàn xã hội.
            </p>
            <p>
              <strong>3. Định hướng Xã hội chủ nghĩa (XHCN):</strong> Vì sao người chiến thắng chung cuộc thường không phải là người tích lũy nhiều tiền nhất? Đó là bởi công thức tính điểm của game tích hợp các chỉ số phát triển xã hội (lao động, hỗ trợ phúc lợi, đóng góp công ích). Điều này minh chứng cho chân lý lý thuyết môn MLN122: <i>Nền kinh tế thị trường định hướng XHCN Việt Nam là nền kinh tế vận hành đầy đủ, đồng bộ theo quy luật thị trường, đồng thời bảo đảm mục tiêu "Dân giàu, nước mạnh, dân chủ, công bằng, văn minh" - tức phát triển kinh tế gắn liền với tiến bộ và công bằng xã hội ở từng bước, từng chính sách phát triển.</i>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};