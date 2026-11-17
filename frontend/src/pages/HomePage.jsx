import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  LogIn,
  Copy,
  Check,
  Mail,
  MapPin,
  QrCode,
  Info,
  X
} from 'lucide-react';

import Header from '../components/Header';
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

// Ánh xạ trạng thái đơn đặt vé từ backend sang giao diện (PAID: Emerald, PENDING: Amber, CANCELLED: Red, EXPIRED: Neutral Gray)
const getStatusBadge = (status) => {
  switch (status) {
    case 'PAID':
      return {
        text: 'Đã thanh toán',
        color: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        dot: 'bg-emerald-400',
      };
    case 'PENDING':
      return {
        text: 'Chờ thanh toán',
        color: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        dot: 'bg-amber-400',
      };
    case 'CANCELLED':
      return {
        text: 'Đã hủy',
        color: 'bg-red-500/15 text-red-400 border border-red-500/30',
        dot: 'bg-red-400',
      };
    case 'EXPIRED':
      return {
        text: 'Hết hạn',
        color: 'bg-zinc-700/40 text-zinc-400 border border-zinc-600/40',
        dot: 'bg-zinc-400',
      };
    default:
      return {
        text: status || 'Chưa rõ',
        color: 'bg-zinc-700/40 text-zinc-300 border border-zinc-600/40',
        dot: 'bg-zinc-400',
      };
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

// Định dạng ngày khởi chiếu DD/MM/YYYY
const formatDateOnly = (dateStr) => {
  if (!dateStr) return 'Đang cập nhật';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

// Màu nhãn giới hạn độ tuổi đồng bộ với trang Phim (BR-MOV-01)
const getAgeColor = (ageLimit) => {
  switch (ageLimit) {
    case 'P':
      return 'bg-emerald-600';
    case 'T13':
      return 'bg-rose-600';
    case 'T16':
      return 'bg-amber-600';
    case 'T18':
      return 'bg-red-700';
    default:
      return 'bg-zinc-700';
  }
};

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const ticketScrollRef = useRef(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // State Modal xem Vé điện tử & Mã QR (BR-TIC-01)
  const [selectedTicket, setSelectedTicket] = useState(null);

  // State Modal xem chi tiết phim ở mục Phim Đang Hot
  const [selectedMovieDetail, setSelectedMovieDetail] = useState(null);
  const [loadingMovieDetail, setLoadingMovieDetail] = useState(false);

  // Tự động cuộn mượt xuống mục #my-tickets khi điều hướng từ trang khác về /#my-tickets
  useEffect(() => {
    if (location.hash === '#my-tickets') {
      const timer = setTimeout(() => {
        const el = document.getElementById('my-tickets');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [location.hash]);

  // Mở modal xem chi tiết phim (gọi GET /api/movies/{id})
  const handleOpenMovieDetail = async (movie) => {
    if (!movie) return;
    try {
      setLoadingMovieDetail(true);
      setSelectedMovieDetail(movie);
      const res = await movieApi.getMovieById(movie.movieId);
      if (res?.data) {
        setSelectedMovieDetail(res.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết phim:', err);
      setSelectedMovieDetail(movie);
    } finally {
      setLoadingMovieDetail(false);
    }
  };

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

  // Cuộn danh sách vé ngang mượt mà bằng scrollBy
  const handleScrollTickets = (direction) => {
    if (ticketScrollRef.current) {
      const { clientWidth } = ticketScrollRef.current;
      const scrollAmount = Math.max(320, clientWidth * 0.75);
      ticketScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Sao chép mã đặt vé vào bộ nhớ tạm
  const handleCopyBookingCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode((prev) => (prev === code ? null : prev));
    }, 2000);
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

            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => handleScrollTickets('left')}
                type="button"
                className="flex w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white items-center justify-center transition border border-zinc-700/50 cursor-pointer active:scale-95"
                aria-label="Cuộn trái"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleScrollTickets('right')}
                type="button"
                className="flex w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white items-center justify-center transition border border-zinc-700/50 cursor-pointer active:scale-95"
                aria-label="Cuộn phải"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <Link
                to="/membership?tab=tickets"
                className="text-xs sm:text-sm text-zinc-400 hover:text-[#e50914] transition font-medium flex items-center gap-1 ml-1 sm:ml-2"
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

          {/* Trạng thái đang tải dữ liệu (Skeleton Loading) */}
          {user && loadingTickets && (
            <div
              className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-2 pt-1"
              aria-busy="true"
              aria-label="Đang tải danh sách vé"
            >
              {[1, 2, 3].map((skeletonIdx) => (
                <div
                  key={skeletonIdx}
                  className="min-w-[300px] sm:min-w-[340px] max-w-[360px] flex-shrink-0 bg-[#18181b] border border-zinc-800/90 rounded-2xl p-5 shadow-xl animate-pulse space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 bg-zinc-800 rounded-md w-3/4"></div>
                      <div className="h-4 bg-zinc-800/70 rounded-md w-1/2"></div>
                    </div>
                    <div className="h-6 bg-zinc-800 rounded-full w-24"></div>
                  </div>
                  <div className="border-t border-dashed border-zinc-800 my-2"></div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between">
                      <div className="h-3.5 bg-zinc-800/70 rounded w-20"></div>
                      <div className="h-3.5 bg-zinc-800 rounded w-32"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-3.5 bg-zinc-800/70 rounded w-20"></div>
                      <div className="h-3.5 bg-zinc-800 rounded w-24"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-3.5 bg-zinc-800/70 rounded w-16"></div>
                      <div className="h-5 bg-zinc-800 rounded w-28"></div>
                    </div>
                    <div className="flex justify-between pt-1">
                      <div className="h-4 bg-zinc-800/70 rounded w-24"></div>
                      <div className="h-5 bg-zinc-800 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-zinc-800/60 flex justify-between">
                    <div className="h-3 bg-zinc-800/60 rounded w-32"></div>
                    <div className="h-3 bg-zinc-800/60 rounded w-24"></div>
                  </div>
                </div>
              ))}
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
          {user && !loadingTickets && !ticketError && tickets.length > 0 && (
            <div
              ref={ticketScrollRef}
              className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-2 pt-1 select-none scroll-smooth"
            >
              {tickets.map((ticket) => {
                const statusBadge = getStatusBadge(ticket.status);
                const seatArray = Array.isArray(ticket.seats)
                  ? ticket.seats
                  : ticket.seats
                  ? String(ticket.seats).split(',').map((s) => s.trim()).filter(Boolean)
                  : [];
                const rawCode = ticket.bookingCode || String(ticket.bookingId || '');
                const displayCode = ticket.bookingCode || `#${ticket.bookingId}`;
                const isCopied = copiedCode === rawCode;

                return (
                  <div
                    key={ticket.bookingId || ticket.bookingCode}
                    onClick={() => setSelectedTicket(ticket)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedTicket(ticket);
                      }
                    }}
                    className="group relative min-w-[300px] sm:min-w-[340px] max-w-[360px] flex-shrink-0 bg-[#18181b] hover:bg-[#1d1d21] border border-zinc-800/90 hover:border-red-500/40 rounded-2xl p-4 sm:p-5 shadow-xl transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between overflow-hidden cursor-pointer"
                  >
                    {/* 1. Header: Movie Title, Booking Code + Copy, Status Badge */}
                    <div>
                      <div className="flex items-start justify-between gap-2.5">
                        <h3
                          className="text-sm sm:text-base font-extrabold text-white group-hover:text-[#e50914] transition-colors leading-snug line-clamp-1 flex-1"
                          title={ticket.movieTitle}
                        >
                          {ticket.movieTitle || '—'}
                        </h3>

                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${statusBadge.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`}></span>
                          <span>{statusBadge.text}</span>
                        </span>
                      </div>

                      {/* Booking Code in Monospace + Copy Button + QR Hint */}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 px-2.5 py-1 rounded-lg">
                          <span className="text-[11px] text-zinc-400">Mã vé:</span>
                          <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-[#e50914]">
                            {displayCode}
                          </span>
                          {rawCode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyBookingCode(rawCode);
                              }}
                              type="button"
                              className="ml-1 text-zinc-400 hover:text-white transition cursor-pointer p-0.5 rounded"
                              title={isCopied ? 'Đã sao chép mã vé' : 'Sao chép mã vé'}
                              aria-label="Sao chép mã vé"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>

                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 group-hover:text-zinc-200 transition">
                          <QrCode className="w-3.5 h-3.5 text-[#e50914]" />
                          <span>Mã QR</span>
                        </span>
                      </div>
                    </div>

                    {/* Ticket Perforation Divider (Notch + Dashed Line) */}
                    <div className="relative my-3.5 flex items-center">
                      <div className=" -ml-7 w-4 h-4 rounded-full bg-[#141414] border-r border-zinc-800/90 flex-shrink-0"></div>
                      <div className="w-full border-t border-dashed border-zinc-800"></div>
                      <div className="-mr-7 w-4 h-4 rounded-full bg-[#141414] border-l border-zinc-800/90 flex-shrink-0"></div>
                    </div>

                    {/* 2. Ticket Body: Showtime, Cinema Room, Seats, Total Price */}
                    <div className="space-y-2.5 text-xs sm:text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-zinc-400 flex items-center gap-1.5 flex-shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Suất chiếu:</span>
                        </span>
                        <span className="text-zinc-100 font-semibold text-right">
                          {formatDateTime(ticket.showtime)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-zinc-400 flex items-center gap-1.5 flex-shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Phòng chiếu:</span>
                        </span>
                        <span className="text-zinc-200 font-semibold text-right">
                          {ticket.roomName || '—'}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <span className="text-zinc-400 flex items-center gap-1.5 flex-shrink-0 pt-0.5">
                          <Ticket className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Ghế ngồi:</span>
                        </span>
                        <div className="flex flex-wrap justify-end gap-1 max-w-[200px]">
                          {seatArray.length > 0 ? (
                            seatArray.map((seat) => (
                              <span
                                key={seat}
                                className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/25 text-red-400 font-bold text-[11px] leading-tight"
                              >
                                {seat}
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-500 font-medium">—</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-zinc-800/60">
                        <span className="text-zinc-400 font-medium flex-shrink-0">Tổng giá vé:</span>
                        <span className="text-[#e50914] font-black text-sm sm:text-base text-right">
                          {ticket.totalPrice != null
                            ? `${Number(ticket.totalPrice).toLocaleString('vi-VN')} đ`
                            : '—'}
                        </span>
                      </div>
                    </div>

                    {/* 3. Metadata Footer: User Email & Booking Time */}
                    <div className="mt-3.5 pt-2.5 border-t border-zinc-800/70 flex items-center justify-between gap-2 text-[11px] text-zinc-400">
                      <span
                        className="flex items-center gap-1 truncate max-w-[165px]"
                        title={ticket.email || user?.email || ''}
                      >
                        <Mail className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                        <span className="truncate">{ticket.email || user?.email || '—'}</span>
                      </span>
                      <span className="flex items-center gap-1 flex-shrink-0 text-right">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>{formatDateTime(ticket.createdAt)}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
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
            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-5"
              aria-busy="true"
              aria-label="Đang tải danh sách phim đang chiếu"
            >
              {[1, 2, 3, 4, 5].map((skeletonIdx) => (
                <div
                  key={skeletonIdx}
                  className="bg-[#1c1c1f] rounded-2xl overflow-hidden border border-zinc-800/90 flex flex-col animate-pulse"
                >
                  <div className="aspect-[3/4] w-full bg-zinc-800/80" />
                  <div className="p-3 sm:p-4 space-y-3">
                    <div className="space-y-1.5">
                      <div className="h-4 bg-zinc-800 rounded w-4/5" />
                      <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
                    </div>
                    <div className="h-8 bg-zinc-800 rounded-xl w-full" />
                  </div>
                </div>
              ))}
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
                  {/* Poster Graphic Artwork (Click mở Modal chi tiết phim) */}
                  <div
                    onClick={() => handleOpenMovieDetail(movie)}
                    className="relative aspect-[3/4] w-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex flex-col justify-between overflow-hidden cursor-pointer"
                  >
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

                    {/* Top Badges (Đồng bộ màu giới hạn tuổi P/T13/T16/T18) */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
                      <span
                        className={`text-white font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-md shadow ${getAgeColor(movie.ageLimit)}`}
                      >
                        {movie.ageLimit || 'P'}
                      </span>
                      <span className="bg-black/60 backdrop-blur-md text-white font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-md border border-white/10">
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
                        onClick={() => handleOpenMovieDetail(movie)}
                        className="text-xs sm:text-sm font-bold text-white group-hover:text-[#e50914] transition-colors line-clamp-1 cursor-pointer"
                        title={movie.title}
                      >
                        {movie.title}
                      </h3>
                      <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                        {movie.genre || 'Chưa cập nhật'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenMovieDetail(movie)}
                        type="button"
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold py-2 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-center"
                        title="Xem chi tiết phim"
                        aria-label="Xem chi tiết phim"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => navigate(`/booking?movieId=${movie.movieId}`)}
                        type="button"
                        className="flex-1 bg-[#e50914] hover:bg-[#b80710] text-white text-xs font-bold py-2 px-3 rounded-xl transition duration-150 shadow-md shadow-red-950/20 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Đặt vé</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* MODAL 1: VÉ ĐIỆN TỬ & MÃ QR (BR-TIC-01) */}
      {selectedTicket && (
        <div
          onClick={() => setSelectedTicket(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[#18181b] border border-zinc-700/90 rounded-3xl p-6 shadow-2xl space-y-4 overflow-hidden"
          >
            {/* Nút đóng */}
            <button
              onClick={() => setSelectedTicket(null)}
              type="button"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Vé điện tử */}
            <div className="pr-8">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#e50914] block">
                VÉ ĐIỆN TỬ AKASHI CINEMA
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                {selectedTicket.movieTitle || '—'}
              </h3>
              <div className="mt-2 flex items-center gap-2">
                {(() => {
                  const badge = getStatusBadge(selectedTicket.status);
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full ${badge.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                      <span>{badge.text}</span>
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Khung Mã QR (BR-TIC-01) */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center text-center space-y-2.5">
              <div className="bg-white p-3 rounded-2xl shadow-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    selectedTicket.bookingCode || String(selectedTicket.bookingId || 'AKASHI')
                  )}`}
                  alt={`QR ${selectedTicket.bookingCode}`}
                  className="w-40 h-40 object-contain"
                />
              </div>

              <div className="inline-flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-xl">
                <span className="text-xs text-zinc-400">Mã đặt vé:</span>
                <span className="font-mono text-sm font-black text-[#e50914] tracking-wider">
                  {selectedTicket.bookingCode || `#${selectedTicket.bookingId}`}
                </span>
                <button
                  onClick={() =>
                    handleCopyBookingCode(
                      selectedTicket.bookingCode || String(selectedTicket.bookingId || '')
                    )
                  }
                  type="button"
                  className="text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Sao chép mã vé"
                >
                  {copiedCode ===
                  (selectedTicket.bookingCode || String(selectedTicket.bookingId || '')) ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <p className="text-[11px] text-zinc-400">
                {selectedTicket.status === 'PAID'
                  ? 'Đưa mã QR này cho nhân viên tại quầy hoặc cửa soát vé để vào phòng chiếu.'
                  : 'Mã đặt vé dùng để tra cứu hoặc đối soát tại quầy vé Akashi Cinema.'}
              </p>
            </div>

            {/* Chi tiết vé */}
            <div className="space-y-2 text-xs sm:text-sm bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4">
              <div className="flex justify-between">
                <span className="text-zinc-400">Suất chiếu:</span>
                <span className="text-white font-bold">{formatDateTime(selectedTicket.showtime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Phòng chiếu:</span>
                <span className="text-zinc-200 font-semibold">{selectedTicket.roomName || '—'}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-zinc-400">Ghế ngồi:</span>
                <span className="text-red-400 font-bold text-right">
                  {Array.isArray(selectedTicket.seats) && selectedTicket.seats.length > 0
                    ? selectedTicket.seats.join(', ')
                    : selectedTicket.seats || '—'}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-800">
                <span className="text-zinc-400 font-medium">Tổng thanh toán:</span>
                <span className="text-[#e50914] font-black text-base">
                  {selectedTicket.totalPrice != null
                    ? `${Number(selectedTicket.totalPrice).toLocaleString('vi-VN')} đ`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-zinc-400 pt-1">
                <span>Email: {selectedTicket.email || user?.email || '—'}</span>
                <span>Đặt lúc: {formatDateTime(selectedTicket.createdAt)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTicket(null)}
              type="button"
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 rounded-xl transition cursor-pointer text-xs sm:text-sm"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: CHI TIẾT PHIM Ở MỤC PHIM ĐANG HOT */}
      {selectedMovieDetail && (
        <div
          onClick={() => setSelectedMovieDetail(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[#1c1c1f] border border-zinc-700 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            {/* Nút đóng modal */}
            <button
              onClick={() => setSelectedMovieDetail(null)}
              type="button"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header modal */}
            <div className="flex items-start space-x-3 pr-8">
              <span
                className={`text-white font-black text-xs px-2.5 py-1 rounded-md flex-shrink-0 ${getAgeColor(
                  selectedMovieDetail.ageLimit
                )}`}
              >
                {selectedMovieDetail.ageLimit || 'P'}
              </span>
              <div>
                <h2 className="text-xl font-black text-white">
                  {selectedMovieDetail.title}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {selectedMovieDetail.genre || 'Phim rạp'} •{' '}
                  {selectedMovieDetail.duration
                    ? `${selectedMovieDetail.duration} phút`
                    : '120 phút'}
                </p>
              </div>
            </div>

            {/* Nội dung mô tả */}
            <div className="space-y-3 text-sm text-zinc-300">
              <div>
                <span className="text-zinc-400 text-xs font-semibold block mb-1">
                  Mô tả nội dung phim:
                </span>
                {loadingMovieDetail && !selectedMovieDetail.description ? (
                  <div className="h-20 bg-zinc-900/60 rounded-xl border border-zinc-800 animate-pulse p-3 flex items-center justify-center text-xs text-zinc-500">
                    Đang tải chi tiết phim...
                  </div>
                ) : (
                  <p className="leading-relaxed bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 text-xs sm:text-sm">
                    {selectedMovieDetail.description || 'Chưa có thông tin tóm tắt cho bộ phim này.'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/70">
                <div>
                  <span className="text-zinc-400 font-semibold block">Khởi chiếu:</span>
                  <span className="text-emerald-400 font-bold">
                    {formatDateOnly(selectedMovieDetail.releaseDate)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 font-semibold block">Trạng thái:</span>
                  <span className="text-white font-semibold">Đang chiếu tại rạp</span>
                </div>
              </div>
            </div>

            {/* Footer modal: nút hành động */}
            <div className="pt-2 flex space-x-3">
              <button
                onClick={() => setSelectedMovieDetail(null)}
                type="button"
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 px-5 rounded-xl transition cursor-pointer text-xs sm:text-sm"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  const id = selectedMovieDetail.movieId;
                  setSelectedMovieDetail(null);
                  navigate(`/booking?movieId=${id}`);
                }}
                type="button"
                className="flex-1 bg-[#e50914] hover:bg-[#b80710] text-white font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-red-950/40 text-xs sm:text-sm"
              >
                <Ticket className="w-4 h-4" />
                <span>Đặt vé xem phim này</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Messenger Floating Action Button */}
      <MessengerButton />
    </div>
  );
};

export default HomePage;
