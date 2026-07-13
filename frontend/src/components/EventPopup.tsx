import React, { useState, useEffect } from 'react';
import { useGame } from '../context/SocketContext';
import { X, Clock } from 'lucide-react';

const EVENT_ICONS: Record<string, string> = {
  GLOBAL_CRISIS: '🌍',
  DISASTER: '🌊',
  COOP_SUPPORT: '🤝',
  FDI_BOOM: '💰',
};

const EVENT_NAMES: Record<string, string> = {
  GLOBAL_CRISIS: 'Khủng hoảng tài chính toàn cầu',
  DISASTER: 'Thiên tai / Dịch bệnh',
  COOP_SUPPORT: 'Chính sách ưu đãi COOP',
  FDI_BOOM: 'Bùng nổ FDI',
};

export const EventPopup: React.FC = () => {
  const { macroEventTriggered, room } = useGame();
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (macroEventTriggered) {
      setVisible(true);
      setCountdown(10);
      const interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      const timeout = setTimeout(() => {
        setVisible(false);
        clearInterval(interval);
      }, 10000);
      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
  }, [macroEventTriggered]);

  if (!visible || !macroEventTriggered) return null;

  const eventCode = room?.activeEvent;
  const icon = eventCode ? EVENT_ICONS[eventCode] || '📢' : '📢';
  const eventName = eventCode ? EVENT_NAMES[eventCode] || 'Sự kiện vĩ mô' : 'Sự kiện vĩ mô';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="backdrop-blur-md bg-[#111625] border border-yellow-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <span className="text-4xl">{icon}</span>
            <div>
              <h3 className="text-lg font-black text-yellow-400 uppercase tracking-wider">Sự Kiện Vĩ Mô</h3>
              <p className="text-xs text-gray-400 font-semibold">{eventName}</p>
            </div>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
          <p className="text-sm text-gray-200 leading-relaxed">{macroEventTriggered}</p>
        </div>

        <div className="flex items-center space-x-2 text-gray-400 text-xs">
          <Clock className="w-4 h-4" />
          <span>Tự động đóng sau {countdown} giây...</span>
        </div>
      </div>
    </div>
  );
};
