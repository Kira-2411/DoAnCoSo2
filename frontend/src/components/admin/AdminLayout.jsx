import React, { useState, createContext, useContext } from 'react';
import { Link } from 'react-router-dom';
import { 
  Film, 
  Calendar, 
  UtensilsCrossed, 
  Gift, 
  Users, 
  BarChart2, 
  LogOut, 
  Shield, 
  Clapperboard,
  CheckCircle,
  AlertCircle,
  X,
  Home
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminToastContext = createContext(null);

export const useAdminToast = () => {
  const context = useContext(AdminToastContext);
  if (!context) {
    throw new Error('useAdminToast phải được dùng bên trong AdminLayout');
  }
  return context;
};

const NAV_ITEMS = [
  { id: 'movies', label: 'Phim', icon: Film },
  { id: 'showtimes', label: 'Suất chiếu', icon: Calendar },
  { id: 'foods', label: 'Đồ ăn', icon: UtensilsCrossed },
  { id: 'news_promos', label: 'Tin tức & Ưu đãi', icon: Gift },
  { id: 'users', label: 'Người dùng', icon: Users },
  { id: 'reports', label: 'Thống kê', icon: BarChart2 },
];

const AdminLayout = ({ activeTab, onTabChange, children }) => {
  const { user, logout } = useAuth();
  const [toasts, setToasts] = useState([]);

  const showToast = (arg1, arg2 = 'success') => {
    let type = 'success';
    let message = '';
    if (arg1 === 'success' || arg1 === 'error' || arg1 === 'info' || arg1 === 'warning') {
      type = arg1;
      message = arg2;
    } else {
      message = arg1;
      type = arg2;
    }
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <AdminToastContext.Provider value={{ showToast }}>
      <div className="h-screen w-full bg-[#101012] text-white flex flex-col md:flex-row overflow-hidden font-sans selection:bg-red-600 selection:text-white">
        {/* DESKTOP SIDEBAR (Trái, màn hình rộng - Cố định toàn màn hình) */}
        <aside className="hidden md:flex flex-col w-64 h-full bg-[#161618] border-r border-zinc-800/80 p-5 flex-shrink-0 justify-between overflow-y-auto no-scrollbar">
          <div>
            {/* Logo / Cinema Brand */}
            <div className="flex items-center gap-3 pb-6 border-b border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 text-[#e50914] flex items-center justify-center border border-red-800/40 shadow-inner">
                <Clapperboard className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-base font-black tracking-wider text-white">AKASHI</h1>
                <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest block -mt-1">
                  Trang Quản Trị
                </span>
              </div>
            </div>

            {/* Current Admin User Info */}
            <div className="py-4 my-3 px-3 bg-zinc-900/80 rounded-xl border border-zinc-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-950/60 border border-red-700/60 text-[#e50914] flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">
                  {user?.username || user?.email || 'Quản trị viên'}
                </p>
                <span className="inline-block px-1.5 py-0.5 rounded bg-red-600/30 text-red-400 text-[10px] font-extrabold uppercase mt-0.5">
                  {user?.role || 'ADMIN'}
                </span>
              </div>
            </div>

            {/* Navigation Menu Links */}
            <nav className="mt-4 space-y-1.5" aria-label="Menu quản trị">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 cursor-pointer text-left ${
                      isActive
                        ? 'bg-[#e50914] text-white shadow-md shadow-red-950/60'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Navigation: Về trang chủ & Đăng xuất */}
          <div className="pt-4 border-t border-zinc-800 space-y-2">
            <Link
              to="/"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 font-semibold text-xs transition cursor-pointer"
            >
              <Home className="w-4 h-4 text-[#e50914]" />
              <span>Về trang chủ</span>
            </Link>

            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-red-950/40 hover:border-red-800/60 font-semibold text-xs transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* MOBILE TOP HEADER & HORIZONTAL TAB BAR (Điện thoại) */}
        <header className="md:hidden bg-[#161618] border-b border-zinc-800 p-4 sticky top-0 z-40 flex-shrink-0">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-[#e50914]" />
              <span className="font-black text-sm text-white">AKASHI ADMIN</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-300 font-semibold truncate max-w-[100px] hidden sm:inline">
                {user?.username || user?.email}
              </span>
              <Link
                to="/"
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1 text-xs transition"
                title="Về trang chủ"
              >
                <Home className="w-4 h-4 text-[#e50914]" />
                <span className="hidden sm:inline">Trang chủ</span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Horizontal scrollable tab pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#e50914] text-white shadow-md'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* MAIN CONTENT AREA: Cột nội dung bên phải tự cuộn độc lập */}
        <main className="flex-1 h-full overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* TOAST CONTAINER */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-xl border shadow-2xl flex items-start gap-3 animate-in slide-in-from-right duration-200 ${
                toast.type === 'error'
                  ? 'bg-red-950/95 border-red-700/80 text-white'
                  : 'bg-emerald-950/95 border-emerald-700/80 text-white'
              }`}
            >
              {toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
                {toast.message}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-zinc-400 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminToastContext.Provider>
  );
};

export default AdminLayout;
