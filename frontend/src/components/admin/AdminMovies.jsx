import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  EyeOff, 
  Edit, 
  Film, 
  Clock, 
  Calendar, 
  Loader2 
} from 'lucide-react';
import adminApi from '../../api/adminApi';
import { useAdminToast } from './AdminLayout';
import AdminModal from './AdminModal';
import AdminConfirmDialog from './AdminConfirmDialog';
import AdminFormField from './AdminFormField';
import AdminPagination from './AdminPagination';
import {
  validateRequired,
  validateMaxLength,
  validatePositiveInteger,
  validateImageUrl,
} from '../../utils/validators';

const MOVIE_STATUS_LABELS = {
  NOW_SHOWING: { text: 'Đang chiếu', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  COMING_SOON: { text: 'Sắp chiếu', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  ENDED: { text: 'Ngừng chiếu', color: 'bg-zinc-700/40 text-zinc-400 border-zinc-600/30' },
};

const INITIAL_FORM_STATE = {
  title: '',
  description: '',
  duration: 120,
  genre: '',
  ageLimit: 'P',
  releaseDate: '',
  movieStatus: 'NOW_SHOWING',
  posterUrl: '',
};

const AdminMovies = () => {
  const { showToast } = useAdminToast();

  // State danh sách & bộ lọc
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [includeInactive, setIncludeInactive] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal thêm/sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Dialog xác nhận ẩn/hiện
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    movie: null,
    action: 'hide', // 'hide' | 'restore'
    loading: false,
  });

  // Debounce ô tìm kiếm 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setPage(0); // Reset về trang 1 khi gõ tìm kiếm
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Tải danh sách phim từ mock API
  const fetchMovies = async () => {
    try {
      setLoading(true);
      const data = await adminApi.listMovies({
        keyword: debouncedKeyword,
        status: statusFilter,
        includeInactive,
        page,
        size: 10,
      });
      setMovies(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      showToast('Lỗi khi tải danh sách phim', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [debouncedKeyword, statusFilter, includeInactive, page]);

  // Mở modal thêm mới
  const handleOpenAdd = () => {
    setEditingMovie(null);
    setFormData(INITIAL_FORM_STATE);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Mở modal sửa
  const handleOpenEdit = (movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title || '',
      description: movie.description || '',
      duration: movie.duration || 120,
      genre: movie.genre || '',
      ageLimit: movie.ageLimit || 'P',
      releaseDate: movie.releaseDate || '',
      movieStatus: movie.movieStatus || 'NOW_SHOWING',
      posterUrl: movie.posterUrl || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Validate form trước khi submit
  const validateForm = () => {
    const errors = {};
    const titleErr = validateRequired(formData.title, 'Vui lòng nhập tên phim') ||
                     validateMaxLength(formData.title, 255, 'Tên phim tối đa 255 ký tự');
    if (titleErr) errors.title = titleErr;

    const durErr = validateRequired(formData.duration, 'Vui lòng nhập thời lượng') ||
                   validatePositiveInteger(formData.duration, 'Thời lượng phải là số nguyên dương');
    if (durErr) errors.duration = durErr;

    const genreErr = validateMaxLength(formData.genre, 100, 'Thể loại tối đa 100 ký tự');
    if (genreErr) errors.genre = genreErr;

    const imgErr = validateImageUrl(formData.posterUrl);
    if (imgErr) errors.posterUrl = imgErr;

    setFormErrors(errors);

    // Focus vào ô lỗi đầu tiên
    if (Object.keys(errors).length > 0) {
      const firstErrorKey = Object.keys(errors)[0];
      const el = document.getElementById(`movie-${firstErrorKey}`);
      if (el) el.focus();
      return false;
    }
    return true;
  };

  // Lưu phim (Thêm mới hoặc Cập nhật)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || submitting) return;

    try {
      setSubmitting(true);
      if (editingMovie) {
        await adminApi.updateMovie(editingMovie.movieId, formData);
        showToast(`Đã cập nhật phim "${formData.title}"`);
      } else {
        await adminApi.createMovie(formData);
        showToast(`Đã thêm phim mới "${formData.title}"`);
      }
      setIsModalOpen(false);
      fetchMovies();
    } catch (err) {
      showToast(err.message || 'Không thể lưu phim lúc này', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Xác nhận ẩn hoặc hiện lại phim
  const handleConfirmAction = async () => {
    const { movie, action } = confirmDialog;
    if (!movie) return;

    try {
      setConfirmDialog((prev) => ({ ...prev, loading: true }));
      if (action === 'hide') {
        await adminApi.hideMovie(movie.movieId);
        showToast(`Đã ẩn phim "${movie.title}"`);
      } else {
        await adminApi.restoreMovie(movie.movieId);
        showToast(`Đã hiện lại phim "${movie.title}"`);
      }
      setConfirmDialog({ isOpen: false, movie: null, action: 'hide', loading: false });
      fetchMovies();
    } catch (err) {
      showToast('Thao tác không thành công', 'error');
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Film className="w-6 h-6 text-[#e50914]" />
            <span>Quản Lý Phim</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Quản lý thông tin phim chiếu rạp, áp dụng quy tắc ẩn phim bảo toàn lịch sử đặt vé (BR-MOV-03)
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 bg-[#e50914] hover:bg-[#b80710] text-white font-bold px-4 py-2.5 rounded-xl transition shadow-lg shadow-red-950/40 text-xs sm:text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Thêm phim mới</span>
        </button>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 bg-[#18181b] p-4 rounded-2xl border border-zinc-800">
        {/* Search Input */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên phim hoặc thể loại..."
            className="w-full bg-[#121214] border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e50914] transition"
          />
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="w-full bg-[#121214] border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#e50914] transition"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="NOW_SHOWING">Đang chiếu</option>
            <option value="COMING_SOON">Sắp chiếu</option>
            <option value="ENDED">Ngừng chiếu</option>
          </select>
        </div>

        {/* Include Inactive Checkbox */}
        <div className="sm:col-span-3 flex items-center gap-2 px-2">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => {
                setIncludeInactive(e.target.checked);
                setPage(0);
              }}
              className="w-4 h-4 rounded text-[#e50914] focus:ring-red-500 focus:ring-offset-0 bg-zinc-900 border-zinc-700"
            />
            <span>Xem cả phim đã ẩn</span>
          </label>
        </div>
      </div>

      {/* Main List Table / Cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#e50914]" />
          <span className="text-sm">Đang tải danh sách phim...</span>
        </div>
      ) : movies.length === 0 ? (
        <div className="py-16 text-center bg-[#18181b] rounded-2xl border border-zinc-800 text-zinc-400 space-y-2">
          <Film className="w-10 h-10 text-zinc-600 mx-auto" />
          <p className="text-sm font-semibold text-zinc-300">Không tìm thấy bộ phim nào phù hợp</p>
          <p className="text-xs text-zinc-500">Hãy thử đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc</p>
        </div>
      ) : (
        <div className="bg-[#18181b] rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-[#141416] text-zinc-400 font-bold">
                  <th className="py-3.5 px-4 w-16 text-center">Poster</th>
                  <th className="py-3.5 px-4">Tên phim</th>
                  <th className="py-3.5 px-4">Thể loại</th>
                  <th className="py-3.5 px-4">Thời lượng</th>
                  <th className="py-3.5 px-4">Độ tuổi</th>
                  <th className="py-3.5 px-4">Khởi chiếu</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-center">Hiển thị</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {movies.map((movie) => {
                  const statusInfo = MOVIE_STATUS_LABELS[movie.movieStatus] || { text: movie.movieStatus, color: 'text-zinc-400' };

                  return (
                    <tr
                      key={movie.movieId}
                      className={`hover:bg-zinc-850/50 transition-colors ${
                        !movie.isActive ? 'opacity-60 bg-black/20' : ''
                      }`}
                    >
                      {/* Poster */}
                      <td className="py-3 px-4 text-center">
                        <div className="w-10 h-14 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden mx-auto flex items-center justify-center">
                          {movie.posterUrl ? (
                            <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                          ) : (
                            <Film className="w-4 h-4 text-zinc-600" />
                          )}
                        </div>
                      </td>

                      {/* Title */}
                      <td className="py-3 px-4 font-bold text-white">
                        <div className="flex flex-col">
                          <span>{movie.title}</span>
                          {!movie.isActive && (
                            <span className="text-[10px] text-red-400 font-medium">● Đã ẩn khỏi website</span>
                          )}
                        </div>
                      </td>

                      {/* Genre */}
                      <td className="py-3 px-4 text-zinc-300">{movie.genre || '—'}</td>

                      {/* Duration */}
                      <td className="py-3 px-4 text-zinc-300">{movie.duration} phút</td>

                      {/* Age Limit */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-red-600/20 text-[#e50914] border border-red-800/40 font-black text-[11px]">
                          {movie.ageLimit}
                        </span>
                      </td>

                      {/* Release Date */}
                      <td className="py-3 px-4 text-zinc-400">{movie.releaseDate || '—'}</td>

                      {/* Movie Status */}
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </td>

                      {/* IsActive */}
                      <td className="py-3 px-4 text-center">
                        {movie.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Hiển thị</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500">
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Đã ẩn</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(movie)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer"
                          title="Sửa thông tin phim"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {movie.isActive ? (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDialog({
                                isOpen: true,
                                movie,
                                action: 'hide',
                                loading: false,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 text-xs font-bold transition cursor-pointer"
                            title="Ẩn phim khỏi website"
                          >
                            Xóa (Ẩn)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDialog({
                                isOpen: true,
                                movie,
                                action: 'restore',
                                loading: false,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/40 text-xs font-bold transition cursor-pointer"
                            title="Hiện lại phim trên website"
                          >
                            Hiện lại
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="lg:hidden p-4 space-y-3">
            {movies.map((movie) => {
              const statusInfo = MOVIE_STATUS_LABELS[movie.movieStatus] || { text: movie.movieStatus, color: 'text-zinc-400' };

              return (
                <div
                  key={movie.movieId}
                  className={`p-3.5 rounded-xl border border-zinc-800 bg-[#141416] space-y-3 ${
                    !movie.isActive ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-22 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden flex-shrink-0">
                      {movie.posterUrl ? (
                        <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <Film className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-extrabold text-white text-sm line-clamp-1">{movie.title}</h4>
                        <span className="px-1.5 py-0.5 rounded bg-red-600/20 text-[#e50914] text-[10px] font-black flex-shrink-0">
                          {movie.ageLimit}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">{movie.genre || 'Chưa phân loại'}</p>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 pt-1">
                        <span>{movie.duration} phút</span>
                        <span>•</span>
                        <span>{movie.releaseDate || '—'}</span>
                      </div>
                      <div className="pt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                        {!movie.isActive && (
                          <span className="ml-2 text-[10px] text-red-400 font-bold">Đã ẩn</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(movie)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-semibold"
                    >
                      Sửa
                    </button>
                    {movie.isActive ? (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDialog({
                            isOpen: true,
                            movie,
                            action: 'hide',
                            loading: false,
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-red-950/40 text-red-400 border border-red-800/40 text-xs font-bold"
                      >
                        Xóa (Ẩn)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDialog({
                            isOpen: true,
                            movie,
                            action: 'restore',
                            loading: false,
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 text-xs font-bold"
                      >
                        Hiện lại
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="p-4 bg-[#141416]">
            <AdminPagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA PHIM */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMovie ? `Sửa phim: ${editingMovie.title}` : 'Thêm phim mới'}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Tên phim */}
          <AdminFormField id="movie-title" label="Tên phim" required error={formErrors.title}>
            <input
              id="movie-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="VD: Hành Trình Về Phía Biển"
              maxLength={255}
              aria-invalid={!!formErrors.title}
              aria-describedby={formErrors.title ? 'movie-title-error' : undefined}
              className={`w-full bg-[#121214] border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition ${
                formErrors.title ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-700 focus:border-[#e50914]'
              }`}
            />
          </AdminFormField>

          {/* Hàng 2: Thời lượng, Thể loại & Độ tuổi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <AdminFormField id="movie-duration" label="Thời lượng (phút)" required error={formErrors.duration}>
              <input
                id="movie-duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className={`w-full bg-[#121214] border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition ${
                  formErrors.duration ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-700 focus:border-[#e50914]'
                }`}
              />
            </AdminFormField>

            <AdminFormField id="movie-genre" label="Thể loại" error={formErrors.genre}>
              <input
                id="movie-genre"
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                placeholder="VD: Hành động, Viễn tưởng"
                maxLength={100}
                className="w-full bg-[#121214] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#e50914] transition"
              />
            </AdminFormField>

            <AdminFormField id="movie-ageLimit" label="Nhãn độ tuổi" required>
              <select
                id="movie-ageLimit"
                value={formData.ageLimit}
                onChange={(e) => setFormData({ ...formData, ageLimit: e.target.value })}
                className="w-full bg-[#121214] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#e50914] transition"
              >
                <option value="P">P (Phổ thông)</option>
                <option value="T13">T13 (Trên 13 tuổi)</option>
                <option value="T16">T16 (Trên 16 tuổi)</option>
                <option value="T18">T18 (Trên 18 tuổi)</option>
              </select>
            </AdminFormField>
          </div>

          {/* Hàng 3: Ngày khởi chiếu & Trạng thái chiếu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminFormField id="movie-releaseDate" label="Ngày khởi chiếu">
              <input
                id="movie-releaseDate"
                type="date"
                value={formData.releaseDate}
                onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                className="w-full bg-[#121214] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#e50914] transition"
              />
            </AdminFormField>

            <AdminFormField id="movie-status" label="Trạng thái chiếu" required>
              <select
                id="movie-status"
                value={formData.movieStatus}
                onChange={(e) => setFormData({ ...formData, movieStatus: e.target.value })}
                className="w-full bg-[#121214] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#e50914] transition"
              >
                <option value="NOW_SHOWING">Đang chiếu (NOW_SHOWING)</option>
                <option value="COMING_SOON">Sắp chiếu (COMING_SOON)</option>
                <option value="ENDED">Ngừng chiếu (ENDED)</option>
              </select>
            </AdminFormField>
          </div>

          {/* Mô tả phim */}
          <AdminFormField id="movie-description" label="Tóm tắt / Mô tả nội dung">
            <textarea
              id="movie-description"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Nhập nội dung tóm tắt phim..."
              className="w-full bg-[#121214] border border-zinc-700 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#e50914] transition custom-scrollbar"
            />
          </AdminFormField>

          {/* Đường dẫn Poster & Xem trước ảnh */}
          <AdminFormField
            id="movie-posterUrl"
            label="Đường dẫn ảnh Poster"
            hint="Bắt đầu bằng http://, https:// hoặc đường dẫn nội bộ /"
            error={formErrors.posterUrl}
          >
            <input
              id="movie-posterUrl"
              type="text"
              value={formData.posterUrl}
              onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
              placeholder="https://example.com/poster.jpg hoặc /src/assets/..."
              className={`w-full bg-[#121214] border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition ${
                formErrors.posterUrl ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-700 focus:border-[#e50914]'
              }`}
            />
          </AdminFormField>

          {/* Xem trước ảnh Poster nếu có */}
          {formData.posterUrl && !formErrors.posterUrl && (
            <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-xl border border-zinc-800">
              <img
                src={formData.posterUrl}
                alt="Xem trước poster"
                className="w-14 h-20 object-cover rounded-md border border-zinc-700 bg-zinc-950"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <span className="text-xs text-zinc-400">Xem trước ảnh poster phim</span>
            </div>
          )}

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs sm:text-sm transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 bg-[#e50914] hover:bg-[#b80710] text-white font-bold px-6 py-2.5 rounded-xl transition shadow-lg shadow-red-950/40 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editingMovie ? 'Cập nhật phim' : 'Lưu phim mới'}</span>
            </button>
          </div>
        </form>
      </AdminModal>

      {/* DIALOG XÁC NHẬN ẨN HOẶC HIỆN LẠI */}
      <AdminConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={handleConfirmAction}
        loading={confirmDialog.loading}
        title={confirmDialog.action === 'hide' ? 'Ẩn phim khỏi website?' : 'Hiện lại phim trên website?'}
        message={
          confirmDialog.action === 'hide'
            ? `Bạn có chắc chắn muốn ẩn phim "${confirmDialog.movie?.title}"?\n\nPhim sẽ bị ẩn khỏi website, nhưng toàn bộ dữ liệu lịch sử đặt vé và suất chiếu vẫn được giữ lại theo quy tắc BR-MOV-03.`
            : `Bạn có muốn hiện lại phim "${confirmDialog.movie?.title}" trên trang web để mở bán vé trở lại?`
        }
        confirmText={confirmDialog.action === 'hide' ? 'Ẩn phim' : 'Hiện lại'}
        isDanger={confirmDialog.action === 'hide'}
      />
    </div>
  );
};

export default AdminMovies;

