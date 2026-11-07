import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  Calendar, 
  Film, 
  UtensilsCrossed, 
  Ticket, 
  Gift, 
  Award,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  ArrowRight,
  Loader2,
  TicketX,
  LogIn
} from 'lucide-react';

import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import MessengerButton from '../components/MessengerButton';
import heroBannerImg from '../assets/images/AnhBiaAkashiCinema.png';
import { useAuth } from '../contexts/AuthContext';
import bookingApi from '../api/bookingApi';
import movieApi from '../api/movieApi';

// Danh sách các mục điều hướng nhanh trong nội dung trang (Quick Nav Cards)
const QUICK_NAV_ITEMS = [
  { id: 'home', label: 'TRANG CHỦ', icon: HomeIcon, active: true, path: '/' },
  { id: 'showtimes', label: 'LỊCH CHIẾU', icon: Calendar, active: false, path: '/showtimes' },
  { id: 'movies', label: 'PHIM', icon: Film, active: false, path: '/movies' },
  { id: 'food', label: 'ĐỒ ĂN', icon: UtensilsCrossed, active: false, path: '/food' },
  { id: 'booking', label: 'ĐẶT VÉ', icon: Ticket, active: false, path: '/booking' },
  { id: 'news', label: 'TIN TỨC & ƯU ĐÃI', icon: Gift, active: false, path: '/news' },
  { id: 'membership', label: 'THÀNH VIÊN', icon: Award, active: false, path: '/membership' },
];

// Ánh xạ trạng thái đơn đặt vé từ backend sang giao diện
const getStatusBadge = (status) => {
  switch (status) {
    case 'PAID':
      return { text: 'Đã thanh toán', color: 'bg-emerald-500 text-black' };
    case 'PENDING':
      return { text: 'Chờ thanh toán', color: 'bg-amber-400 text-black' };
    case 'CANCELLED':
      return { text: 'Đã hủy', color: 'bg-zinc-600 text-white' };
    case 'EXPIRED':
      return { text: 'Hết hạn', color: 'bg-red-500/80 text-white' };
    default:
      return { text: status || 'Chưa rõ', color: 'bg-zinc-700 text-white' };
  }
};

// Định dạng thời gian hiển thị DD/MM/YYYY HH:mm
const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
};

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ticketScrollRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // State lưu trữ phim thật từ backend (Phim đang hot / đang chiếu)
  const [hotMovies, setHotMovies] = useState([]);
  const [loadingHotMovies, setLoadingHotMovies] = useState(true);

  // Tải danh sách phim thật từ database
  useEffect(() => {
    let isMounted = true;
    const fetchHotMovies = async () => {
      try {
        setLoadingHotMovies(true);
        const response = await movieApi.getMovies({ status: 'NOW_SHOWING', size: 10 });
        if (isMounted) {
          setHotMovies(response.data?.content || []);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách phim đang chiếu:', err);
        if (isMounted) {
          setHotMovies([]);
        }
      } finally {
        if (isMounted) {
          setLoadingHotMovies(false);
        }
      }
    };

    fetchHotMovies();
    return () => {
      isMounted = false;
    };
  }, []);

  // State lưu trữ dữ liệu thật từ backend
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketError, setTicketError] = useState(null);

  // Tải danh sách vé thật của người dùng khi đã đăng nhập
  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setTickets([]);
      setLoadingTickets(false);
      return;
    }

    const fetchTickets = async () => {
      try {
        setLoadingTickets(true);
        setTicketError(null);
        const response = await bookingApi.getMyBookings({ page: 0, size: 10 });
        if (isMounted) {
          const content = response?.data?.content || [];
          setTickets(content);
        }
      } catch (err) {
        console.error('Lỗi khi tải lịch sử vé:', err);
        if (isMounted) {
          setTicketError('Không thể tải lịch sử vé');
        }
      } finally {
        if (isMounted) {
          setLoadingTickets(false);
        }
      }
    };

    fetchTickets();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Cuộn danh sách vé ngang
  const handleScrollTickets = (direction) => {
    if (ticketScrollRef.current) {
      const { scrollLeft, clientWidth } = ticketScrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      ticketScrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleTicketScrollEvent = () => {
    if (ticketScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ticketScrollRef.current;
      const totalScrollable = scrollWidth - clientWidth;
      if (totalScrollable > 0) {
        const progress = (scrollLeft / totalScrollable) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-red-600 selection:text-white pb-32">
      {/* 1. Header dùng chung */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-10 sm:space-y-12">
        
        {/* 2. Hero Banner (AnhBiaAkashiCinema.png) */}
        <section className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-zinc-800/80 bg-zinc-950">
          <img
            src={heroBannerImg}
            alt="Chào mừng đến với Akashi Cinema"
            className="w-full h-auto object-cover max-h-[380px] sm:max-h-[460px] md:max-h-[520px] transition-transform duration-700 hover:scale-[1.01]"
          />
          {/* Subtle bottom gradient glow */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#141414] via-transparent to-black/20"></div>
        </section>

        {/* 3. Thanh điều hướng nhanh trong nội dung trang (Quick Nav Cards) */}
        <section aria-label="Thanh điều hướng nhanh">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3.5">
            {QUICK_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.active;

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`group relative flex flex-col items-center justify-center p-3.5 sm:p-5 rounded-2xl transition-all duration-200 cursor-pointer text-center ${
                    isActive
                      ? 'border-2 border-[#e50914] bg-[#1a1a1c] shadow-lg shadow-red-950/40 transform -translate-y-0.5'
                      : 'border border-zinc-800/90 bg-[#19191c]/70 hover:bg-[#222226] hover:border-zinc-700 hover:-translate-y-1 hover:shadow-xl'
                  }`}
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2.5 transition-all duration-200 ${
                      isActive
                        ? 'bg-[#e50914]/20 text-[#e50914]'
                        : 'bg-zinc-800/80 text-zinc-300 group-hover:text-white group-hover:bg-zinc-700/80'
                    }`}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs font-bold tracking-wider select-none ${
                      isActive ? 'text-white font-extrabold' : 'text-zinc-300 group-hover:text-white'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 4. Phần "VÉ CỦA TÔI" (My Tickets Section) */}
        <section id="my-tickets" className="space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#e50914] rounded-full inline-block"></span>
              <span>VÉ CỦA TÔI</span>
            </h2>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleScrollTickets('left')}
                className="hidden sm:flex w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white items-center justify-center transition border border-zinc-700/50 cursor-pointer"
                aria-label="Cuộn trái"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleScrollTickets('right')}
                className="hidden sm:flex w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white items-center justify-center transition border border-zinc-700/50 cursor-pointer"
                aria-label="Cuộn phải"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <Link
                to="/my-tickets"
                className="text-xs sm:text-sm text-zinc-400 hover:text-[#e50914] transition font-medium flex items-center gap-1 ml-2"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Trạng thái chưa đăng nhập */}
          {!user && (
            <div className="bg-[#1c1c1f]/80 border border-zinc-800/90 rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-600/10 text-[#e50914] flex items-center justify-center">
                <LogIn className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-white font-bold text-sm sm:text-base">
                  Đăng nhập tài khoản để xem các vé xem phim bạn đã đặt
                </p>
                <p className="text-zinc-400 text-xs mt-1">
                  Quản lý vé điện tử, mã QR và lịch sử thanh toán một cách dễ dàng
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-[#e50914] hover:bg-[#b80710] text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-full transition shadow-lg shadow-red-950/50 mt-1"
              >
                <span>Đăng nhập ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Trạng thái đang tải dữ liệu */}
          {user && loadingTickets && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-400 bg-[#1c1c1f]/40 border border-zinc-800/50 rounded-2xl">
              <Loader2 className="w-7 h-7 animate-spin text-[#e50914]" />
              <span className="text-xs sm:text-sm font-medium">Đang tải danh sách vé của bạn...</span>
            </div>
          )}

          {/* Trạng thái lỗi tải dữ liệu */}
          {user && !loadingTickets && ticketError && (
            <div className="bg-[#1c1c1f]/80 border border-red-900/40 rounded-2xl p-6 text-center text-zinc-400 text-xs sm:text-sm">
              <p className="text-red-400 font-semibold">{ticketError}</p>
            </div>
          )}

          {/* Trạng thái đã đăng nhập nhưng chưa có vé nào */}
          {user && !loadingTickets && !ticketError && tickets.length === 0 && (
            <div className="bg-[#1c1c1f]/80 border border-zinc-800/90 rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-2.5">
              <div className="w-12 h-12 rounded-full bg-zinc-800/80 text-zinc-500 flex items-center justify-center">
                <TicketX className="w-6 h-6" />
              </div>
              <p className="text-white font-bold text-sm sm:text-base">
                Bạn chưa có đơn đặt vé nào
              </p>
              <p className="text-zinc-400 text-xs">
                Hãy chọn ngay một bộ phim yêu thích để trải nghiệm rạp chiếu Akashi Cinema!
              </p>
              <Link
                to="/booking"
                className="inline-flex items-center gap-1.5 text-xs text-[#e50914] hover:underline font-bold mt-1"
              >
                <span>Khám phá phim & Đặt vé ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Ticket Cards Carousel khi có dữ liệu thật */}
          {user && !loadingTickets && tickets.length > 0 && (
            <>
              <div
                ref={ticketScrollRef}
                onScroll={handleTicketScrollEvent}
                className="flex gap-4 sm:gap-5 overflow-x-auto custom-scrollbar pb-3 pt-1 select-none scroll-smooth"
              >
                {tickets.map((ticket) => {
                  const statusBadge = getStatusBadge(ticket.status);
                  const seatsText = Array.isArray(ticket.seats) ? ticket.seats.join(', ') : (ticket.seats || '—');
                  const orderCode = ticket.bookingCode || `#${ticket.bookingId}`;

                  return (
                    <div
                      key={ticket.bookingId || ticket.bookingCode}
                      className="min-w-[280px] sm:min-w-[320px] max-w-[340px] flex-shrink-0 bg-[#1c1c1f] border border-zinc-800/90 rounded-2xl p-4 sm:p-5 shadow-xl hover:border-zinc-700/80 transition-all duration-200 hover:-translate-y-0.5"
                    >
                      {/* Header card: Đơn # và trạng thái */}
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/70">
                        <span className="text-base sm:text-lg font-black text-[#e50914]">
                          {orderCode.startsWith('#') ? `Đơn ${orderCode}` : `Đơn #${orderCode}`}
                        </span>
                        <span
                          className={`text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full ${statusBadge.color}`}
                        >
                          {statusBadge.text}
                        </span>
                      </div>

                      {/* Details list */}
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-zinc-400 flex-shrink-0">Email:</span>
                          <span className="text-zinc-200 font-medium text-right truncate max-w-[190px]">
                            {user?.email || '—'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center gap-2">
                          <span className="text-zinc-400 flex-shrink-0">Suất chiếu:</span>
                          <span className="text-zinc-200 font-semibold text-right">
                            {formatDateTime(ticket.showtime)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center gap-2">
                          <span className="text-zinc-400 flex-shrink-0">Tên phim:</span>
                          <span className="text-white font-bold text-right truncate max-w-[190px]">
                            {ticket.movieTitle || '—'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center gap-2">
                          <span className="text-zinc-400 flex-shrink-0">Số phòng:</span>
                          <span className="text-zinc-200 font-medium text-right">
                            {ticket.roomName || '—'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center gap-2">
                          <span className="text-zinc-400 flex-shrink-0">Ghế:</span>
                          <span className="text-red-400 font-bold text-right">
                            {seatsText}
                          </span>
                        </div>

                        <div className="flex justify-between items-center gap-2">
                          <span className="text-zinc-400 flex-shrink-0">Tổng giá vé:</span>
                          <span className="text-[#e50914] font-extrabold text-sm sm:text-base text-right">
                            {ticket.totalPrice != null ? `${ticket.totalPrice.toLocaleString('vi-VN')} đ` : '—'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center gap-2 pt-1 border-t border-zinc-800/50 text-[11px] text-zinc-400">
                          <span className="flex-shrink-0">Thời gian đặt:</span>
                          <span className="text-right">{formatDateTime(ticket.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Indicator bar */}
              <div className="relative w-full h-1 bg-zinc-800/80 rounded-full overflow-hidden mt-1 max-w-xs mx-auto">
                <div
                  className="h-full bg-[#e50914] rounded-full transition-all duration-150"
                  style={{ width: '40%', transform: `translateX(${scrollProgress * 1.5}%)` }}
                />
              </div>
            </>
          )}
        </section>

        {/* 5. Phần "PHIM ĐANG HOT" (Hot Movies Section) */}
        <section id="hot-movies" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#e50914] rounded-full inline-block"></span>
              <span>PHIM ĐANG HOT</span>
            </h2>

            <Link
              to="/movies"
              className="text-xs sm:text-sm text-zinc-400 hover:text-[#e50914] transition font-medium flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Movie Cards Grid */}
          {loadingHotMovies ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400 bg-[#1c1c1f]/40 border border-zinc-800/50 rounded-2xl">
              <Loader2 className="w-7 h-7 animate-spin text-[#e50914] mb-2" />
              <p className="text-xs sm:text-sm font-medium">Đang tải danh sách phim đang chiếu...</p>
            </div>
          ) : hotMovies.length === 0 ? (
            <div className="bg-[#1c1c1f]/80 border border-zinc-800/90 rounded-2xl p-8 text-center text-zinc-400 text-xs sm:text-sm">
              <Film className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p>Hiện tại chưa có suất chiếu cho phim nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-5">
              {hotMovies.map((movie) => (
                <div
                  key={movie.movieId}
                  className="group relative bg-[#1c1c1f] rounded-2xl overflow-hidden border border-zinc-800/90 hover:border-zinc-700/80 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col"
                >
                  {/* Poster Graphic Artwork */}
                  <div className="relative aspect-[3/4] w-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex flex-col justify-between overflow-hidden">
                    {movie.posterUrl ? (
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <Film className="w-10 h-10 text-white/20 mb-2 group-hover:scale-110 group-hover:text-white/40 transition-all" />
                        <p className="text-white font-extrabold text-sm sm:text-base leading-tight drop-shadow-md group-hover:text-[#e50914] transition-colors">
                          {movie.title}
                        </p>
                      </div>
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
                      <span className="bg-black/70 backdrop-blur-md text-white font-extrabold text-[10px] sm:text-xs px-2 py-0.5 rounded-md border border-white/10">
                        {movie.ageLimit || 'P'}
                      </span>
                      <span className="bg-[#e50914] text-white font-extrabold text-[10px] sm:text-xs px-2 py-0.5 rounded-md shadow-md">
                        Đang chiếu
                      </span>
                    </div>

                    {/* Bottom Duration info */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between text-[11px] text-zinc-300 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>{movie.duration ? `${movie.duration}p` : '120p'}</span>
                      </span>
                      <span className="text-emerald-400 font-medium truncate max-w-[80px]">
                        {movie.genre || 'Phim rạp'}
                      </span>
                    </div>
                  </div>

                  {/* Movie Meta Information */}
                  <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between space-y-3">
                    <div>
                      <h3
                        className="text-xs sm:text-sm font-bold text-white group-hover:text-[#e50914] transition-colors line-clamp-1"
                        title={movie.title}
                      >
                        {movie.title}
                      </h3>
                      <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                        {movie.genre || 'Chưa cập nhật'}
                      </p>
                    </div>

                    <button
                      onClick={() => navigate(`/booking?movieId=${movie.movieId}`)}
                      type="button"
                      className="w-full bg-[#e50914] hover:bg-[#b80710] text-white text-xs font-bold py-2 px-3 rounded-xl transition duration-150 shadow-md shadow-red-950/20 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Đặt vé</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* 6. Messenger Floating Action Button */}
      <MessengerButton />

      {/* 7. Bottom Navigation Bar dạng nổi viên thuốc (Pill style theo ảnh nav.jpg) */}
      <BottomNav activeId="home" />
    </div>
  );
};

export default HomePage;
