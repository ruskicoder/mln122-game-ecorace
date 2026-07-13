import React, { useState } from 'react';
import { useGame } from '../context/SocketContext';
import { Handshake, X, Check, Send } from 'lucide-react';

export const PartnershipPanel: React.FC = () => {
  const { room, player, proposePartnership, respondPartnership, activePartnershipProposal } = useGame();

  const [showInvite, setShowInvite] = useState(false);
  const [targetPlayerId, setTargetPlayerId] = useState('');
  const [ratioA, setRatioA] = useState(50);
  const [ratioB, setRatioB] = useState(50);

  const handleRatioChange = (value: number) => {
    const clamped = Math.max(10, Math.min(90, value));
    setRatioA(clamped);
    setRatioB(100 - clamped);
  };

  const handleSendInvite = () => {
    if (!targetPlayerId) return;
    proposePartnership(targetPlayerId, ratioA / 100, ratioB / 100);
    setShowInvite(false);
    setTargetPlayerId('');
  };

  const otherPlayers = (room?.players || []).filter(
    p => p.id !== player?.id && p.role !== null && p.isOnline
  );

  return (
    <div className="backdrop-blur-md bg-[#161a29]/90 border border-amber-500/20 rounded-2xl p-4 space-y-3 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center">
          <Handshake className="w-4 h-4 mr-1.5 text-amber-400" />
          Liên Doanh
        </h3>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold rounded-lg hover:bg-amber-500/20 transition"
        >
          {showInvite ? 'Hủy' : '+ Mời'}
        </button>
      </div>

      {/* Incoming proposal */}
      {activePartnershipProposal && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 space-y-2 animate-pulse">
          <p className="text-[11px] text-gray-200 font-semibold">
            {activePartnershipProposal.playerA?.username || 'Người chơi'} muốn liên doanh với bạn!
          </p>
          <p className="text-[10px] text-gray-400">
            Tỷ lệ: {Math.round(activePartnershipProposal.ratioA * 100)}% / {Math.round(activePartnershipProposal.ratioB * 100)}%
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => respondPartnership(activePartnershipProposal.id, 'ACCEPTED')}
              className="flex-1 py-1.5 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold rounded-lg transition flex items-center justify-center space-x-1"
            >
              <Check className="w-3 h-3" />
              <span>Chấp nhận</span>
            </button>
            <button
              onClick={() => respondPartnership(activePartnershipProposal.id, 'REJECTED')}
              className="flex-1 py-1.5 bg-red-600/50 hover:bg-red-500 text-white text-[10px] font-bold rounded-lg transition flex items-center justify-center space-x-1"
            >
              <X className="w-3 h-3" />
              <span>Từ chối</span>
            </button>
          </div>
        </div>
      )}

      {/* Invite form */}
      {showInvite && (
        <div className="space-y-3 bg-black/20 rounded-xl p-3 border border-white/5">
          <div>
            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Chọn đối tác</label>
            <select
              value={targetPlayerId}
              onChange={(e) => setTargetPlayerId(e.target.value)}
              className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white outline-none"
            >
              <option value="">-- Chọn --</option>
              {otherPlayers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.username} ({p.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Tỷ lệ góp vốn: Bạn {ratioA}% / Đối tác {ratioB}%
            </label>
            <input
              type="range"
              min={10}
              max={90}
              value={ratioA}
              onChange={(e) => handleRatioChange(parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-[9px] text-gray-500 mt-0.5">
              <span>Bạn: {ratioA}%</span>
              <span>Đối tác: {ratioB}%</span>
            </div>
          </div>

          <button
            onClick={handleSendInvite}
            disabled={!targetPlayerId}
            className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition flex items-center justify-center space-x-1"
          >
            <Send className="w-3 h-3" />
            <span>Gửi lời mời</span>
          </button>
        </div>
      )}
    </div>
  );
};
