import React, { useEffect, useState } from 'react';
import { useGame } from '../context/SocketContext';
import { ActionType } from '@ecorace/shared';
import { BookOpen, X, Lightbulb, TrendingUp, Heart, Shield, Share2, Sparkles } from 'lucide-react';

const LESSONS: Record<string, { title: string; icon: React.ReactNode; theory: string; practice: string }> = {
  [ActionType.PRODUCE]: {
    title: 'Sản xuất & Quy luật giá trị',
    icon: <TrendingUp className="w-5 h-5 text-green-400" />,
    theory: 'Theo C.Mác, sản xuất là hoạt động cơ bản nhất của xã hội loài người. Quy luật giá trị yêu cầu sản xuất và trao đổi hàng hóa phải dựa trên hao phí lao động xã hội cần thiết. Trong nền kinh tế thị trường định hướng XHCN, sản xuất không chỉ tạo ra giá trị thặng dư mà còn phải đảm bảo lợi ích hài hòa giữa các chủ thể kinh tế.',
    practice: 'Bài học: Sản xuất mang lại lợi nhuận ổn định, an toàn. Đây là nền tảng cho mọi hoạt động kinh tế. Kết hợp với đầu tư sẽ tạo ra tăng trưởng bền vững.',
  },
  [ActionType.INVEST]: {
    title: 'Tích lũy tư bản & Tái đầu tư',
    icon: <Sparkles className="w-5 h-5 text-yellow-400" />,
    theory: 'Tích lũy tư bản là quá trình chuyển hóa một phần giá trị thặng dư thành tư bản mới, nhằm mở rộng sản xuất. Lý thuyết "cần, kiệm" của các nhà kinh tế học cổ điển nhấn mạnh vai trò của đầu tư đối với tăng trưởng dài hạn. Tuy nhiên, đầu tư luôn đi kèm rủi ro và cần tính toán kỹ lưỡng.',
    practice: 'Bài học: Đầu tư tốn vốn ngay lập tức nhưng gia tăng năng suất lâu dài. Đây là quyết định chiến lược, phù hợp với các chủ thể có vốn nhàn rỗi và tầm nhìn dài hạn.',
  },
  [ActionType.WELFARE]: {
    title: 'Phân phối lại & An sinh xã hội',
    icon: <Heart className="w-5 h-5 text-red-400" />,
    theory: 'Phân phối lại là chức năng quan trọng của Nhà nước trong nền kinh tế thị trường định hướng XHCN. Nhà nước sử dụng các công cụ thuế, phúc lợi, trợ cấp để đảm bảo công bằng xã hội, thu hẹp khoảng cách giàu nghèo. An sinh xã hội là lưới đỡ cho người yếu thế, góp phần ổn định chính trị - xã hội.',
    practice: 'Bài học: Phúc lợi làm giảm lợi nhuận ngắn hạn nhưng gia tăng điểm đóng góp xã hội. Đây là hành động của các chủ thể có trách nhiệm với cộng đồng.',
  },
  [ActionType.OPTIMIZE]: {
    title: 'Tối ưu chi phí & Mâu thuẫn lợi ích',
    icon: <Shield className="w-5 h-5 text-orange-400" />,
    theory: 'Mâu thuẫn giữa tối đa hóa lợi nhuận và trách nhiệm xã hội là một trong những mâu thuẫn cơ bản của kinh tế thị trường. Các doanh nghiệp có thể cắt giảm chi phí (môi trường, tiền lương, phúc lợi) để tăng lợi nhuận trước mắt, nhưng điều này gây hệ lụy xã hội lâu dài. Nhà nước cần điều tiết để cân bằng lợi ích.',
    practice: 'Bài học: Tối ưu hóa chi phí mang lại lợi nhuận cao ngay lập tức nhưng đánh đổi bằng điểm đóng góp xã hội. Đây là con dao hai lưỡi cần cân nhắc kỹ.',
  },
  [ActionType.SOCIAL]: {
    title: 'Trách nhiệm xã hội & Phát triển bền vững',
    icon: <Share2 className="w-5 h-5 text-blue-400" />,
    theory: 'Trách nhiệm xã hội của doanh nghiệp (CSR) là cam kết đóng góp vào phát triển kinh tế bền vững bằng cách nâng cao chất lượng đời sống người lao động và cộng đồng. Trong nền kinh tế thị trường định hướng XHCN, trách nhiệm xã hội là yêu cầu tất yếu, không chỉ là hoạt động từ thiện mà là chiến lược phát triển lâu dài.',
    practice: 'Bài học: Đóng góp xã hội giảm vốn ngắn hạn nhưng gia tăng mạnh điểm đóng góp xã hội. Đây là khoản "đầu tư" vào uy tín và sự bền vững.',
  },
};

export const LessonDrawer: React.FC = () => {
  const { lastActionTaken, results, player } = useGame();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (results && lastActionTaken && player?.role) {
      setOpen(true);
    }
  }, [results, lastActionTaken, player?.role]);

  if (!open || !lastActionTaken) return null;

  const lesson = LESSONS[lastActionTaken];
  if (!lesson) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[80] flex items-end sm:items-center justify-center p-4">
      <div className="backdrop-blur-md bg-[#111625] border border-green-500/20 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-start border-b border-white/5 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/10 rounded-xl">
              <Lightbulb className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-yellow-400 uppercase tracking-wider">Bài Học Kinh Tế</h3>
              <p className="text-[10px] text-gray-400">Kinh tế chính trị Mác - Lênin (Chương 5)</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2 mb-2">
          {lesson.icon}
          <span className="text-sm font-bold text-white">{lesson.title}</span>
        </div>

        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1.5 flex items-center">
            <BookOpen className="w-3 h-3 mr-1" /> Lý thuyết
          </h4>
          <p className="text-xs text-gray-200 leading-relaxed">{lesson.theory}</p>
        </div>

        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-green-400 mb-1.5 flex items-center">
            <Lightbulb className="w-3 h-3 mr-1" /> Áp dụng thực tế
          </h4>
          <p className="text-xs text-gray-200 leading-relaxed">{lesson.practice}</p>
        </div>

        <button
          onClick={() => setOpen(false)}
          className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition text-xs uppercase tracking-wider"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
};
