import React from 'react';
import { BarChart3, Clock, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';

const AdminReports = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-rose-500" />
          Thống kê & Báo cáo Doanh thu
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Theo dõi hiệu suất doanh thu phòng vé, lượng khách và doanh số bắp nước theo thời gian thực
        </p>
      </div>

      {/* Card Placeholder "Đang phát triển" */}
      <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-8 sm:p-14 text-center max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tính năng đang phát triển</span>
        </span>

        <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
          Hệ thống Báo cáo & Phân tích Đang Được Xây Dựng
        </h3>

        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6 max-w-md mx-auto">
          Mô-đun phân tích số liệu doanh thu theo phim, phòng chiếu, suất chiếu và doanh số thực đơn sẽ được cập nhật trong phiên bản kế tiếp khi các dịch vụ tổng hợp dữ liệu hoàn tất.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-800">
            <span className="text-[11px] text-zinc-500 block">Doanh thu phòng vé</span>
            <span className="text-sm font-semibold text-zinc-300">Theo ngày / tháng</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-800">
            <span className="text-[11px] text-zinc-500 block">Tỷ lệ lấp đầy rạp</span>
            <span className="text-sm font-semibold text-zinc-300">Theo suất & phòng</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-800">
            <span className="text-[11px] text-zinc-500 block">Top phim ăn khách</span>
            <span className="text-sm font-semibold text-zinc-300">Doanh số cao nhất</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;

