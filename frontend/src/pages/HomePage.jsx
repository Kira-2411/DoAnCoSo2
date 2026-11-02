import React, { useRef, useState } from 'react';
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
  ArrowRight
} from 'lucide-react';

import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import MessengerButton from '../components/MessengerButton';
import heroBannerImg from '../assets/images/AnhBiaAkashiCinema.png';
import { useAuth } from '../contexts/AuthContext';

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

// Dữ liệu mẫu danh sách vé đã đặt theo UI/home2.png
const SAMPLE_TICKETS = [
  {
    orderId: '53',
    status: 'PAID',
    statusText: 'Đã thanh toán',
    statusColor: 'bg-emerald-500 text-black',
    email: 'baonng.25it@vku.udn.vn',
    showtime: '26/06/2026 23:00',
    movieTitle: 'Bóng rổ đường phố',
    room: 'Phòng 4',
    seats: 'A08',
    discountCode: 'Không có',
    totalPrice: '60.000 đ',
    bookingTime: '26/06/2026 05:25',
  },
  {
    orderId: '50',
    status: 'PAID',
    statusText: 'Đã thanh toán',
    statusColor: 'bg-emerald-500 text-black',
    email: 'baonng.25it@vku.udn.vn',
    showtime: '21/06/2026 10:00',
    movieTitle: 'Bản giao hưởng địa cầu',
    room: 'Phòng 1',
    seats: 'C07',
    discountCode: 'Không có',
    totalPrice: '60.000 đ',
    bookingTime: '20/06/2026 08:04',
  },
  {
    orderId: '46',
    status: 'CANCELLED',
    statusText: 'Đã hủy',
    statusColor: 'bg-zinc-300 text-black',
    email: 'baonng.25it@vku.udn.vn',
    showtime: '21/06/2026 18:00',
    movieTitle: 'Bóng rổ đường phố',
    room: 'Phòng 4',
    seats: 'F07',
    discountCode: 'Không có',
    totalPrice: '90.000 đ',
    bookingTime: '20/06/2026 07:23',
  },
  {
    orderId: '45',
    status: 'PAID',
    statusText: 'Đã thanh toán',
    statusColor: 'bg-emerald-500 text-black',
    email: 'baonng.25it@vku.udn.vn',
    showtime: '18/06/2026 14:30',
    movieTitle: 'Hành Trình Về Phía Biển',
    room: 'Phòng 2',
    seats: 'D10, D11',
    discountCode: 'GIAM20K',
    totalPrice: '160.000 đ',
    bookingTime: '18/06/2026 10:15',
  },
  {
    orderId: '42',
    status: 'PAID',
    statusText: 'Đã thanh toán',
    statusColor: 'bg-emerald-500 text-black',
    email: 'baonng.25it@vku.udn.vn',
    showtime: '15/06/2026 20:00',
    movieTitle: 'Thám Tử Phố Cổ',
    room: 'Phòng 1',
    seats: 'B04',
    discountCode: 'Không có',
    totalPrice: '60.000 đ',
    bookingTime: '15/06/2026 18:40',
  },
];

// Dữ liệu mẫu danh sách phim đang hot
const HOT_MOVIES = [
  {
    id: 1,
    title: 'Hành Trình Về Phía Biển',
    genre: 'Tâm lý, Gia đình',
    duration: '120 phút',
    ageLimit: 'P',
    rating: '9.4',
    releaseDate: 'Đang chiếu',
    bannerGradient: 'from-blue-900 to-indigo-950',
    accentColor: '#3b82f6',
  },
  {
    id: 2,
    title: 'Thám Tử Phố Cổ',
    genre: 'Hình sự, Bí ẩn',
    duration: '105 phút',
    ageLimit: 'T16',
    rating: '9.1',
    releaseDate: 'Đang chiếu',
    bannerGradient: 'from-amber-950 to-stone-900',
    accentColor: '#f59e0b',
  },
  {
    id: 3,
    title: 'Đêm Cuối Ở Hội An',
    genre: 'Lãng mạn, Hài',
    duration: '130 phút',
    ageLimit: 'T13',
    rating: '8.9',
    releaseDate: 'Đang chiếu',
    bannerGradient: 'from-rose-950 to-zinc-900',
    accentColor: '#f43f5e',
  },
  {
    id: 4,
    title: 'Bóng Rổ Đường Phố',
    genre: 'Thể thao, Nhiệt huyết',
    duration: '110 phút',
    ageLimit: 'P',
    rating: '9.3',
    releaseDate: 'Đang chiếu',
    bannerGradient: 'from-orange-950 to-neutral-900',
    accentColor: '#ea580c',
  },
  {
    id: 5,
    title: 'Bản Giao Hưởng Địa Cầu',
    genre: 'Khoa học, Giả tưởng',
    duration: '145 phút',
    ageLimit: 'T13',
    rating: '9.5',
    releaseDate: 'Đang chiếu',
    bannerGradient: 'from-cyan-950 to-slate-900',
    accentColor: '#06b6d4',
  },
];

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ticketScrollRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

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

          {/* Ticket Cards Carousel */}
          <div
            ref={ticketScrollRef}
            onScroll={handleTicketScrollEvent}
            className="flex gap-4 sm:gap-5 overflow-x-auto custom-scrollbar pb-3 pt-1 select-none scroll-smooth"
          >
            {SAMPLE_TICKETS.map((ticket) => (
              <div
                key={ticket.orderId}
                className="min-w-[280px] sm:min-w-[320px] max-w-[340px] flex-shrink-0 bg-[#1c1c1f] border border-zinc-800/90 rounded-2xl p-4 sm:p-5 shadow-xl hover:border-zinc-700/80 transition-all duration-200 hover:-translate-y-0.5"
              >
                {/* Header card: Đơn # và trạng thái */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/70">
                  <span className="text-base sm:text-lg font-black text-[#e50914]">
                    Đơn #{ticket.orderId}
                  </span>
                  <span
                    className={`text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full ${ticket.statusColor}`}
                  >
                    {ticket.statusText}
                  </span>
                </div>

                {/* Details list */}
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-zinc-400 flex-shrink-0">Email:</span>
                    <span className="text-zinc-200 font-medium text-right truncate max-w-[190px]">
                      {user?.email || ticket.email}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-zinc-400 flex-shrink-0">Suất chiếu:</span>
                    <span className="text-zinc-200 font-semibold text-right">
                      {ticket.showtime}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-zinc-400 flex-shrink-0">Tên phim:</span>
                    <span className="text-white font-bold text-right truncate max-w-[190px]">
                      {ticket.movieTitle}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-zinc-400 flex-shrink-0">Số phòng:</span>
                    <span className="text-zinc-200 font-medium text-right">
                      {ticket.room}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-zinc-400 flex-shrink-0">Ghế:</span>
                    <span className="text-red-400 font-bold text-right">
                      {ticket.seats}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-zinc-400 flex-shrink-0">Mã giảm giá:</span>
                    <span className="text-zinc-300 text-right">
                      {ticket.discountCode}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-zinc-400 flex-shrink-0">Tổng giá vé:</span>
                    <span className="text-[#e50914] font-extrabold text-sm sm:text-base text-right">
                      {ticket.totalPrice}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2 pt-1 border-t border-zinc-800/50 text-[11px] text-zinc-400">
                    <span className="flex-shrink-0">Thời gian đặt:</span>
                    <span className="text-right">{ticket.bookingTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Indicator bar */}
          <div className="relative w-full h-1 bg-zinc-800/80 rounded-full overflow-hidden mt-1 max-w-xs mx-auto">
            <div
              className="h-full bg-[#e50914] rounded-full transition-all duration-150"
              style={{ width: '40%', transform: `translateX(${scrollProgress * 1.5}%)` }}
            />
          </div>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-5">
            {HOT_MOVIES.map((movie) => (
              <div
                key={movie.id}
                className="group relative bg-[#1c1c1f] rounded-2xl overflow-hidden border border-zinc-800/90 hover:border-zinc-700/80 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col"
              >
                {/* Poster Graphic Artwork */}
                <div
                  className={`relative aspect-[3/4] w-full bg-gradient-to-br ${movie.bannerGradient} p-4 flex flex-col justify-between overflow-hidden`}
                >
                  {/* Background Cinema Graphic Elements */}
                  <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/5 blur-xl pointer-events-none"></div>
                  
                  {/* Top Badges */}
                  <div className="flex items-center justify-between z-10">
                    <span className="bg-black/60 backdrop-blur-md text-white font-extrabold text-[10px] sm:text-xs px-2 py-0.5 rounded-md border border-white/10">
                      {movie.ageLimit}
                    </span>
                    <span className="bg-[#e50914] text-white font-extrabold text-[10px] sm:text-xs px-2 py-0.5 rounded-md shadow-md">
                      ★ {movie.rating}
                    </span>
                  </div>

                  {/* Center Film Title Art */}
                  <div className="z-10 my-auto text-center py-4">
                    <Film className="w-10 h-10 mx-auto text-white/20 mb-2 group-hover:scale-110 group-hover:text-white/40 transition-all" />
                    <p className="text-white font-extrabold text-sm sm:text-base leading-tight drop-shadow-md group-hover:text-[#e50914] transition-colors">
                      {movie.title}
                    </p>
                  </div>

                  {/* Bottom Duration info */}
                  <div className="z-10 flex items-center justify-between text-[11px] text-zinc-300 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{movie.duration}</span>
                    </span>
                    <span className="text-emerald-400 font-medium">{movie.releaseDate}</span>
                  </div>
                </div>

                {/* Movie Meta Information */}
                <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between space-y-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#e50914] transition-colors line-clamp-1">
                      {movie.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                      {movie.genre}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(`/booking?movieId=${movie.id}`)}
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
