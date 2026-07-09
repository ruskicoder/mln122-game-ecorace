import React from 'react';
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
              <div className="flex items-center justify-center space-x-2 mt-2">
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

            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold block">
                Thông tin phòng
              </span>
              <div className="text-xs text-gray-300">
                <div>Số lượng: <span className="font-bold">{players.length} / 50</span></div>
                <div className="mt-1">
                  Trạng thái:{' '}
                  <span className="font-bold text-green-400 animate-pulse">Đang chờ...</span>
                </div>
              </div>
            </div>

            {player?.isAdmin && (
              <button
                onClick={adminStartGame}
                disabled={players.length === 0}
                className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-lg transition duration-200 flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Bắt đầu game</span>
              </button>
            )}
          </div>

          {/* Players List */}
          <div className="md:col-span-2 backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col min-h-[300px]">
            <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold border-b border-white/5 pb-2 mb-3">
              Danh Sách Người Chơi
            </span>

            {error && (
              <div className="p-2 mb-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center">
                {error}
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2 max-h-[320px]">
              {players.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-500 italic">
                  Chưa có người chơi nào tham gia...
                </div>
              ) : (
                players.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          p.isOnline ? 'bg-green-500' : 'bg-gray-500'
                        }`}
                      />
                      <span className="font-semibold text-sm">
                        {p.username} {p.isAdmin && <span className="text-[10px] text-red-400 font-bold">(Admin)</span>}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">
                      {p.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};