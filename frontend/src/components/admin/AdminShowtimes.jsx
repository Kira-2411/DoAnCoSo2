import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  Film,
  Building2,
  AlertCircle,
  Edit,
  Ban,
  Loader2,
  RotateCcw,
  CheckCircle2,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import adminApi from '../../api/adminApi';
import { useAdminToast } from './AdminLayout';
import AdminModal from './AdminModal';
import AdminConfirmDialog from './AdminConfirmDialog';
import AdminFormField from './AdminFormField';
import { calculateEndTime } from '../../mocks/adminMockData';

// Helper format ngày giờ tiếng Việt
const formatDateTime = (isoString) => {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${timeStr} - ${dateStr}`;
};

const formatTimeOnly = (isoString) => {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDateOnly = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

// Chuyển ISO / Date sang format cho input type="datetime-local" (YYYY-MM-DDTHH:mm)
const toInputDateTime = (dateObj) => {
  const d = dateObj ? new Date(dateObj) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const INITIAL_FORM = {
  movieId: '',
  roomId: '',
  startTime: '',
  endTime: '',
  priceMultiplier: '1.00',
};

const AdminShowtimes = () => {
  const { showToast } = useAdminToast();

  // Dữ liệu danh sách & phụ thuộc
  const [showtimes, setShowtimes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Bộ lọc
  const [filterDate, setFilterDate] = useState('');
  const [filterMovie, setFilterMovie] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  // Debounce tìm kiếm 300ms
  const searchTimerRef = useRef(null);
  const handleKeywordChange = (e) => {
    const val = e.target.value;
    setKeyword(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedKeyword(val);
    }, 300);
  };

  // Modal Thêm/Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Confirm Hủy suất chiếu
  const [cancelTarget, setCancelTarget] = useState(null);
  const [canceling, setCanceling] = useState(false);

  // 1. Tải danh sách phòng và phim phục vụ dropdown
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [roomsData, moviesRes] = await Promise.all([
          adminApi.listRooms(),
          adminApi.listMovies({ includeInactive: true, size: 200 }),
        ]);
        setRooms(roomsData);
        setAllMovies(moviesRes.content || []);
      } catch (err) {
        console.error('Lỗi tải danh mục phim/phòng:', err);
      }
    };
    loadDependencies();
  }, []);

  // 2. Tải danh sách suất chiếu khi filter thay đổi
  const fetchShowtimes = async () => {
    setLoading(true);
    try {
      const data = await adminApi.listShowtimes({
        date: filterDate,
        movieId: filterMovie,
        roomId: filterRoom,
        keyword: debouncedKeyword,
      });
      setShowtimes(data);
    } catch (err) {
      console.error('Lỗi tải suất chiếu:', err);
      showToast('error', 'Không thể tải danh sách suất chiếu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowtimes();
  }, [filterDate, filterMovie, filterRoom, debouncedKeyword]);

  // Lọc phim hợp lệ để tạo/sửa suất chiếu:
  // Quy tắc người dùng: chỉ cho chọn phim đang hiển thị (isActive) và movieStatus khác ENDED (BR-SHOW-03)
  const validMoviesForShowtime = allMovies.filter(
    (m) => m.isActive && m.movieStatus !== 'ENDED'
  );

  // Lọc phòng đang hoạt động (BR-SHOW-03)
  const validRoomsForShowtime = rooms.filter((r) => r.isActive);

  // Tự động tính endTime khi người dùng thay đổi movieId hoặc startTime
  const updateEndTime = (newMovieId, newStartTime) => {
    if (!newMovieId || !newStartTime) {
      return '';
    }
    const movie = allMovies.find((m) => m.movieId === Number(newMovieId));
    const duration = movie?.duration || 120;
    try {
      return calculateEndTime(newStartTime, duration);
    } catch (e) {
      return '';
    }
  };

  const handleMovieChange = (movieId) => {
    const end = updateEndTime(movieId, formData.startTime);
    setFormData((prev) => ({
      ...prev,
      movieId,
      endTime: end,
    }));
    if (formErrors.movieId) {
      setFormErrors((prev) => ({ ...prev, movieId: '' }));
    }
  };

  const handleStartTimeChange = (startTime) => {
    const end = updateEndTime(formData.movieId, startTime);
    setFormData((prev) => ({
      ...prev,
      startTime,
      endTime: end,
    }));
    if (formErrors.startTime) {
      setFormErrors((prev) => ({ ...prev, startTime: '' }));
    }
  };

  // Mở modal thêm
  const handleOpenAdd = () => {
    setEditingShowtime(null);
    // Gợi ý giờ bắt đầu là 2 tiếng sau hiện tại
    const defaultStart = new Date(Date.now() + 2 * 3600 * 1000);
    const startStr = toInputDateTime(defaultStart);
    const firstMovieId = validMoviesForShowtime[0]?.movieId || '';
    const firstRoomId = validRoomsForShowtime[0]?.roomId || '';
    const calculatedEnd = updateEndTime(firstMovieId, startStr);

    setFormData({
      movieId: firstMovieId ? String(firstMovieId) : '',
      roomId: firstRoomId ? String(firstRoomId) : '',
      startTime: startStr,
      endTime: calculatedEnd,
      priceMultiplier: '1.00',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Mở modal sửa
  const handleOpenEdit = (showtime) => {
    if (showtime.hasPaidBookings) {
      showToast('error', 'Suất chiếu đã có đơn thanh toán, không thể thay đổi thông tin (BR-SHOW-05)');
      return;
    }
    setEditingShowtime(showtime);
    setFormData({
      movieId: String(showtime.movieId),
      roomId: String(showtime.roomId),
      startTime: toInputDateTime(new Date(showtime.startTime)),
      endTime: toInputDateTime(new Date(showtime.endTime)),
      priceMultiplier: Number(showtime.priceMultiplier).toFixed(2),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Submit form Thêm/Sửa
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.movieId) {
      errors.movieId = 'Vui lòng chọn phim';
    }
    if (!formData.roomId) {
      errors.roomId = 'Vui lòng chọn phòng chiếu';
    }
    if (!formData.startTime) {
      errors.startTime = 'Vui lòng chọn giờ bắt đầu';
    } else {
      const startMs = new Date(formData.startTime).getTime();
      if (isNaN(startMs)) {
        errors.startTime = 'Thời gian không hợp lệ';
      } else if (startMs < Date.now() && !editingShowtime) {
        // BR-SHOW-03: không tạo suất trong quá khứ
        errors.startTime = 'Không được tạo suất chiếu trong quá khứ (BR-SHOW-03)';
      }
    }

    const mult = Number(formData.priceMultiplier);
    if (isNaN(mult) || mult < 0.5 || mult > 3.0) {
      errors.priceMultiplier = 'Hệ số giá phải từ 0.50 đến 3.00';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    setFormErrors({});

    try {
      const payload = {
        movieId: Number(formData.movieId),
        roomId: Number(formData.roomId),
        startTime: new Date(formData.startTime).toISOString().slice(0, 16),
        priceMultiplier: Number(formData.priceMultiplier),
      };

      if (editingShowtime) {
        await adminApi.updateShowtime(editingShowtime.showId, payload);
        showToast('success', 'Cập nhật suất chiếu thành công');
      } else {
        await adminApi.createShowtime(payload);
        showToast('success', 'Tạo suất chiếu mới thành công');
      }

      setIsModalOpen(false);
      fetchShowtimes();
    } catch (err) {
      console.error('Lỗi lưu suất chiếu:', err);
      if (err.code === 'SHOWTIME_OVERLAP') {
        setFormErrors({ general: err.message || 'Phòng chiếu đã có suất chiếu khác trùng thời gian này (BR-SHOW-02)' });
        showToast('error', err.message);
      } else if (err.code === 'HAS_PAID_BOOKINGS') {
        setFormErrors({ general: err.message });
        showToast('error', err.message);
      } else {
        setFormErrors({ general: err.message || 'Có lỗi xảy ra khi lưu suất chiếu' });
        showToast('error', err.message || 'Có lỗi xảy ra');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Xác nhận hủy suất chiếu (BR-SHOW-06)
  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCanceling(true);
    try {
      await adminApi.cancelShowtime(cancelTarget.showId);
      showToast('success', `Đã hủy suất chiếu thành công`);
      setCancelTarget(null);
      fetchShowtimes();
    } catch (err) {
      console.error('Lỗi hủy suất chiếu:', err);
      if (err.code === 'HAS_PAID_BOOKINGS') {
        showToast('error', 'Suất chiếu đã có đơn thanh toán, cần hủy các đơn đó trước (BR-SHOW-06)');
      } else {
        showToast('error', err.message || 'Không thể hủy suất chiếu');
      }
      setCancelTarget(null);
    } finally {
      setCanceling(false);
    }
  };

  // Reset bộ lọc
  const handleResetFilters = () => {
    setFilterDate('');
    setFilterMovie('');
    setFilterRoom('');
    setKeyword('');
    setDebouncedKeyword('');
  };

  const selectedMovieObj = allMovies.find((m) => m.movieId === Number(formData.movieId));

  return (
    <div className="space-y-6">
      {/* Header và nút Thêm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-rose-500" />
            Quản lý Suất chiếu
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Lên lịch chiếu phim, quản lý giờ chiếu và hệ số giá vé (BR-SHOW-01 đến 06)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-lg shadow-rose-950/50 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm suất chiếu</span>
        </button>
      </div>

      {/* Thanh bộ lọc và tìm kiếm */}
      <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Tìm kiếm tên phim / phòng */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={keyword}
              onChange={handleKeywordChange}
              placeholder="Tìm phim, phòng chiếu..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-800/80 border border-zinc-700/80 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          {/* Lọc theo Ngày */}
          <div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700/80 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          {/* Lọc theo Phim */}
          <div>
            <select
              value={filterMovie}
              onChange={(e) => setFilterMovie(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700/80 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-rose-500 transition-colors"
            >
              <option value="">Tất cả phim</option>
              {allMovies.map((m) => (
                <option key={m.movieId} value={m.movieId}>
                  {m.title} {!m.isActive ? '(Đã ẩn)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Phòng */}
          <div>
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700/80 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-rose-500 transition-colors"
            >
              <option value="">Tất cả phòng chiếu</option>
              {rooms.map((r) => (
                <option key={r.roomId} value={r.roomId}>
                  {r.roomName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Nút reset bộ lọc */}
        {(filterDate || filterMovie || filterRoom || keyword) && (
          <div className="flex items-center justify-end pt-1">
            <button
              onClick={handleResetFilters}
              className="text-xs text-zinc-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        )}
      </div>

      {/* Bảng danh sách suất chiếu */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500 mb-2" />
          <p className="text-sm">Đang tải danh sách suất chiếu...</p>
        </div>
      ) : showtimes.length === 0 ? (
        <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl p-12 text-center">
          <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-medium text-zinc-300">Không tìm thấy suất chiếu nào</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Hãy thử thay đổi điều kiện tìm kiếm hoặc bấm &quot;Thêm suất chiếu&quot; để tạo lịch chiếu mới.
          </p>
        </div>
      ) : (
        <>
          {/* Giao diện Desktop: Bảng */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-800/60 text-xs uppercase font-semibold text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3.5">Mã</th>
                  <th className="px-4 py-3.5">Phim</th>
                  <th className="px-4 py-3.5">Phòng</th>
                  <th className="px-4 py-3.5">Ngày & Giờ chiếu</th>
                  <th className="px-4 py-3.5">Giờ kết thúc</th>
                  <th className="px-4 py-3.5 text-center">Hệ số giá</th>
                  <th className="px-4 py-3.5 text-center">Trạng thái</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {showtimes.map((item) => {
                  const isCanceled = !item.isActive;
                  const isPast = new Date(item.endTime).getTime() < Date.now();

                  return (
                    <tr
                      key={item.showId}
                      className={`hover:bg-zinc-800/30 transition-colors ${
                        isCanceled ? 'opacity-50 bg-zinc-950/40' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                        #{item.showId}
                      </td>

                      <td className="px-4 py-3 font-medium text-white max-w-xs">
                        <div className="flex items-center gap-2">
                          <Film className="w-4 h-4 text-rose-500 flex-shrink-0" />
                          <span className="truncate" title={item.movieTitle}>
                            {item.movieTitle}
                          </span>
                        </div>
                        {item.hasPaidBookings && (
                          <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Đã có đơn đặt vé
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-zinc-300">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{item.roomName}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-zinc-200 font-medium">
                          {formatTimeOnly(item.startTime)}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {formatDateOnly(item.startTime)}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-zinc-400 text-xs">
                        {formatTimeOnly(item.endTime)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-zinc-800 text-rose-400 border border-zinc-700">
                          x{Number(item.priceMultiplier).toFixed(2)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        {isCanceled ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                            Đã hủy
                          </span>
                        ) : isPast ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                            Đã qua
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Đang mở
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isCanceled && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                disabled={item.hasPaidBookings || isPast}
                                title={
                                  item.hasPaidBookings
                                    ? 'Suất chiếu đã có đơn thanh toán, không thể sửa (BR-SHOW-05)'
                                    : isPast
                                    ? 'Suất chiếu đã qua'
                                    : 'Sửa suất chiếu'
                                }
                                className={`p-1.5 rounded-lg transition-colors ${
                                  item.hasPaidBookings || isPast
                                    ? 'text-zinc-600 cursor-not-allowed'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                }`}
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setCancelTarget(item)}
                                title={
                                  item.hasPaidBookings
                                    ? 'Có đơn thanh toán (nhấn để kiểm tra thông báo lỗi 409)'
                                    : 'Hủy suất chiếu'
                                }
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {isCanceled && (
                            <span className="text-xs text-zinc-500 italic pr-2">
                              Không khả dụng
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Giao diện Mobile: Dạng thẻ */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {showtimes.map((item) => {
              const isCanceled = !item.isActive;
              const isPast = new Date(item.endTime).getTime() < Date.now();

              return (
                <div
                  key={item.showId}
                  className={`p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3 ${
                    isCanceled ? 'opacity-60 bg-zinc-950/40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-white text-base flex items-center gap-1.5">
                        <Film className="w-4 h-4 text-rose-500 flex-shrink-0" />
                        <span>{item.movieTitle}</span>
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{item.roomName}</span>
                      </p>
                    </div>

                    <div>
                      {isCanceled ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-400">
                          Đã hủy
                        </span>
                      ) : isPast ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-400">
                          Đã qua
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/20 text-emerald-400">
                          Đang mở
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-800/40 p-2.5 rounded-lg border border-zinc-800">
                    <div>
                      <span className="text-zinc-500 block">Thời gian:</span>
                      <span className="font-medium text-zinc-200">
                        {formatTimeOnly(item.startTime)} - {formatTimeOnly(item.endTime)}
                      </span>
                      <span className="text-[11px] text-zinc-400 block">
                        {formatDateOnly(item.startTime)}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">Hệ số giá:</span>
                      <span className="font-mono text-rose-400 font-medium">
                        x{Number(item.priceMultiplier).toFixed(2)}
                      </span>
                      {item.hasPaidBookings && (
                        <span className="text-[10px] text-amber-400 block mt-0.5">
                          Đã có đơn đặt vé
                        </span>
                      )}
                    </div>
                  </div>

                  {!isCanceled && (
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800/60">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        disabled={item.hasPaidBookings || isPast}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                          item.hasPaidBookings || isPast
                            ? 'text-zinc-600 bg-zinc-800/40 cursor-not-allowed'
                            : 'text-zinc-300 bg-zinc-800 hover:bg-zinc-700'
                        }`}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>

                      <button
                        onClick={() => setCancelTarget(item)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 flex items-center gap-1.5"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Hủy suất</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal Thêm / Sửa Suất chiếu */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingShowtime ? 'Sửa suất chiếu' : 'Thêm suất chiếu mới'}
        description="Điền thông tin phim, phòng chiếu và giờ chiếu. Giờ kết thúc sẽ tự động tính toán (BR-SHOW-01 đến 04)."
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formErrors.general && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{formErrors.general}</span>
            </div>
          )}

          {/* Chọn Phim */}
          <AdminFormField
            label="Phim chiếu (chỉ phim đang chiếu/sắp chiếu và chưa bị ẩn)"
            required
            error={formErrors.movieId}
          >
            <select
              value={formData.movieId}
              onChange={(e) => handleMovieChange(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-rose-500"
            >
              <option value="">-- Chọn phim --</option>
              {validMoviesForShowtime.map((m) => (
                <option key={m.movieId} value={m.movieId}>
                  {m.title} ({m.duration} phút)
                </option>
              ))}
            </select>
          </AdminFormField>

          {/* Chọn Phòng */}
          <AdminFormField
            label="Phòng chiếu (chỉ phòng đang hoạt động)"
            required
            error={formErrors.roomId}
          >
            <select
              value={formData.roomId}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, roomId: e.target.value }));
                if (formErrors.roomId) setFormErrors((prev) => ({ ...prev, roomId: '' }));
              }}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-rose-500"
            >
              <option value="">-- Chọn phòng chiếu --</option>
              {validRoomsForShowtime.map((r) => (
                <option key={r.roomId} value={r.roomId}>
                  {r.roomName} ({r.totalSeats} ghế)
                </option>
              ))}
            </select>
          </AdminFormField>

          {/* Thời gian bắt đầu */}
          <AdminFormField
            label="Giờ bắt đầu chiếu"
            required
            error={formErrors.startTime}
            helperText="Không được chọn giờ trong quá khứ (BR-SHOW-03)"
          >
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-rose-500"
            />
          </AdminFormField>

          {/* Thời gian kết thúc (Chỉ đọc) */}
          <AdminFormField
            label="Giờ kết thúc dự kiến (Tự động tính: thời lượng phim + 15 phút dọn dẹp)"
            helperText="Trường chỉ đọc, tự cập nhật khi đổi phim hoặc giờ bắt đầu"
          >
            <input
              type="text"
              readOnly
              value={
                formData.endTime
                  ? `${formatDateTime(formData.endTime)} (${selectedMovieObj?.duration || 120}p phim + 15p dọn)`
                  : 'Chưa xác định'
              }
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-400 cursor-not-allowed"
            />
          </AdminFormField>

          {/* Hệ số giá */}
          <AdminFormField
            label="Hệ số giá vé (priceMultiplier)"
            required
            error={formErrors.priceMultiplier}
            helperText="Từ 0.50 đến 3.00 (mặc định 1.00; giờ vàng/cuối tuần có thể đặt 1.10 - 1.20)"
          >
            <input
              type="number"
              step="0.05"
              min="0.5"
              max="3.0"
              value={formData.priceMultiplier}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, priceMultiplier: e.target.value }));
                if (formErrors.priceMultiplier) {
                  setFormErrors((prev) => ({ ...prev, priceMultiplier: '' }));
                }
              }}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-rose-500"
            />
          </AdminFormField>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm transition-all disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editingShowtime ? 'Lưu thay đổi' : 'Tạo suất chiếu'}</span>
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Confirm Hủy suất chiếu */}
      <AdminConfirmDialog
        isOpen={Boolean(cancelTarget)}
        title="Hủy suất chiếu"
        message={
          cancelTarget
            ? `Bạn có chắc chắn muốn hủy suất chiếu phim "${cancelTarget.movieTitle}" lúc ${formatDateTime(
                cancelTarget.startTime
              )} tại ${
                cancelTarget.roomName
              }? Suất chiếu sẽ bị ẩn khỏi khách đặt vé, dữ liệu lịch sử được giữ lại.`
            : ''
        }
        confirmText="Hủy suất chiếu"
        cancelText="Đóng"
        danger
        loading={canceling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
};

export default AdminShowtimes;

