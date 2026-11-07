import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AdminPagination = ({
  page = 0,
  totalPages = 1,
  totalElements = 0,
  onPageChange,
}) => {
  if (totalElements === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800 text-xs sm:text-sm text-zinc-400">
      <div>
        <span>
          Trang <span className="font-bold text-white">{page + 1}</span> / <span className="font-bold text-white">{totalPages}</span>
        </span>
        <span className="mx-2">•</span>
        <span>
          Tổng số: <span className="font-bold text-white">{totalElements}</span> bản ghi
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Trước</span>
        </button>

        {/* Danh sách các số trang */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, idx) => {
            // Hiển thị gọn nếu nhiều trang
            if (totalPages > 7) {
              if (idx !== 0 && idx !== totalPages - 1 && Math.abs(idx - page) > 1) {
                if (idx === 1 || idx === totalPages - 2) {
                  return (
                    <span key={idx} className="px-1 text-zinc-600">
                      ...
                    </span>
                  );
                }
                return null;
              }
            }

            const isCurrent = idx === page;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onPageChange(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                  isCurrent
                    ? 'bg-[#e50914] text-white shadow-md shadow-red-950/50'
                    : 'border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AdminPagination;

