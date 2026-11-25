import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
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
import { useTheme } from '../contexts/ThemeContext';

const NAV_ITEMS = [
  { id: 'home', label: 'Trang chủ', path: '/', icon: Home },
  { id: 'showtimes', label: 'Lịch chiếu', path: '/showtimes', icon: Calendar },
  { id: 'movies', label: 'Phim', path: '/movies', icon: Film },
  { id: 'food', label: 'Đồ ăn', path: '/food', icon: UtensilsCrossed },
  { id: 'booking', label: 'Đặt Vé', path: '/booking', icon: Ticket },
  { id: 'news', label: 'Tin tức & Ưu đãi', path: '/news', icon: Gift },
  { id: 'membership', label: 'Thành Viên', path: '/membership', icon: Award },
];

const HIDE_ON_PATHS = ['/login', '/register', '/forgot-password'];

// Lưu tọa độ nút hoạt động trước đó ở module scope để duy trì vị trí mượt mà
let lastPillCoords = null;

const BottomNav = ({ activeId }) => {
  const location = useLocation();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const containerRef = useRef(null);
  const itemRefs = useRef({});

  // Ẩn thanh BottomNav trên các trang đăng nhập/đăng ký hoặc quản trị admin/staff
  const isHidden = 
    HIDE_ON_PATHS.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`)) ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/staff');

  // Xác định nút đang active
  const activeItem = NAV_ITEMS.find((item) => {
    if (activeId) return activeId === item.id;
    if (item.path === '/' && location.pathname === '/') return true;
    if (item.id === 'membership' && (location.pathname.startsWith('/membership') || location.pathname.startsWith('/user'))) return true;
    if (item.id === 'booking' && location.pathname.startsWith('/booking')) return true;
    if (item.path !== '/' && location.pathname.startsWith(item.path)) return true;
    return false;
  });

  // State tọa độ của viên thuốc trượt
  const [pillStyle, setPillStyle] = useState(() => lastPillCoords);
  const [hasTransition, setHasTransition] = useState(false);

  // Cập nhật vị trí viên thuốc khi activeItem thay đổi
  useLayoutEffect(() => {
    if (isHidden || !activeItem) return;
    const targetEl = itemRefs.current[activeItem.id];
    if (!targetEl) return;

    const newCoords = {
      left: targetEl.offsetLeft,
      top: targetEl.offsetTop,
      width: targetEl.offsetWidth,
      height: targetEl.offsetHeight,
      id: activeItem.id,
    };

    if (pillStyle && pillStyle.id !== activeItem.id) {
      setHasTransition(true);
      setPillStyle(newCoords);
      lastPillCoords = newCoords;
    } else {
      setPillStyle(newCoords);
      lastPillCoords = newCoords;
      const timer = setTimeout(() => {
        setHasTransition(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeItem?.id, isHidden]);

  // Cuộn thanh nav ngang trên mobile để nút active luôn hiển thị ở giữa
  useEffect(() => {
    if (activeItem && itemRefs.current[activeItem.id]) {
      const targetEl = itemRefs.current[activeItem.id];
      if (typeof targetEl.scrollIntoView === 'function') {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeItem?.id]);

  // Canh chỉnh lại tọa độ khi người dùng thay đổi kích thước cửa sổ (resize)
  useEffect(() => {
    const handleResize = () => {
      if (activeItem && itemRefs.current[activeItem.id]) {
        const el = itemRefs.current[activeItem.id];
        const newCoords = {
          left: el.offsetLeft,
          top: el.offsetTop,
          width: el.offsetWidth,
          height: el.offsetHeight,
          id: activeItem.id,
        };
        setPillStyle(newCoords);
        lastPillCoords = newCoords;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeItem?.id]);

  // Kích hoạt chuyển động ngay lập tức khi người dùng click
  const handleItemClick = (item) => {
    const targetEl = itemRefs.current[item.id];
    if (!targetEl) return;

    const newCoords = {
      left: targetEl.offsetLeft,
      top: targetEl.offsetTop,
      width: targetEl.offsetWidth,
      height: targetEl.offsetHeight,
      id: item.id,
    };

    setHasTransition(true);
    setPillStyle(newCoords);
    lastPillCoords = newCoords;
  };

  if (isHidden) {
    return null;
  }

  return (
    <nav 
      aria-label="Thanh điều hướng chính"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-[96vw] sm:max-w-max"
    >
      <div
        className={`flex items-center gap-1 sm:gap-1.5 backdrop-blur-xl border px-2 sm:px-3 py-1.5 sm:py-2 rounded-full overflow-x-auto no-scrollbar transition-colors duration-200 ${
          isLight
            ? 'bg-white/95 border-slate-200/90 shadow-[0_12px_35px_rgba(15,23,42,0.14)]'
            : 'bg-[#0e0e11]/90 border-zinc-700/60 shadow-[0_12px_40px_rgba(0,0,0,0.7)]'
        }`}
      >
        
        {/* Left Badge / Cinema Logo Icon (inspired by nav.jpg capsule) */}
        <Link
          to="/"
          className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full text-[#e50914] flex items-center justify-center transition border shadow-inner group mr-1 ${
            isLight
              ? 'bg-red-50 hover:bg-red-100 border-red-200/80'
              : 'bg-zinc-800/90 hover:bg-zinc-700 border-zinc-700/50'
          }`}
          title="Akashi Cinema"
        >
          <Clapperboard className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:rotate-12 transition-transform" />
        </Link>

        {/* Navigation Items Container with Sliding Active Indicator */}
        <div 
          ref={containerRef}
          className="relative flex items-center gap-0.5 sm:gap-1"
        >
          {/* Viên thuốc nền đỏ trượt mượt mà giữa các nút */}
          {pillStyle && (
            <div
              aria-hidden="true"
              className={`absolute top-0 bottom-0 rounded-full bg-[#e50914] shadow-md shadow-red-950/30 pointer-events-none z-0 ${
                hasTransition
                  ? 'transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]'
                  : ''
              }`}
              style={{
                transform: `translate3d(${pillStyle.left}px, 0, 0)`,
                width: `${pillStyle.width}px`,
                height: `${pillStyle.height}px`,
              }}
            />
          )}

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeItem?.id === item.id;

            return (
              <Link
                key={item.id}
                ref={(el) => {
                  if (el) itemRefs.current[item.id] = el;
                }}
                to={item.path}
                onClick={() => handleItemClick(item)}
                className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap select-none transition-colors duration-200 cursor-pointer ${
                  active
                    ? 'keep-text-white text-white'
                    : isLight
                      ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors duration-200 ${
                    active
                      ? 'keep-text-white text-white'
                      : isLight
                        ? 'text-slate-500 group-hover:text-slate-900'
                        : 'text-zinc-400 group-hover:text-white'
                  }`}
                />
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

