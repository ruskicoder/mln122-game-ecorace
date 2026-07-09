import React, { useState } from 'react';
import { useGame } from '../context/SocketContext';
import { User, Key, Plus, LogIn } from 'lucide-react';

export const WelcomeView: React.FC = () => {
  const { createRoom, joinRoom, error, clearError } = useGame();
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    clearError();

    if (isAdminMode) {
      await createRoom(username);
    } else {
      if (!roomId.trim()) {
        setIsLoading(false);
        return;
      }
      await joinRoom(roomId, username);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative overflow-hidden bg-radial-gradient">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-yellow-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 mb-3 rounded-full text-xs font-semibold tracking-wider text-yellow-300 bg-yellow-500/10 border border-yellow-500/20">
            Học phần MLN122 - Đại học FPT
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 tracking-tight">
            ĐƯỜNG ĐUA KINH TẾ
          </h1>
          <p className="text-gray-400 mt-2 text-sm uppercase tracking-widest font-medium">
            Việt Nam Định Hướng XHCN
          </p>
        </div>

        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative">
          {/* Form Tabs */}
          <div className="flex border-b border-white/10 mb-6">
            <button
              onClick={() => {
                setIsAdminMode(false);
                clearError();
              }}
              className={`flex-1 pb-3 text-sm font-bold transition-all border-b-2 flex items-center justify-center space-x-2 ${
                !isAdminMode ? 'border-red-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Vào Phòng Chơi</span>
            </button>
            <button
              onClick={() => {
                setIsAdminMode(true);
                clearError();
              }}
              className={`flex-1 pb-3 text-sm font-bold transition-all border-b-2 flex items-center justify-center space-x-2 ${
                isAdminMode ? 'border-red-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Phòng (Giảng viên)</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400 text-center animate-pulse">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5 pl-1">
                Tên Người Chơi
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nhập tên hiển thị..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-sm outline-none transition"
                  required
                />
              </div>
            </div>

            {!isAdminMode && (
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1.5 pl-1">
                  Mã Phòng Chơi
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Mã 6 ký tự (Ví dụ: TEST01)..."
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white text-sm uppercase outline-none transition"
                    required={!isAdminMode}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-yellow-500 hover:from-red-500 hover:to-yellow-400 text-white text-sm font-bold rounded-xl shadow-lg transition duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <span>Đang xử lý...</span>
              ) : (
                <>
                  <span>{isAdminMode ? 'Tạo phòng và Đăng nhập' : 'Tham gia'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};