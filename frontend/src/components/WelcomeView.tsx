"import React, { useState } from 'react';
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
          </p
<truncated 4175 bytes>