"import React, { useState, useEffect } from 'react';
import { useGame } from '../context/SocketContext';
import { ActionType, EconomicRole } from '@ecorace/shared';
import { Shield, Sparkles, TrendingUp, Heart, Share2, Award, Info, Users, Clock, Landmark } from 'lucide-react';

export const GameBoardView: React.FC = () => {
  const { room, player, submitAction, results, adminNextRound } = useGame();
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [timeLeft, setTimeLeft] = useState(40);

  // Synchronize timer countdown
  useEffect(() => {
    setTimeLeft(40);
    setSelectedAction(null);
  }, [room?.currentRound]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleActionSelect = (actionType: ActionType) => {
    if (selectedAction) return; // Prevent double submission
    setSelectedAction(actionType);
    submitAction(actionType);
  };

  const getRoleDetails = (role: EconomicRole | null) => {
    switch (role) {
      case EconomicRole.FDI:
        return {
          name: 'Doanh nghiệp FDI',
          ownership: 'Sở hữu nước ngoài',
          desc: 'Có tiềm lực tài chính lớn nhất, tập trung sản xuất quy mô lớn và tối ưu hóa chuỗi cung ứng toàn cầu.',
          color: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
        };
      case EconomicRole.SOE:
        return {
          name: 'Doanh nghiệp Nhà nước (SOE)',
          ownership: 'Sở hữu toàn dân (Nhà nước đại diện)',
          desc: 'Nắm giữ các lĩnh vực then chốt, gánh vác trách nhiệm xã hội lớn, đóng thuế tích lũy ngân sách quốc gia.',
          color: 'text-red-400 border-red-500/20 bg-red-500/5',
        };
      case EconomicRole.POE:
        return {
          name: 'Doanh nghiệp Tư nhân (POE)',
          owner
<truncated 16183 bytes>