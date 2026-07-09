"import React from 'react';
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
   
<truncated 7891 bytes>