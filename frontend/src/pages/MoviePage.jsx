import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Film, 
  Clock, 
  Calendar, 
  Ticket, 
  Info, 
  Sparkles, 
  X,
  Play,
  Loader2
} from 'lucide-react';

import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import MessengerButton from '../components/MessengerButton';
import movieApi from '../api/movieApi';

const getAgeColor = (ageLimit) => {
  switch (ageLimit) {
    case 'P': return 'bg-emerald-600';
    case 'T13': return 'bg-rose-600';
    case 'T16': return 'bg-amber-600';
    case 'T18': return 'bg-red-700';
    default: return 'bg-zinc-700';
  }
};

const formatDate = (dateStr) => {
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

const MoviePage = () => {
  const navigate = useNavigate();
  // Tab hiện tại: 'NOW_SHOWING' hoặc 'COMING_SOON'
  const [activeTab, setActiveTab] = useState('NOW_SHOWING');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal xem chi tiết phim
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Tải danh sách phim thật từ database theo tab
  useEffect(() => {
    let isMounted = true;
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const res = await movieApi.getMovies({ status: activeTab, size: 50 });
        if (isMounted) {
          setMovies(res.data?.content || []);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách phim:', err);
        if (isMounted) {
          setMovies([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMovies();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  // Mở modal xem chi tiết phim (gọi API getMovieById)
  const handleOpenDetail = async (m) => {
    try {
      setLoadingDetail(true);
      setSelectedMovie(m);
      const res = await movieApi.getMovieById(m.movieId);
      setSelectedMovie(res.data);
    } catch (err) {
      console.error('Lỗi khi tải chi tiết phim:', err);
      // Giữ thông tin cơ bản nếu API chi tiết lỗi
      setSelectedMovie(m);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-red-600 selection:text-white pb-32">
      {/* 1. Header dùng chung */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
        
        {/* Section: Thanh Tab chọn Phim Đang Chiếu / Phim Sắp Chiếu */}
        <div className="border-b border-zinc-800/80">
          <div className="flex items-center space-x-6 sm:space-x-8">
            
            {/* Tab: PHIM ĐANG CHIẾU */}
            <button
              onClick={() => setActiveTab('NOW_SHOWING')}
              type="button"
              className={`pb-3 text-lg sm:text-2xl font-black uppercase tracking-wider transition-all duration-200 cursor-pointer relative ${
                activeTab === 'NOW_SHOWING'
                  ? 'text-[#e50914]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>PHIM ĐANG CHIẾU</span>
              {activeTab === 'NOW_SHOWING' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#e50914] rounded-full animate-in fade-in zoom-in-95 duration-200"></div>
              )}
            </button>

            {/* Tab: PHIM SẮP CHIẾU */}
            <button
              onClick={() => setActiveTab('COMING_SOON')}
              type="button"
              className={`pb-3 text-lg sm:text-2xl font-black uppercase tracking-wider transition-all duration-200 cursor-pointer relative ${
                activeTab === 'COMING_SOON'
                  ? 'text-[#e50914]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>PHIM SẮP CHIẾU</span>
              {activeTab === 'COMING_SOON' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#e50914] rounded-full animate-in fade-in zoom-in-95 duration-200"></div>
              )}
            </button>

          </div>
        </div>

        {/* Section: Lưới hiển thị danh sách phim */}
        <section aria-label="Danh sách phim">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#e50914] mb-3" />
              <p className="text-sm font-medium">Đang tải danh sách phim từ rạp...</p>
            </div>
          ) : movies.length === 0 ? (
            <div className="bg-[#1c1c1f]/80 border border-zinc-800/90 rounded-2xl p-12 text-center text-zinc-400 space-y-2">
              <Film className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">Chưa có phim trong mục này</h3>
              <p className="text-xs text-zinc-500">Vui lòng quay lại sau để cập nhật lịch phim mới nhất nhé!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {movies.map((movie) => (
                <div
                  key={movie.movieId}
                  className="group relative bg-[#1c1c1f] rounded-2xl overflow-hidden border border-zinc-800/90 hover:border-zinc-700/80 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col"
                >
                  {/* Poster Graphic Artwork */}
                  <div
                    className="relative aspect-[3/4] w-full bg-gradient-to-br from-zinc-800 to-zinc-950 p-4 flex flex-col justify-between overflow-hidden cursor-pointer"
                    onClick={() => handleOpenDetail(movie)}
                  >
                    {movie.posterUrl ? (
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="z-10 my-auto text-center py-4">
                        <Film className="w-10 h-10 mx-auto text-white/20 mb-2 group-hover:scale-110 group-hover:text-white/50 transition-all duration-300" />
                        <p className="text-white font-black text-sm sm:text-base leading-tight drop-shadow-md group-hover:text-[#e50914] transition-colors">
                          {movie.title}
                        </p>
                      </div>
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
                      <span
                        className={`text-white font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-md shadow ${getAgeColor(movie.ageLimit)}`}
                      >
                        {movie.ageLimit || 'P'}
                      </span>
                      <span className="bg-black/60 backdrop-blur-md text-white font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-md border border-white/10">
                        {activeTab === 'NOW_SHOWING' ? 'Đang chiếu' : 'Sắp chiếu'}
                      </span>
                    </div>

                    {/* Bottom Duration info */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between text-[11px] text-zinc-300 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>{movie.duration ? `${movie.duration}p` : '120p'}</span>
                      </span>
                      <span className="text-zinc-300 font-medium truncate max-w-[80px]">
                        {formatDate(movie.releaseDate)}
                      </span>
                    </div>
                  </div>

                  {/* Movie Meta Info & Action Button */}
                  <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between space-y-3">
                    <div>
                      <h3
                        onClick={() => handleOpenDetail(movie)}
                        className="text-xs sm:text-sm font-bold text-white group-hover:text-[#e50914] transition-colors line-clamp-1 cursor-pointer"
                        title={movie.title}
                      >
                        {movie.title}
                      </h3>
                      <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                        {movie.genre || 'Phim chiếu rạp'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      {activeTab === 'NOW_SHOWING' ? (
                        <button
                          onClick={() => navigate(`/booking?movieId=${movie.movieId}`)}
                          type="button"
                          className="flex-1 bg-[#e50914] hover:bg-[#b80710] text-white text-xs font-bold py-2 px-3 rounded-xl transition duration-150 shadow-md shadow-red-950/20 flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>Đặt vé</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenDetail(movie)}
                          type="button"
                          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold py-2 px-3 rounded-xl transition duration-150 flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* MODAL CHI TIẾT PHIM KHI CLICK VÀO CARD */}
      {selectedMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#1c1c1f] border border-zinc-700 rounded-3xl p-6 shadow-2xl space-y-4">
            
            {/* Nút đóng modal */}
            <button
              onClick={() => setSelectedMovie(null)}
              type="button"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header modal */}
            <div className="flex items-start space-x-3 pr-8">
              <span
                className={`text-white font-black text-xs px-2.5 py-1 rounded-md flex-shrink-0 ${getAgeColor(selectedMovie.ageLimit)}`}
              >
                {selectedMovie.ageLimit || 'P'}
              </span>
              <div>
                <h2 className="text-xl font-black text-white">
                  {selectedMovie.title}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {selectedMovie.genre || 'Phim rạp'} • {selectedMovie.duration ? `${selectedMovie.duration} phút` : '120 phút'}
                </p>
              </div>
            </div>

            {/* Nội dung mô tả */}
            <div className="space-y-3 text-sm text-zinc-300">
              <div>
                <span className="text-zinc-400 text-xs font-semibold block mb-0.5">Mô tả phim:</span>
                <p className="leading-relaxed bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                  {selectedMovie.description || 'Chưa có thông tin tóm tắt phim.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-400 font-semibold block">Đạo diễn:</span>
                  <span className="text-white font-medium">{selectedMovie.director || 'Đang cập nhật'}</span>
                </div>
                <div>
                  <span className="text-zinc-400 font-semibold block">Khởi chiếu:</span>
                  <span className="text-emerald-400 font-semibold">{formatDate(selectedMovie.releaseDate)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-400 font-semibold block">Diễn viên chính:</span>
                  <span className="text-white font-medium">{selectedMovie.cast || 'Đang cập nhật'}</span>
                </div>
              </div>
            </div>

            {/* Footer modal: nút hành động */}
            <div className="pt-2 flex space-x-3">
              {activeTab === 'NOW_SHOWING' ? (
                <button
                  onClick={() => {
                    const id = selectedMovie.movieId;
                    setSelectedMovie(null);
                    navigate(`/booking?movieId=${id}`);
                  }}
                  type="button"
                  className="flex-1 bg-[#e50914] hover:bg-[#b80710] text-white font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-red-950/40"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Đặt vé xem phim này</span>
                </button>
              ) : (
                <button
                  onClick={() => setSelectedMovie(null)}
                  type="button"
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Đóng
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 2. Messenger Floating Action Button */}
      <MessengerButton />

      {/* 3. Bottom Navigation Bar dạng nổi viên thuốc (Active vào mục "Phim") */}
      <BottomNav activeId="movies" />
    </div>
  );
};

export default MoviePage;
