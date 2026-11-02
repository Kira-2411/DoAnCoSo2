import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, User, Moon, Sun, Shield, LogOut, LogIn, UserPlus, Ticket } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleManageClick = () => {
    if (user?.role === 'ADMIN') {
      navigate('/admin');
    } else if (user?.role === 'STAFF') {
      navigate('/staff');
    } else {
      // Default to /admin (ProtectedRoute will redirect to login if not authorized)
      navigate('/admin');
    }
  };

  const handleMyTicketsClick = () => {
    if (location.pathname === '/') {
      const ticketsSection = document.getElementById('my-tickets');
      if (ticketsSection) {
        ticketsSection.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate('/#my-tickets');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#141414]/95 dark:bg-[#141414]/95 backdrop-blur-md border-b border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Home Icon & Brand */}
        <div className="flex items-center space-x-3">
          <Link
            to="/"
            className="flex items-center space-x-2 text-[#e50914] hover:opacity-90 transition group"
            title="Trang chủ Akashi Cinema"
          >
            <div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Home className="w-5 h-5 text-[#e50914]" />
            </div>
            <span className="font-black text-xl sm:text-2xl tracking-wider text-[#e50914] select-none">
              AKASHI CINEMA
            </span>
          </Link>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Nút Quản lí (Pill đỏ) */}
          <button
            onClick={handleManageClick}
            type="button"
            className="bg-[#e50914] hover:bg-[#b80710] text-white text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full transition shadow-md shadow-red-950/20 cursor-pointer flex items-center space-x-1"
          >
            <Shield className="w-3.5 h-3.5 hidden sm:inline-block" />
            <span>Quản lí</span>
          </button>

          {/* Vé của tôi */}
          <button
            onClick={handleMyTicketsClick}
            type="button"
            className="text-zinc-200 hover:text-[#e50914] text-xs sm:text-sm font-medium transition cursor-pointer select-none"
          >
            Vé của tôi
          </button>

          {/* User Icon & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setUserDropdownOpen((prev) => !prev)}
              type="button"
              className="w-9 h-9 rounded-full bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-200 flex items-center justify-center transition border border-zinc-700/50 cursor-pointer"
              title="Tài khoản"
              aria-label="Tài khoản"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#1e1e1e] border border-zinc-800 shadow-2xl py-2 text-sm z-50 animate-in fade-in zoom-in-95 duration-150">
                {user ? (
                  <>
                    <div className="px-4 py-3 border-b border-zinc-800/80">
                      <p className="text-xs text-zinc-400 font-medium">Đã đăng nhập với</p>
                      <p className="text-white font-semibold truncate mt-0.5">
                        {user.username || user.email}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600/20 text-[#e50914] border border-red-600/30">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      to="/membership"
                      onClick={() => setUserDropdownOpen(false)}
                      className="px-4 py-2 text-zinc-300 hover:bg-zinc-800/70 hover:text-white transition flex items-center space-x-2"
                    >
                      <User className="w-4 h-4 text-[#e50914]" />
                      <span>Hồ sơ thành viên</span>
                    </Link>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleMyTicketsClick();
                      }}
                      className="w-full text-left px-4 py-2 text-zinc-300 hover:bg-zinc-800/70 hover:text-white transition flex items-center space-x-2"
                    >
                      <Ticket className="w-4 h-4 text-zinc-400" />
                      <span>Vé đã đặt</span>
                    </button>

                    {(user.role === 'ADMIN' || user.role === 'STAFF') && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleManageClick();
                        }}
                        className="w-full text-left px-4 py-2 text-zinc-300 hover:bg-zinc-800/70 hover:text-white transition flex items-center space-x-2"
                      >
                        <Shield className="w-4 h-4 text-[#e50914]" />
                        <span>Trang quản trị ({user.role})</span>
                      </button>
                    )}

                    <div className="border-t border-zinc-800/80 my-1"></div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-950/20 hover:text-red-300 transition flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2.5 border-b border-zinc-800/80">
                      <p className="text-xs text-zinc-400 font-medium">Khách vãng lai</p>
                    </div>
                    <Link
                      to="/login"
                      onClick={() => setUserDropdownOpen(false)}
                      className="px-4 py-2 text-zinc-200 hover:bg-zinc-800/70 hover:text-white transition flex items-center space-x-2"
                    >
                      <LogIn className="w-4 h-4 text-zinc-400" />
                      <span>Đăng nhập</span>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setUserDropdownOpen(false)}
                      className="px-4 py-2 text-zinc-200 hover:bg-zinc-800/70 hover:text-white transition flex items-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4 text-zinc-400" />
                      <span>Đăng ký</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            type="button"
            className="w-9 h-9 rounded-full bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-200 flex items-center justify-center transition border border-zinc-700/50 cursor-pointer"
            title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-amber-300 transition-transform hover:rotate-12" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500 transition-transform hover:rotate-45" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

