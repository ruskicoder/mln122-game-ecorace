import React, { useState, useEffect } from 'react';
import { useGame } from '../context/SocketContext';
import { Vote, Clock, BarChart3, TrendingUp } from 'lucide-react';

export const VotingOverlay: React.FC = () => {
  const { votingState, votes, submitPolicyVote } = useGame();
  const [countdown, setCountdown] = useState(20);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    if (!votingState) return;
    setCountdown(votingState.duration);
    setVoted(false);
    const interval = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [votingState]);

  const handleVote = (choice: string) => {
    submitPolicyVote(choice);
    setVoted(true);
  };

  if (!votingState) return null;

  const progressiveCount = votes?.filter(v => v.choice === 'PROGRESSIVE').length || 0;
  const stimulusCount = votes?.filter(v => v.choice === 'STIMULUS').length || 0;
  const totalVotes = (progressiveCount + stimulusCount) || 1;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[70] flex items-center justify-center p-4">
      <div className="backdrop-blur-md bg-[#111625] border border-blue-500/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Vote className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-black text-blue-400 uppercase tracking-wider">Bỏ Phiếu Chính Sách</h2>
          </div>
          <div className="flex items-center space-x-1.5 text-red-400 font-bold text-sm">
            <Clock className="w-4 h-4" />
            <span>{countdown}s</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          Mỗi 5 vòng, người dân bầu chọn chính sách thuế áp dụng cho 5 vòng tiếp theo:
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleVote('PROGRESSIVE')}
            disabled={voted}
            className={`p-4 rounded-xl border text-left transition-all ${
              voted
                ? 'opacity-40 cursor-not-allowed border-white/5'
                : 'hover:border-blue-500/40 hover:bg-blue-500/5 border-white/10 bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-sm text-blue-400">A: Thuế lũy tiến</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Tăng thuế với nhóm lợi nhuận cao. Ngân sách nhà nước tăng nhanh hơn, đầu tư công sớm hơn.
            </p>
            <div className="mt-2">
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-500 h-full transition-all" style={{ width: `${(progressiveCount / totalVotes) * 100}%` }} />
              </div>
              <span className="text-[9px] text-gray-500 mt-0.5 block">{progressiveCount} phiếu</span>
            </div>
          </button>

          <button
            onClick={() => handleVote('STIMULUS')}
            disabled={voted}
            className={`p-4 rounded-xl border text-left transition-all ${
              voted
                ? 'opacity-40 cursor-not-allowed border-white/5'
                : 'hover:border-green-500/40 hover:bg-green-500/5 border-white/10 bg-white/5'
            }`}
          >
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="font-bold text-sm text-green-400">B: Kích cầu thuế</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Giảm thuế giữ lại lợi nhuận cho doanh nghiệp. Đầu tư công chậm hơn nhưng kích thích sản xuất.
            </p>
            <div className="mt-2">
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className="bg-green-500 h-full transition-all" style={{ width: `${(stimulusCount / totalVotes) * 100}%` }} />
              </div>
              <span className="text-[9px] text-gray-500 mt-0.5 block">{stimulusCount} phiếu</span>
            </div>
          </button>
        </div>

        {voted && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
            <p className="text-xs text-green-400 font-bold">✓ Bạn đã bỏ phiếu thành công!</p>
          </div>
        )}
      </div>
    </div>
  );
};
