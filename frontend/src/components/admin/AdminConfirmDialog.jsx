import React, { useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

const AdminConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận hành động',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  isDanger = true,
  loading = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-[#18181b] border border-zinc-700/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Warning Icon */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            isDanger ? 'bg-red-950/40 text-red-500 border border-red-800/50' : 'bg-amber-950/40 text-amber-500 border border-amber-800/50'
          }`}
        >
          <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
        </div>

        <h3 className="text-base sm:text-lg font-black text-white tracking-wide mb-2">
          {title}
        </h3>

        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-6 whitespace-pre-line">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-700 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs sm:text-sm transition cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
              isDanger
                ? 'bg-[#e50914] hover:bg-[#b80710] shadow-md shadow-red-950/50'
                : 'bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-950/50'
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminConfirmDialog;

