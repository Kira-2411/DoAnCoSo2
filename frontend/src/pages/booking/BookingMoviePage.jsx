import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import MessengerButton from '../../components/MessengerButton';
import BookingStepper from '../../components/booking/BookingStepper';
import { useBooking } from '../../contexts/BookingContext';
import movieApi from '../../api/movieApi';
import { Check, Clock, Calendar, ArrowRight, Film } from 'lucide-react';

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
      return 'bg-[#e50914]';
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

const normalizeMovie = (m) => ({
  id: m.movieId ?? m.id,
  movieId: m.movieId ?? m.id,
  title: m.title || 'Phim chiếu rạp',
  format: m.format || '2D - Phụ đề',
  ageRating: m.ageLimit || m.ageRating || 'P',
  ageLimit: m.ageLimit || m.ageRating || 'P',
  duration: typeof m.duration === 'number' ? `${m.duration} phút` : (m.duration || '120 phút'),
  durationMinutes: typeof m.duration === 'number' ? m.duration : 120,
  genre: m.genre || 'Phim chiếu rạp',
  releaseDate: formatDate(m.releaseDate),
  poster: m.posterUrl || m.poster || '',
  posterUrl: m.posterUrl || m.poster || '',
  movieStatus: m.movieStatus || 'NOW_SHOWING'
});

const BookingMoviePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const movieIdParam = searchParams.get('movieId');

  const { selectedMovie, setSelectedMovie } = useBooking();
  const [activeTab, setActiveTab] = useState('NOW_SHOWING'); // 'NOW_SHOWING' | 'COMING_SOON'
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tải danh sách phim thật từ Backend theo tab và tự động chọn phim nếu truyền ?movieId= trên URL
  useEffect(() => {
    let isMounted = true;

    const fetchMoviesAndSyncSelection = async () => {
      try {
        setLoading(true);
        const res = await movieApi.getMovies({ status: activeTab, size: 50 });
        const rawList = res.data?.content || [];
        const normalizedList = rawList.map(normalizeMovie);

        if (!isMounted) return;
        setMovies(normalizedList);

        // 1. Nếu URL có ?movieId=..., ưu tiên tự động chọn đúng bộ phim đó
        if (movieIdParam) {
          const targetId = Number(movieIdParam);
          const foundInTab = normalizedList.find((m) => Number(m.id) === targetId);
          if (foundInTab) {
            setSelectedMovie(foundInTab);
            return;
          }

          // Nếu phim không nằm trong tab hiện tại, gọi API lấy chi tiết theo ID
          try {
            const detailRes = await movieApi.getMovieById(targetId);
            if (isMounted && detailRes.data) {
              const normalizedDetail = normalizeMovie(detailRes.data);
              setSelectedMovie(normalizedDetail);
              if (
                detailRes.data.movieStatus &&
                detailRes.data.movieStatus !== activeTab &&
                (detailRes.data.movieStatus === 'NOW_SHOWING' || detailRes.data.movieStatus === 'COMING_SOON')
              ) {
                setActiveTab(detailRes.data.movieStatus);
              }
              return;
            }
          } catch (detailErr) {
            console.error('Không tìm thấy phim theo movieId trên URL:', detailErr);
          }
        }

        // 2. Nếu chưa có phim thật nào được chọn (hoặc vẫn đang giữ phim mẫu mặc định 'HELLO' từ Context),
        // tự động chọn bộ phim đầu tiên trong danh sách thật
        if (normalizedList.length > 0) {
          const currentSelectedId = Number(selectedMovie?.movieId ?? selectedMovie?.id);
          const existsInRealList = normalizedList.some(
            (m) => Number(m.id) === currentSelectedId && selectedMovie?.title !== 'HELLO'
          );
          if (!existsInRealList && activeTab === 'NOW_SHOWING') {
            setSelectedMovie(normalizedList[0]);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách phim trang đặt vé:', err);
        if (isMounted) {
          setMovies([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMoviesAndSyncSelection();

    return () => {
      isMounted = false;
    };
  }, [activeTab, movieIdParam]);

  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie);
  };

  const handleNext = () => {
    if (!selectedMovie) {
      alert('Vui lòng chọn một bộ phim để tiếp tục!');
      return;
    }
    navigate('/booking/showtime');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col pb-28">
      {/* 1. Header dùng chung */}
      <Header />

      {/* 2. Stepper tiến trình (Bước 1 active) */}
      <BookingStepper currentStep={1} showTimer={false} />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 w-full flex-1">
        {/* Top Control Bar: Tabs & Nút Tiếp Theo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
          {/* Tabs Filter */}
          <div className="flex items-center gap-6 sm:gap-8">
            <button
              type="button"
              onClick={() => setActiveTab('NOW_SHOWING')}
              className={`text-lg sm:text-xl font-bold uppercase transition-colors relative pb-2 cursor-pointer ${
                activeTab === 'NOW_SHOWING'
                  ? 'text-[#e50914]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              PHIM ĐANG CHIẾU
              {activeTab === 'NOW_SHOWING' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#e50914] rounded-full shadow-[0_0_10px_rgba(229,9,20,0.8)]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('COMING_SOON')}
              className={`text-lg sm:text-xl font-bold uppercase transition-colors relative pb-2 cursor-pointer ${
                activeTab === 'COMING_SOON'
                  ? 'text-[#e50914]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              PHIM SẮP CHIẾU
              {activeTab === 'COMING_SOON' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#e50914] rounded-full shadow-[0_0_10px_rgba(229,9,20,0.8)]" />
              )}
            </button>
          </div>

          {/* Thông tin phim đang chọn & Nút Tiếp Theo */}
          <div className="flex items-center justify-between sm:justify-end gap-4">
            {selectedMovie && selectedMovie.title !== 'HELLO' && (
              <div className="hidden md:flex items-center gap-2 text-xs bg-zinc-900/90 border border-zinc-800 px-3.5 py-2 rounded-full">
                <span className="text-zinc-400">Đang chọn:</span>
                <span className="font-bold text-white truncate max-w-[200px]">
                  {selectedMovie.title}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 bg-[#e50914] hover:bg-[#b80710] active:scale-95 text-white font-bold px-7 py-2.5 rounded-full shadow-[0_4px_20px_rgba(229,9,20,0.4)] transition-all duration-200 cursor-pointer"
            >
              <span>Tiếp theo</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Danh sách phim thật từ Backend */}
        {loading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            aria-busy="true"
            aria-label="Đang tải danh sách phim"
          >
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="bg-zinc-900/80 rounded-2xl overflow-hidden border border-zinc-800/80 animate-pulse flex flex-col"
              >
                <div className="aspect-[2/3] w-full bg-zinc-800/70" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-3/4 bg-zinc-800 rounded" />
                  <div className="h-3 w-1/2 bg-zinc-800/70 rounded" />
                  <div className="pt-3 border-t border-zinc-800/70 flex justify-between">
                    <div className="h-3 w-16 bg-zinc-800 rounded" />
                    <div className="h-3 w-20 bg-zinc-800 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="py-20 text-center text-zinc-400 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
            <Film className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-white">Chưa có phim trong mục này</p>
            <p className="text-sm text-zinc-500 mt-1">
              Danh sách phim sẽ sớm được cập nhật!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie) => {
              const selectedId = Number(selectedMovie?.movieId ?? selectedMovie?.id);
              const isSelected = selectedId === Number(movie.id) && selectedMovie?.title !== 'HELLO';

              return (
                <div
                  key={movie.id}
                  onClick={() => handleSelectMovie(movie)}
                  className={`group relative bg-zinc-900/80 rounded-2xl overflow-hidden border cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col ${
                    isSelected
                      ? 'border-[#e50914] shadow-[0_0_25px_rgba(229,9,20,0.45)] ring-2 ring-red-500/50'
                      : 'border-zinc-800/80 hover:border-zinc-600'
                  }`}
                >
                  {/* Poster Thumbnail */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-950 flex flex-col justify-between p-4">
                    {movie.poster ? (
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="z-10 my-auto text-center py-6 px-2">
                        <Film className="w-12 h-12 mx-auto text-white/20 mb-3 group-hover:scale-110 group-hover:text-white/50 transition-all duration-300" />
                        <p className="text-white font-black text-base leading-snug drop-shadow-md group-hover:text-[#e50914] transition-colors uppercase">
                          {movie.title}
                        </p>
                      </div>
                    )}

                    {/* Age Rating Badge */}
                    <span
                      className={`absolute top-3 left-3 text-white text-xs font-black px-2.5 py-1 rounded-md shadow-md uppercase z-10 ${getAgeColor(
                        movie.ageRating
                      )}`}
                    >
                      {movie.ageRating}
                    </span>

                    {/* Selected Checkmark Indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-lg shadow-red-950/80 animate-in zoom-in-50 duration-200 z-10">
                        <Check className="w-5 h-5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Movie Info */}
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="font-extrabold text-base line-clamp-1 group-hover:text-red-400 transition-colors uppercase">
                        {movie.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-400">
                        <span className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0">
                          {movie.format}
                        </span>
                        <span>•</span>
                        <span className="truncate">{movie.genre}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{movie.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{movie.releaseDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 3. Floating Messenger Button */}
      <MessengerButton />
    </div>
  );
};

export default BookingMoviePage;

