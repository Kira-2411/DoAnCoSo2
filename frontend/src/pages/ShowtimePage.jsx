import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  RotateCcw, 
  Calendar as CalendarIcon,
  X,
  Loader2,
  Film
} from 'lucide-react';

import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import MessengerButton from '../components/MessengerButton';
import showtimeApi from '../api/showtimeApi';

// Màu badge độ tuổi
const getAgeColor = (ageLimit) => {
  switch (ageLimit) {
    case 'P': return 'bg-emerald-600';
    case 'T13': return 'bg-rose-600';
    case 'T16': return 'bg-amber-600';
    case 'T18': return 'bg-red-700';
    default: return 'bg-zinc-700';
  }
};

// Chuyển thứ trong tuần sang định dạng TH 2, TH 3... CN khớp với UI/showtime.png
const getDayOfWeekText = (date) => {
  const day = date.getDay(); // 0: CN, 1: TH 2, ..., 6: TH 7
  switch (day) {
    case 0: return 'CN';
    case 1: return 'TH 2';
    case 2: return 'TH 3';
    case 3: return 'TH 4';
    case 4: return 'TH 5';
    case 5: return 'TH 6';
    case 6: return 'TH 7';
    default: return '';
  }
};

// Tìm ngày Thứ 2 của tuần chứa ngày được truyền vào
const getMondayOfWeek = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  // Nếu là Chủ nhật (0), lùi lại 6 ngày để lấy Thứ 2 tuần đó
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// So sánh 2 ngày (chỉ so năm, tháng, ngày)
const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

// Định dạng ngày dạng 2 chữ số
const padZero = (n) => String(n).padStart(2, '0');

const ShowtimePage = () => {
  const navigate = useNavigate();

  // State danh sách suất chiếu từ database
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ngày hôm nay theo thời gian thực tế
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  // Ngày đang được chọn
  const [selectedDate, setSelectedDate] = useState(() => {
    const initial = new Date();
    initial.setHours(0, 0, 0, 0);
    return initial;
  });

  // Thứ 2 của tuần đang được xem (quản lý khung 7 ngày chuẩn)
  const [currentWeekMonday, setCurrentWeekMonday] = useState(() => getMondayOfWeek(new Date()));

  // Quản lý trạng thái mở/đóng Mini Calendar Popup
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef(null);

  // Tháng và năm đang được xem trong Mini Calendar Popup
  const [popupViewMonth, setPopupViewMonth] = useState(() => selectedDate.getMonth());
  const [popupViewYear, setPopupViewYear] = useState(() => selectedDate.getFullYear());

  // Đóng popup khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Tải danh sách suất chiếu từ database khi thay đổi selectedDate
  useEffect(() => {
    let isMounted = true;
    const fetchShowtimes = async () => {
      try {
        setLoading(true);
        const yyyy = selectedDate.getFullYear();
        const mm = padZero(selectedDate.getMonth() + 1);
        const dd = padZero(selectedDate.getDate());
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const res = await showtimeApi.getShowtimes({ date: dateStr });
        if (isMounted) {
          setShowtimes(res.data || []);
        }
      } catch (err) {
        console.error('Lỗi khi tải suất chiếu:', err);
        if (isMounted) {
          setShowtimes([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchShowtimes();
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // Gom nhóm danh sách suất chiếu theo phim và phòng chiếu
  const groupedMovies = useMemo(() => {
    if (!showtimes || showtimes.length === 0) return [];
    const movieMap = new Map();
    showtimes.forEach((st) => {
      if (!movieMap.has(st.movieId)) {
        movieMap.set(st.movieId, {
          movieId: st.movieId,
          title: st.movieTitle,
          ageLimit: st.ageLimit || 'P',
          ageColor: getAgeColor(st.ageLimit),
          genre: st.genre || 'Phim rạp',
          duration: st.duration ? `${st.duration} phút` : '120 phút',
          roomsMap: new Map(),
        });
      }
      const movie = movieMap.get(st.movieId);
      const roomKey = st.roomName || `Phòng ${st.roomId}`;
      if (!movie.roomsMap.has(roomKey)) {
        movie.roomsMap.set(roomKey, []);
      }
      const startTimeDate = new Date(st.startTime);
      const timeStr = `${padZero(startTimeDate.getHours())}:${padZero(startTimeDate.getMinutes())}`;
      movie.roomsMap.get(roomKey).push({
        showId: st.showId,
        time: timeStr,
        startTime: st.startTime,
        priceMultiplier: st.priceMultiplier,
      });
    });

    return Array.from(movieMap.values()).map((m) => ({
      ...m,
      formats: Array.from(m.roomsMap.entries()).map(([room, slots]) => ({
        room,
        slots: slots.sort((a, b) => a.time.localeCompare(b.time)),
      })),
    }));
  }, [showtimes]);

  // Tạo đúng 7 ngày của tuần đang xem (khung 7 ngày cố định khớp UI/showtime.png)
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekMonday);
      d.setDate(currentWeekMonday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentWeekMonday]);

  const isSelectedToday = isSameDay(selectedDate, today);

  // Chuyển sang 7 ngày của tuần tiếp theo
  const handleNextWeek = () => {
    const nextMonday = new Date(currentWeekMonday);
    nextMonday.setDate(nextMonday.getDate() + 7);
    setCurrentWeekMonday(nextMonday);
  };

  // Quay lại 7 ngày của tuần trước đó
  const handlePrevWeek = () => {
    const prevMonday = new Date(currentWeekMonday);
    prevMonday.setDate(prevMonday.getDate() - 7);
    setCurrentWeekMonday(prevMonday);
  };

  // Nút "Trở lại hôm nay : Ngày ... Tháng ... Năm ..."
  const handleBackToToday = () => {
    setSelectedDate(today);
    setCurrentWeekMonday(getMondayOfWeek(today));
    setPopupViewMonth(today.getMonth());
    setPopupViewYear(today.getFullYear());
  };

  // Chọn ngày trên thanh 7 thẻ
  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setPopupViewMonth(date.getMonth());
    setPopupViewYear(date.getFullYear());
  };

  // Xử lý khi chọn ngày trong Mini Calendar Popup
  const handleSelectDateFromPopup = (year, month, day) => {
    const chosen = new Date(year, month, day);
    chosen.setHours(0, 0, 0, 0);
    setSelectedDate(chosen);
    // Nhảy khung 7 thẻ ngày bên ngoài về đúng tuần của ngày vừa chọn
    setCurrentWeekMonday(getMondayOfWeek(chosen));
    setIsCalendarOpen(false);
  };

  // Chuỗi format cho nút "Trở lại hôm nay"
  const formattedTodayText = `Ngày ${padZero(today.getDate())} Tháng ${padZero(today.getMonth() + 1)} Năm ${today.getFullYear()}`;

  // Chuỗi Tháng - Năm ở góc trên bên phải (khớp với Tháng 10 - 2026 trong showtime.png)
  const headerMonthYear = `Tháng ${selectedDate.getMonth() + 1} - ${selectedDate.getFullYear()}`;

  // Tính toán các ô ngày cho Mini Calendar Popup
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(popupViewYear, popupViewMonth, 1).getDay();
    // Quy đổi Chủ nhật từ 0 thành 7 để Thứ 2 là cột đầu tiên (1..7)
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const daysInMonth = new Date(popupViewYear, popupViewMonth + 1, 0).getDate();

    const cells = [];
    // Các ô trống trước ngày 1
    for (let i = 0; i < startOffset; i++) {
      cells.push({ empty: true, id: `empty-${i}` });
    }
    // Các ngày trong tháng
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(popupViewYear, popupViewMonth, day);
      cellDate.setHours(0, 0, 0, 0);
      cells.push({
        empty: false,
        day,
        date: cellDate,
        isToday: isSameDay(cellDate, today),
        isSelected: isSameDay(cellDate, selectedDate),
        id: `day-${day}`,
      });
    }
    return cells;
  }, [popupViewYear, popupViewMonth, today, selectedDate]);

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-red-600 selection:text-white pb-32">
      {/* 1. Header dùng chung */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
        
        {/* Section: Header khu vực chọn ngày */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            {/* Left: Tiêu đề SELECT DATE */}
            <h1 className="text-sm sm:text-base font-extrabold tracking-wider text-zinc-300 uppercase">
              SELECT DATE
            </h1>

            {/* Right: Tháng - Năm kèm icon Lịch mở Popup chọn ngày bất kỳ */}
            <div className="relative" ref={calendarRef}>
              <button
                onClick={() => {
                  setPopupViewMonth(selectedDate.getMonth());
                  setPopupViewYear(selectedDate.getFullYear());
                  setIsCalendarOpen((prev) => !prev);
                }}
                type="button"
                className="group flex items-center space-x-2 bg-zinc-900/80 hover:bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-800 hover:border-zinc-700 transition cursor-pointer shadow-sm"
                title="Bấm để mở lịch chọn ngày bất kỳ"
              >
                <CalendarIcon className="w-4 h-4 text-[#e50914] group-hover:scale-110 transition-transform" />
                <span className="text-sm sm:text-base font-bold text-[#e50914] tracking-wide select-none">
                  {headerMonthYear}
                </span>
              </button>

              {/* Mini Calendar Popup thả xuống */}
              {isCalendarOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-2xl bg-[#1c1c1f] border border-zinc-700/80 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150">
                  {/* Popup Header: Điều hướng tháng/năm */}
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-800">
                    <button
                      onClick={() => {
                        if (popupViewMonth === 0) {
                          setPopupViewMonth(11);
                          setPopupViewYear((y) => y - 1);
                        } else {
                          setPopupViewMonth((m) => m - 1);
                        }
                      }}
                      type="button"
                      className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer"
                      title="Tháng trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <span className="text-sm font-bold text-white">
                      Tháng {popupViewMonth + 1}, {popupViewYear}
                    </span>

                    <button
                      onClick={() => {
                        if (popupViewMonth === 11) {
                          setPopupViewMonth(0);
                          setPopupViewYear((y) => y + 1);
                        } else {
                          setPopupViewMonth((m) => m + 1);
                        }
                      }}
                      type="button"
                      className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer"
                      title="Tháng sau"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Header Thứ trong tuần (T2 - CN) */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-zinc-400 mb-1">
                    <span>T2</span>
                    <span>T3</span>
                    <span>T4</span>
                    <span>T5</span>
                    <span>T6</span>
                    <span>T7</span>
                    <span className="text-red-400">CN</span>
                  </div>

                  {/* Grid các ngày trong tháng */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarGrid.map((cell) => {
                      if (cell.empty) {
                        return <div key={cell.id} className="h-8"></div>;
                      }

                      return (
                        <button
                          key={cell.id}
                          onClick={() => handleSelectDateFromPopup(popupViewYear, popupViewMonth, cell.day)}
                          type="button"
                          className={`h-8 w-full rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                            cell.isSelected
                              ? 'bg-[#e50914] text-white font-black shadow-md shadow-red-950/40 scale-105'
                              : cell.isToday
                              ? 'border border-[#e50914] text-[#e50914] font-bold hover:bg-zinc-800'
                              : 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
                          }`}
                        >
                          {cell.day}
                        </button>
                      );
                    })}
                  </div>

                  {/* Footer của popup: Nút chọn nhanh Hôm nay */}
                  <div className="mt-3 pt-2.5 border-t border-zinc-800 flex justify-between items-center text-xs">
                    <button
                      onClick={() => {
                        handleBackToToday();
                        setIsCalendarOpen(false);
                      }}
                      type="button"
                      className="text-[#e50914] hover:underline font-semibold cursor-pointer"
                    >
                      Chọn hôm nay
                    </button>
                    <button
                      onClick={() => setIsCalendarOpen(false)}
                      type="button"
                      className="text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Nút "Trở lại hôm nay : Ngày ... Tháng ... Năm ..." với hiệu ứng mượt mà (Fade in + Slide down) */}
          <div
            className={`grid transition-all duration-300 ease-out overflow-hidden ${
              !isSelectedToday
                ? 'grid-rows-[1fr] opacity-100 pt-2 pb-1'
                : 'grid-rows-[0fr] opacity-0 pt-0 pb-0 pointer-events-none'
            }`}
          >
            <div className="overflow-hidden min-h-0 flex justify-start sm:justify-end">
              <button
                onClick={handleBackToToday}
                type="button"
                className={`group flex items-center space-x-2 bg-zinc-900/90 hover:bg-[#e50914] text-zinc-300 hover:text-white px-3.5 py-1.5 rounded-full border border-zinc-700/70 hover:border-[#e50914] text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer shadow-md transform ${
                  !isSelectedToday ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#e50914] group-hover:text-white transition-colors group-hover:-rotate-90 duration-200" />
                <span>Trở lại hôm nay : {formattedTodayText}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section: Thanh chọn 7 ngày (Khung 7 ngày cố định khớp chuẩn UI/showtime.png) */}
        <section aria-label="Thanh chọn ngày chiếu" className="relative transition-all duration-300 ease-out">
          <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-5xl mx-auto">
            
            {/* Nút mũi tên Trái ← (Chuyển sang 7 ngày của tuần trước) */}
            <button
              onClick={handlePrevWeek}
              type="button"
              className="flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-[#1b1b1e] hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition border border-zinc-800 hover:border-zinc-700 cursor-pointer shadow-lg active:scale-95"
              title="7 ngày trước"
              aria-label="7 ngày trước"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Khung 7 thẻ ngày chuẩn cố định */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-3 flex-1">
              {weekDays.map((d) => {
                const isSelected = isSameDay(d, selectedDate);
                const isCurrentToday = isSameDay(d, today);

                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => handleSelectDate(d)}
                    type="button"
                    className={`relative flex flex-col items-center justify-center h-22 sm:h-28 rounded-2xl sm:rounded-3xl transition-all duration-200 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#e50914] text-white shadow-xl shadow-red-950/60 scale-105 border-2 border-[#e50914] z-10'
                        : 'bg-[#1b1b1e] hover:bg-[#232328] text-zinc-300 border border-zinc-800 hover:border-zinc-700 hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Thứ trong tuần: TH 2, TH 3... CN */}
                    <span
                      className={`text-[11px] sm:text-sm font-semibold tracking-wide ${
                        isSelected ? 'text-white/95' : 'text-zinc-400'
                      }`}
                    >
                      {getDayOfWeekText(d)}
                    </span>

                    {/* Số ngày to rõ ở giữa */}
                    <span
                      className={`text-lg sm:text-3xl font-black mt-1 leading-none ${
                        isSelected ? 'text-white' : 'text-zinc-100'
                      }`}
                    >
                      {padZero(d.getDate())}
                    </span>

                    {/* Yêu cầu: khi bấm đổi qua ngày khác, ngày hiện tại có chữ màu đỏ "Hôm nay" trên card */}
                    {isCurrentToday && !isSelected && (
                      <span className="text-[10px] sm:text-[11px] font-extrabold text-[#e50914] mt-1.5 leading-tight tracking-tight">
                        Hôm nay
                      </span>
                    )}

                    {/* Khi ngày hôm nay được chọn: hiển thị nhãn màu trắng nhỏ */}
                    {isCurrentToday && isSelected && (
                      <span className="text-[10px] sm:text-[11px] font-bold text-white/90 mt-1.5 leading-tight">
                        Hôm nay
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Nút mũi tên Phải → (Chuyển sang 7 ngày của tuần tiếp theo) */}
            <button
              onClick={handleNextWeek}
              type="button"
              className="flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-[#1b1b1e] hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition border border-zinc-800 hover:border-zinc-700 cursor-pointer shadow-lg active:scale-95"
              title="7 ngày tiếp theo"
              aria-label="7 ngày tiếp theo"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </section>

        {/* Section: Danh sách suất chiếu theo ngày được chọn */}
        <section aria-label="Danh sách suất chiếu" className="space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-5 bg-[#e50914] rounded-full inline-block"></span>
              <span>
                Suất chiếu ngày {padZero(selectedDate.getDate())}/{padZero(selectedDate.getMonth() + 1)}/{selectedDate.getFullYear()}
              </span>
            </h2>

            <span className="text-xs text-zinc-400">
              {groupedMovies.length} phim đang có suất chiếu
            </span>
          </div>

          {/* Danh sách từng phim và các khung giờ chiếu */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400 bg-[#1b1b1e]/60 rounded-2xl border border-zinc-800">
              <Loader2 className="w-8 h-8 animate-spin text-[#e50914] mb-3" />
              <p className="text-sm font-medium">Đang tải lịch chiếu từ rạp...</p>
            </div>
          ) : groupedMovies.length === 0 ? (
            <div className="bg-[#1b1b1e] border border-zinc-800/90 rounded-2xl p-12 text-center text-zinc-400 space-y-3">
              <Film className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-base font-bold text-white">Chưa có suất chiếu cho ngày này</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Hiện tại chưa có lịch chiếu nào vào ngày {padZero(selectedDate.getDate())}/{padZero(selectedDate.getMonth() + 1)}/{selectedDate.getFullYear()}. Bạn hãy chọn các ngày khác nhé!
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {groupedMovies.map((movie) => (
                <div
                  key={movie.movieId}
                  className="bg-[#1b1b1e] border border-zinc-800/90 rounded-2xl p-4 sm:p-6 shadow-xl hover:border-zinc-700/80 transition-all duration-200"
                >
                  {/* Thông tin phim */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800/70 gap-2">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`text-[10px] sm:text-xs font-black text-white px-2 py-0.5 rounded-md ${movie.ageColor}`}
                      >
                        {movie.ageLimit}
                      </span>
                      <h3 
                        onClick={() => navigate(`/booking?movieId=${movie.movieId}`)}
                        className="text-base sm:text-lg font-bold text-white hover:text-[#e50914] transition-colors cursor-pointer"
                      >
                        {movie.title}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{movie.duration}</span>
                      </span>
                      <span className="hidden sm:inline-block">•</span>
                      <span>{movie.genre}</span>
                    </div>
                  </div>

                  {/* Các định dạng & khung giờ chiếu */}
                  <div className="pt-4 space-y-4">
                    {movie.formats.map((format, idx) => (
                      <div key={idx} className="space-y-2">
                        <p className="text-xs font-semibold text-zinc-400">
                          {format.room}
                        </p>

                        <div className="flex flex-wrap gap-2.5">
                          {format.slots.map((slot) => (
                            <button
                              key={slot.showId}
                              onClick={() => {
                                const yyyy = selectedDate.getFullYear();
                                const mm = padZero(selectedDate.getMonth() + 1);
                                const dd = padZero(selectedDate.getDate());
                                const dateStr = `${yyyy}-${mm}-${dd}`;
                                navigate(`/booking?movieId=${movie.movieId}&time=${slot.time}&date=${dateStr}&showId=${slot.showId}`);
                              }}
                              type="button"
                              className="group flex flex-col items-center justify-center px-4 py-2 rounded-xl bg-zinc-900/90 hover:bg-[#e50914] text-zinc-200 hover:text-white border border-zinc-800 hover:border-[#e50914] transition-all duration-150 cursor-pointer shadow-sm hover:scale-105"
                            >
                              <span className="text-sm sm:text-base font-black">
                                {slot.time}
                              </span>
                              <span className="text-[10px] text-zinc-400 group-hover:text-white/80 font-medium mt-0.5">
                                Từ 60.000 đ
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* 2. Messenger Floating Action Button */}
      <MessengerButton />

      {/* 3. Bottom Navigation Bar dạng nổi viên thuốc (Active vào mục "Lịch chiếu") */}
      <BottomNav activeId="showtimes" />
    </div>
  );
};

export default ShowtimePage;
