import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Film, 
  Clock, 
  Calendar, 
  Ticket, 
  Info, 
  X,
  Loader2,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  MapPin,
  Hourglass
} from 'lucide-react';

import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import MessengerButton from '../components/MessengerButton';
import movieApi from '../api/movieApi';
import showtimeApi from '../api/showtimeApi';

const getAgeColor = (ageLimit) => {
  switch (ageLimit) {
    case 'P': return 'bg-emerald-600';
    case 'T13': return 'bg-rose-600';
    case 'T16': return 'bg-amber-600';
    case 'T18': return 'bg-red-700';
    default: return 'bg-zinc-700';
  }
};

const AGE_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả độ tuổi', dot: 'bg-zinc-400', desc: 'Mọi phân loại' },
  { value: 'P', label: 'P', dot: 'bg-emerald-500', desc: 'Mọi lứa tuổi' },
  { value: 'T13', label: 'T13', dot: 'bg-rose-500', desc: 'Từ 13 tuổi' },
  { value: 'T16', label: 'T16', dot: 'bg-amber-500', desc: 'Từ 16 tuổi' },
  { value: 'T18', label: 'T18', dot: 'bg-red-600', desc: 'Từ 18 tuổi' },
];

const DURATION_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả thời lượng' },
  { value: 'SHORT', label: 'Dưới 110 phút (Ngắn)' },
  { value: 'MEDIUM', label: '110 – 125 phút (Vừa)' },
  { value: 'LONG', label: 'Trên 125 phút (Dài)' },
];

const SORT_OPTIONS = [
  { value: 'DEFAULT', label: 'Sắp xếp: Mặc định' },
  { value: 'RELEASE_DESC', label: 'Khởi chiếu: Mới nhất' },
  { value: 'RELEASE_ASC', label: 'Khởi chiếu: Sớm nhất' },
  { value: 'DURATION_ASC', label: 'Thời lượng: Ngắn → Dài' },
  { value: 'DURATION_DESC', label: 'Thời lượng: Dài → Ngắn' },
  { value: 'TITLE_ASC', label: 'Tên phim: A → Z' },
];

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

// Tính số ngày đếm ngược tới ngày khởi chiếu cho tab Phim Sắp Chiếu
const getReleaseCountdown = (dateStr) => {
  if (!dateStr) return { text: 'Sắp chiếu', isHighlight: false };
  try {
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return { text: 'Sắp chiếu', isHighlight: false };
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const diffDays = Math.round((targetStart - todayStart) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      return { text: `Còn ${diffDays} ngày`, isHighlight: true };
    }
    if (diffDays === 0) {
      return { text: 'Ra mắt hôm nay', isHighlight: true };
    }
    return { text: 'Sắp chiếu', isHighlight: false };
  } catch {
    return { text: 'Sắp chiếu', isHighlight: false };
  }
};

// Tạo danh sách N ngày tiếp theo định dạng YYYY-MM-DD để truy vấn suất chiếu sắp tới
const getUpcomingDatesIso = (daysCount = 5) => {
  const result = [];
  const base = new Date();
  for (let i = 0; i < daysCount; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    result.push(`${yyyy}-${mm}-${dd}`);
  }
  return result;
};

const formatTimeOnly = (dateTimeStr) => {
  if (!dateTimeStr) return '--:--';
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return '--:--';
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${min}`;
  } catch {
    return '--:--';
  }
};

const formatShowDateBadge = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((targetStart - todayStart) / (1000 * 60 * 60 * 24));
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    if (diffDays === 0) return `Hôm nay (${day}/${month})`;
    if (diffDays === 1) return `Ngày mai (${day}/${month})`;
    if (diffDays === 2) return `Ngày kia (${day}/${month})`;
    return `${day}/${month}/${d.getFullYear()}`;
  } catch {
    return '';
  }
};

const MoviePage = () => {
  const navigate = useNavigate();
  // Tab hiện tại: 'NOW_SHOWING' hoặc 'COMING_SOON'
  const [activeTab, setActiveTab] = useState('NOW_SHOWING');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Các state Bộ lọc & Sắp xếp
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [selectedAgeLimit, setSelectedAgeLimit] = useState('ALL');
  const [selectedDuration, setSelectedDuration] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');

  // Modal xem chi tiết phim & danh sách suất chiếu thật của phim đó
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [movieShowtimes, setMovieShowtimes] = useState([]);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);

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

  // Tự động trích xuất danh sách thể loại duy nhất từ dữ liệu phim thật trong tab hiện tại
  const availableGenres = useMemo(() => {
    const genreSet = new Set();
    movies.forEach((m) => {
      if (m.genre && typeof m.genre === 'string') {
        m.genre
          .split(',')
          .map((g) => g.trim())
          .filter(Boolean)
          .forEach((g) => genreSet.add(g));
      }
    });
    return Array.from(genreSet);
  }, [movies]);

  // Nếu chuyển tab mà thể loại đang chọn không tồn tại ở tab mới thì đặt lại về 'ALL'
  useEffect(() => {
    if (selectedGenre !== 'ALL' && !availableGenres.includes(selectedGenre)) {
      setSelectedGenre('ALL');
    }
  }, [availableGenres, selectedGenre]);

  // Kiểm tra xem người dùng có đang bật bộ lọc nào không
  const hasActiveFilters =
    searchKeyword.trim() !== '' ||
    selectedGenre !== 'ALL' ||
    selectedAgeLimit !== 'ALL' ||
    selectedDuration !== 'ALL' ||
    sortBy !== 'DEFAULT';

  const handleResetFilters = () => {
    setSearchKeyword('');
    setSelectedGenre('ALL');
    setSelectedAgeLimit('ALL');
    setSelectedDuration('ALL');
    setSortBy('DEFAULT');
  };

  // Áp dụng toàn bộ 5 bộ lọc & sắp xếp trên danh sách phim
  const filteredMovies = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    const filtered = movies.filter((movie) => {
      // 1. Lọc theo từ khóa (tên phim hoặc thể loại)
      if (keyword) {
        const matchTitle = (movie.title || '').toLowerCase().includes(keyword);
        const matchGenre = (movie.genre || '').toLowerCase().includes(keyword);
        if (!matchTitle && !matchGenre) return false;
      }

      // 2. Lọc theo thể loại (tách theo dấu phẩy)
      if (selectedGenre !== 'ALL') {
        const movieGenres = (movie.genre || '')
          .split(',')
          .map((g) => g.trim().toLowerCase())
          .filter(Boolean);
        if (!movieGenres.includes(selectedGenre.toLowerCase())) {
          return false;
        }
      }

      // 3. Lọc theo giới hạn độ tuổi (P, T13, T16, T18)
      if (selectedAgeLimit !== 'ALL') {
        const age = movie.ageLimit || 'P';
        if (age !== selectedAgeLimit) return false;
      }

      // 4. Lọc theo thời lượng (phút)
      if (selectedDuration !== 'ALL') {
        const dur = Number(movie.duration) || 120;
        if (selectedDuration === 'SHORT' && dur >= 110) return false;
        if (selectedDuration === 'MEDIUM' && (dur < 110 || dur > 125)) return false;
        if (selectedDuration === 'LONG' && dur <= 125) return false;
      }

      return true;
    });

    // 5. Sắp xếp kết quả
    const sorted = [...filtered];
    if (sortBy === 'RELEASE_DESC') {
      sorted.sort((a, b) => {
        const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sortBy === 'RELEASE_ASC') {
      sorted.sort((a, b) => {
        const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : Number.MAX_SAFE_INTEGER;
        return dateA - dateB;
      });
    } else if (sortBy === 'DURATION_ASC') {
      sorted.sort((a, b) => (Number(a.duration) || 0) - (Number(b.duration) || 0));
    } else if (sortBy === 'DURATION_DESC') {
      sorted.sort((a, b) => (Number(b.duration) || 0) - (Number(a.duration) || 0));
    } else if (sortBy === 'TITLE_ASC') {
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'vi'));
    }

    return sorted;
  }, [movies, searchKeyword, selectedGenre, selectedAgeLimit, selectedDuration, sortBy]);

  // Mở modal xem chi tiết phim (gọi API getMovieById + lấy các suất chiếu thật sắp tới của phim)
  const handleOpenDetail = async (m) => {
    setSelectedMovie(m);
    setMovieShowtimes([]);

    // 1. Tải chi tiết phim
    try {
      setLoadingDetail(true);
      const res = await movieApi.getMovieById(m.movieId);
      setSelectedMovie(res.data);
    } catch (err) {
      console.error('Lỗi khi tải chi tiết phim:', err);
      setSelectedMovie(m);
    } finally {
      setLoadingDetail(false);
    }

    // 2. Tải danh sách suất chiếu thật của bộ phim trong 5 ngày tới (nếu phim đang chiếu)
    if ((m.movieStatus || activeTab) === 'NOW_SHOWING') {
      try {
        setLoadingShowtimes(true);
        const upcomingDates = getUpcomingDatesIso(5);
        const responses = await Promise.all(
          upcomingDates.map((date) =>
            showtimeApi
              .getShowtimes({ date, movieId: m.movieId })
              .then((res) => (Array.isArray(res.data) ? res.data : []))
              .catch(() => [])
          )
        );
        const merged = responses
          .flat()
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        setMovieShowtimes(merged);
      } catch (err) {
        console.error('Lỗi khi tải suất chiếu của phim:', err);
        setMovieShowtimes([]);
      } finally {
        setLoadingShowtimes(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-red-600 selection:text-white pb-32">
      {/* 1. Header dùng chung */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        
        {/* Section 1: Thanh Tab chọn Phim Đang Chiếu / Phim Sắp Chiếu */}
        <div className="border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

          {/* Số lượng phim hiện tại */}
          {!loading && (
            <div className="pb-2 sm:pb-3 text-xs text-zinc-400 flex items-center gap-2">
              <span>
                Hiển thị <strong className="text-white">{filteredMovies.length}</strong> /{' '}
                {movies.length} bộ phim
              </span>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  type="button"
                  className="inline-flex items-center gap-1 text-[#e50914] hover:text-red-400 font-semibold transition cursor-pointer ml-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Khung Bộ lọc & Tìm kiếm Phim (5 Bộ lọc) */}
        <section
          aria-label="Bộ lọc danh sách phim"
          className="bg-[#1c1c1f]/90 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl"
        >
          {/* Hàng 1: Ô tìm kiếm từ khóa + Lọc Thời lượng + Sắp xếp */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* 1. Ô tìm kiếm theo tên phim hoặc thể loại */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm theo tên phim hoặc thể loại (VD: Thám tử, Hội An, Tâm lý...)"
                aria-label="Tìm kiếm phim"
                className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-[#e50914] text-white placeholder-zinc-500 text-xs sm:text-sm rounded-xl pl-10 pr-9 py-2.5 outline-none transition"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  aria-label="Xóa từ khóa tìm kiếm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 4. Dropdown Lọc Thời lượng */}
            <div className="md:col-span-3 relative">
              <Clock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                aria-label="Lọc theo thời lượng phim"
                className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-[#e50914] text-zinc-200 text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition cursor-pointer"
              >
                {DURATION_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Dropdown Sắp xếp */}
            <div className="md:col-span-3 relative">
              <ArrowUpDown className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sắp xếp danh sách phim"
                className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-[#e50914] text-zinc-200 text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hàng 2: Bộ lọc Thể loại (tự động trích xuất từ dữ liệu thật) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pt-1 border-t border-zinc-800/70">
            <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 flex-shrink-0 pt-1 sm:pt-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#e50914]" />
              <span>Thể loại:</span>
            </span>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() => setSelectedGenre('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                  selectedGenre === 'ALL'
                    ? 'bg-[#e50914] text-white shadow-md shadow-red-950/40'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-white'
                }`}
              >
                Tất cả
              </button>

              {availableGenres.map((genre) => {
                const isSelected = selectedGenre === genre;
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => setSelectedGenre(isSelected ? 'ALL' : genre)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#e50914] text-white shadow-md shadow-red-950/40'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hàng 3: Bộ lọc Độ tuổi phân loại (P / T13 / T16 / T18) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-zinc-800/70">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="text-xs font-bold text-zinc-400 flex-shrink-0">
                Độ tuổi:
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {AGE_FILTER_OPTIONS.map((ageOpt) => {
                  const isSelected = selectedAgeLimit === ageOpt.value;
                  return (
                    <button
                      key={ageOpt.value}
                      type="button"
                      onClick={() =>
                        setSelectedAgeLimit(
                          isSelected && ageOpt.value !== 'ALL' ? 'ALL' : ageOpt.value
                        )
                      }
                      title={ageOpt.desc}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${ageOpt.dot}`}></span>
                      <span>{ageOpt.label}</span>
                      {ageOpt.value !== 'ALL' && (
                        <span
                          className={`text-[10px] font-medium hidden sm:inline ${
                            isSelected ? 'text-zinc-600' : 'text-zinc-500'
                          }`}
                        >
                          ({ageOpt.desc})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800/90 hover:bg-zinc-700 px-3.5 py-1.5 rounded-xl transition cursor-pointer self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#e50914]" />
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>
        </section>

        {/* Section 3: Lưới hiển thị danh sách phim */}
        <section aria-label="Danh sách phim">
          {loading ? (
            /* Nâng cấp 4: Lưới 10 thẻ Skeleton chuẩn tỉ lệ poster 3:4, chống giật khung trang */
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6"
              aria-busy="true"
              aria-label="Đang tải danh sách phim"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
                <div
                  key={item}
                  className="bg-[#1c1c1f] rounded-2xl overflow-hidden border border-zinc-800/90 animate-pulse flex flex-col"
                >
                  <div className="aspect-[3/4] w-full bg-zinc-800/70" />
                  <div className="p-3 sm:p-4 space-y-2.5">
                    <div className="h-4 w-3/4 bg-zinc-800 rounded" />
                    <div className="flex gap-1.5">
                      <div className="h-4 w-14 bg-zinc-800/70 rounded-md" />
                      <div className="h-4 w-14 bg-zinc-800/70 rounded-md" />
                    </div>
                    <div className="pt-1 flex gap-2">
                      <div className="h-8 flex-1 bg-zinc-800 rounded-xl" />
                      <div className="h-8 w-8 bg-zinc-800 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : movies.length === 0 ? (
            <div className="bg-[#1c1c1f]/80 border border-zinc-800/90 rounded-2xl p-12 text-center text-zinc-400 space-y-2">
              <Film className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">Chưa có phim trong mục này</h3>
              <p className="text-xs text-zinc-500">Vui lòng quay lại sau để cập nhật lịch phim mới nhất nhé!</p>
            </div>
          ) : filteredMovies.length === 0 ? (
            <div className="bg-[#1c1c1f]/80 border border-zinc-800/90 rounded-2xl p-12 text-center text-zinc-400 space-y-3">
              <Search className="w-10 h-10 text-zinc-600 mx-auto mb-1" />
              <h3 className="text-base font-bold text-white">
                Không tìm thấy bộ phim nào khớp với bộ lọc
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Thử thay đổi từ khóa tìm kiếm, chọn thể loại hoặc độ tuổi khác để xem thêm các bộ phim tại Akashi Cinema.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 bg-[#e50914] hover:bg-[#b80710] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-red-950/30"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại toàn bộ bộ lọc</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {filteredMovies.map((movie) => {
                const countdown =
                  activeTab === 'COMING_SOON' ? getReleaseCountdown(movie.releaseDate) : null;
                const genreTags = (movie.genre || '')
                  .split(',')
                  .map((g) => g.trim())
                  .filter(Boolean);

                return (
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

                      {/* Top Badges (Độ tuổi + Nhãn trạng thái / Đếm ngược ngày khởi chiếu) */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
                        <span
                          className={`text-white font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-md shadow ${getAgeColor(movie.ageLimit)}`}
                        >
                          {movie.ageLimit || 'P'}
                        </span>

                        {activeTab === 'NOW_SHOWING' ? (
                          <span className="bg-black/60 backdrop-blur-md text-white font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-md border border-white/10">
                            Đang chiếu
                          </span>
                        ) : (
                          /* Nâng cấp 2: Nhãn đếm ngược ngày khởi chiếu cho tab Phim Sắp Chiếu */
                          <span
                            className={`inline-flex items-center gap-1 backdrop-blur-md font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-md border ${
                              countdown?.isHighlight
                                ? 'bg-amber-500/90 text-zinc-950 border-amber-300/60 shadow-md'
                                : 'bg-black/60 text-white border-white/10'
                            }`}
                          >
                            {countdown?.isHighlight && <Hourglass className="w-2.5 h-2.5" />}
                            <span>{countdown?.text || 'Sắp chiếu'}</span>
                          </span>
                        )}
                      </div>

                      {/* Bottom Duration & Release Date info */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between text-[11px] text-zinc-300 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>{movie.duration ? `${movie.duration}p` : '120p'}</span>
                        </span>
                        <span className="text-zinc-300 font-medium truncate max-w-[85px]">
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

                        {/* Nâng cấp 3a: Các tag thể loại có thể bấm để lọc nhanh */}
                        {genreTags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {genreTags.map((tag) => {
                              const isTagActive = selectedGenre === tag;
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedGenre(isTagActive ? 'ALL' : tag);
                                  }}
                                  title={`Lọc phim thể loại ${tag}`}
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition cursor-pointer ${
                                    isTagActive
                                      ? 'bg-[#e50914] text-white'
                                      : 'bg-zinc-800/90 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                                  }`}
                                >
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-zinc-400 line-clamp-1 mt-1">
                            Phim chiếu rạp
                          </p>
                        )}
                      </div>

                      {/* Nâng cấp 3b: Nút Đặt vé + Nút Info (i) đồng bộ trên thẻ phim */}
                      <div className="flex items-center space-x-2 pt-1">
                        {activeTab === 'NOW_SHOWING' ? (
                          <>
                            <button
                              onClick={() => navigate(`/booking?movieId=${movie.movieId}`)}
                              type="button"
                              className="flex-1 bg-[#e50914] hover:bg-[#b80710] text-white text-xs font-bold py-2 px-3 rounded-xl transition duration-150 shadow-md shadow-red-950/20 flex items-center justify-center space-x-1 cursor-pointer"
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              <span>Đặt vé</span>
                            </button>
                            <button
                              onClick={() => handleOpenDetail(movie)}
                              type="button"
                              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition cursor-pointer"
                              aria-label={`Chi tiết phim ${movie.title}`}
                              title="Xem chi tiết & lịch chiếu"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleOpenDetail(movie)}
                            type="button"
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold py-2 px-3 rounded-xl transition duration-150 flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <Info className="w-3.5 h-3.5" />
                            <span>Xem chi tiết</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* MODAL CHI TIẾT PHIM & SUẤT CHIẾU THẬT KHI CLICK VÀO CARD (Nâng cấp 1) */}
      {selectedMovie && (
        <div
          onClick={() => setSelectedMovie(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[#1c1c1f] border border-zinc-700 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Nút đóng modal */}
            <button
              onClick={() => setSelectedMovie(null)}
              type="button"
              aria-label="Đóng chi tiết phim"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header modal */}
            <div className="flex items-start space-x-3 pr-8">
              <span
                className={`text-white font-black text-xs px-2.5 py-1 rounded-md flex-shrink-0 mt-0.5 ${getAgeColor(selectedMovie.ageLimit)}`}
              >
                {selectedMovie.ageLimit || 'P'}
              </span>
              <div>
                <h2 className="text-xl font-black text-white">
                  {selectedMovie.title}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {selectedMovie.genre || 'Phim chiếu rạp'} •{' '}
                  {selectedMovie.duration ? `${selectedMovie.duration} phút` : '120 phút'}
                </p>
              </div>
            </div>

            {loadingDetail ? (
              <div className="py-6 flex items-center justify-center text-zinc-400 gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-[#e50914]" />
                <span>Đang tải thông tin chi tiết phim...</span>
              </div>
            ) : (
              <div className="space-y-4 text-sm text-zinc-300">
                {/* Mô tả nội dung phim */}
                <div>
                  <span className="text-zinc-400 text-xs font-semibold block mb-1">
                    Nội dung tóm tắt:
                  </span>
                  <p className="leading-relaxed bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
                    {selectedMovie.description || 'Chưa có thông tin tóm tắt cho bộ phim này.'}
                  </p>
                </div>

                {/* Thông tin khởi chiếu & phân loại thật từ DB */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-800/80">
                  <div>
                    <span className="text-zinc-400 font-semibold block">Ngày khởi chiếu:</span>
                    <span className="text-emerald-400 font-bold mt-0.5 block">
                      {formatDate(selectedMovie.releaseDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-semibold block">Trạng thái:</span>
                    <span className="text-white font-bold mt-0.5 block">
                      {(selectedMovie.movieStatus || activeTab) === 'NOW_SHOWING'
                        ? 'Đang khởi chiếu tại rạp'
                        : getReleaseCountdown(selectedMovie.releaseDate).text}
                    </span>
                  </div>
                </div>

                {/* Nâng cấp 1: Danh sách Suất chiếu sắp tới thật từ API GET /api/showtimes */}
                {(selectedMovie.movieStatus || activeTab) === 'NOW_SHOWING' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300 text-xs font-bold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#e50914]" />
                        <span>Suất chiếu sắp tới tại rạp:</span>
                      </span>
                      {!loadingShowtimes && movieShowtimes.length > 0 && (
                        <span className="text-[11px] text-zinc-400">
                          Chọn suất để đặt vé nhanh
                        </span>
                      )}
                    </div>

                    {loadingShowtimes ? (
                      <div className="grid grid-cols-2 gap-2">
                        {[1, 2].map((s) => (
                          <div
                            key={s}
                            className="h-14 bg-zinc-900/70 border border-zinc-800 rounded-xl animate-pulse"
                          />
                        ))}
                      </div>
                    ) : movieShowtimes.length === 0 ? (
                      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3 text-xs text-zinc-400 text-center">
                        Hiện chưa có lịch chiếu mới trong vài ngày tới.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5 max-h-44 overflow-y-auto pr-1">
                        {movieShowtimes.map((slot) => (
                          <button
                            key={slot.showId}
                            type="button"
                            onClick={() => {
                              const id = selectedMovie.movieId;
                              setSelectedMovie(null);
                              navigate(`/booking?movieId=${id}`);
                            }}
                            className="group/slot text-left bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800 hover:border-[#e50914] rounded-xl p-2.5 transition cursor-pointer flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between gap-1 text-[11px] text-zinc-400">
                              <span className="font-semibold text-zinc-300 truncate">
                                {formatShowDateBadge(slot.startTime)}
                              </span>
                              <span className="inline-flex items-center gap-0.5 text-zinc-400 flex-shrink-0">
                                <MapPin className="w-3 h-3 text-[#e50914]" />
                                <span>{slot.roomName}</span>
                              </span>
                            </div>
                            <div className="mt-1 font-black text-xs sm:text-sm text-white group-hover/slot:text-[#e50914] transition">
                              {formatTimeOnly(slot.startTime)} – {formatTimeOnly(slot.endTime)}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Footer modal: nút hành động */}
            <div className="pt-2 flex space-x-3">
              {(selectedMovie.movieStatus || activeTab) === 'NOW_SHOWING' ? (
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
