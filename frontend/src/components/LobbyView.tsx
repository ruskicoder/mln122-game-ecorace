"import React from 'react';
import { useGame } from '../context/SocketContext';
import { Users, Play, Copy, LogOut } from 'lucide-react';

export const LobbyView: React.FC = () => {
  const { room, player, adminStartGame, leaveRoom, error } = useGame();

  const handleCopyCode = () => {
    if (room?.id) {
      navigator.clipboard.writeText(room.id);
      alert(`Đã sao chép mã phòng: ${room.id}`);
    }
  };

  const players = room?.players || [];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-red-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-[40%] h-[40%] rounded-full bg-yellow-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-red-500" />
            <span className="text-xl font-bold uppercase tracking-wider">Phòng Chờ</span>
          </div>
          <button
            onClick={leaveRoom}
            className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl transition text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Thoát</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Info Card */}
          <div className="md:col-span-1 space-y-4">
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
              <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Mã Phòng</span>
              <div className="flex items-center justify-center s
<truncated 5083 bytes>