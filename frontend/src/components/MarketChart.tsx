import React, { useMemo } from 'react';
import { useGame } from '../context/SocketContext';
import { TrendingUp, DollarSign, Droplets, Zap } from 'lucide-react';

export const MarketChart: React.FC = () => {
  const { marketHistories } = useGame();

  const { pathUSD, pathOil, pathGold } = useMemo(() => {
    if (!marketHistories || marketHistories.length < 2) {
      return { pathUSD: '', pathOil: '', pathGold: '', yMin: 0, yMax: 100 };
    }

    const usdValues = marketHistories.map(h => h.usd);
    const oilValues = marketHistories.map(h => h.oil);
    const goldValues = marketHistories.map(h => h.gold);
    const allValues = [...usdValues, ...oilValues, ...goldValues];
    const yMin = Math.min(...allValues) * 0.95;
    const yMax = Math.max(...allValues) * 1.05;
    const range = yMax - yMin || 1;

    const W = 240;
    const H = 60;
    const count = marketHistories.length;
    const stepX = W / Math.max(count - 1, 1);

    const toPoint = (val: number, idx: number) =>
      `${idx * stepX},${H - ((val - yMin) / range) * H}`;

    const pathUSD = marketHistories.map((h, i) => toPoint(h.usd, i)).join(' ');
    const pathOil = marketHistories.map((h, i) => toPoint(h.oil, i)).join(' ');
    const pathGold = marketHistories.map((h, i) => toPoint(h.gold, i)).join(' ');

    return { pathUSD, pathOil, pathGold };
  }, [marketHistories]);

  if (!marketHistories || marketHistories.length < 2) return null;

  const latest = marketHistories[marketHistories.length - 1];

  return (
    <div className="fixed bottom-4 right-4 z-50 backdrop-blur-md bg-[#0d1120]/90 border border-white/10 rounded-2xl p-4 shadow-2xl w-[280px]">
      <div className="flex items-center space-x-2 mb-3 border-b border-white/5 pb-2">
        <TrendingUp className="w-4 h-4 text-green-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Thị Trường</span>
      </div>

      <div className="relative">
        <svg viewBox="0 0 240 60" className="w-full h-[60px]">
          {pathUSD && <polyline fill="none" stroke="#22c55e" strokeWidth="1.5" points={pathUSD} />}
          {pathOil && <polyline fill="none" stroke="#f59e0b" strokeWidth="1.5" points={pathOil} />}
          {pathGold && <polyline fill="none" stroke="#a855f7" strokeWidth="1.5" points={pathGold} />}
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2 text-[10px]">
        <div className="bg-green-500/5 rounded-lg p-1.5 border border-green-500/10">
          <div className="flex items-center space-x-1 text-green-400">
            <DollarSign className="w-3 h-3" />
            <span className="font-bold">USD</span>
          </div>
          <span className="text-white font-mono font-bold">{latest.usd.toFixed(1)}</span>
        </div>
        <div className="bg-amber-500/5 rounded-lg p-1.5 border border-amber-500/10">
          <div className="flex items-center space-x-1 text-amber-400">
            <Droplets className="w-3 h-3" />
            <span className="font-bold">Oil</span>
          </div>
          <span className="text-white font-mono font-bold">{latest.oil.toFixed(1)}</span>
        </div>
        <div className="bg-purple-500/5 rounded-lg p-1.5 border border-purple-500/10">
          <div className="flex items-center space-x-1 text-purple-400">
            <Zap className="w-3 h-3" />
            <span className="font-bold">Gold</span>
          </div>
          <span className="text-white font-mono font-bold">{latest.gold.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
};
