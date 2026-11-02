import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Film, 
  UtensilsCrossed, 
  Ticket, 
  Gift, 
  Award,
  Clapperboard
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home', label: 'Trang chủ', path: '/', icon: Home },
  { id: 'showtimes', label: 'Lịch chiếu', path: '/showtimes', icon: Calendar },
  { id: 'movies', label: 'Phim', path: '/movies', icon: Film },
  { id: 'food', label: 'Đồ ăn', path: '/food', icon: UtensilsCrossed },
  { id: 'booking', label: 'Đặt Vé', path: '/booking', icon: Ticket },
  { id: 'news', label: 'Tin tức & Ưu đãi', path: '/news', icon: Gift },
  { id: 'membership', label: 'Thành Viên', path: '/membership', icon: Award },
];

const BottomNav = ({ activeId }) => {
  const location = useLocation();

  const isItemActive = (item) => {
    if (activeId) return activeId === item.id;
    if (item.path === '/' && location.pathname === '/') return true;
    if (item.path !== '/' && location.pathname.startsWith(item.path)) return true;
    return false;
  };

  return (
    <nav 
      aria-label="Thanh điều hướng chính"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-[96vw] sm:max-w-max"
    >
      <div className="flex items-center gap-1 sm:gap-1.5 bg-[#0e0e11]/90 backdrop-blur-xl border border-zinc-700/60 shadow-[0_12px_40px_rgba(0,0,0,0.7)] px-2 sm:px-3 py-1.5 sm:py-2 rounded-full overflow-x-auto no-scrollbar transition-all duration-200">
        
        {/* Left Badge / Cinema Logo Icon (inspired by nav.jpg capsule) */}
        <Link
          to="/"
          className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-[#e50914] flex items-center justify-center transition border border-zinc-700/50 shadow-inner group mr-1"
          title="Akashi Cinema"
        >
          <Clapperboard className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:rotate-12 transition-transform" />
        </Link>

        {/* Navigation Items */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 whitespace-nowrap select-none ${
                  active
                    ? 'bg-[#e50914] text-white shadow-md shadow-red-950/40 font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${active ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;

