import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Newspaper,
  Tag,
  Edit,
  Trash2,
  Power,
  RotateCcw,
  Calendar,
  Loader2,
  Percent,
  DollarSign,
  AlertTriangle,
  FileText
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
  validateImageUrl
} from '../../utils/validators';

const formatVND = (num) => `${Number(num || 0).toLocaleString('vi-VN')} đ`;

const formatDate = (isoString) => {
  if (!isoString) return '--/--/----';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const INITIAL_NEWS_FORM = {
  title: '',
  content: '',
  img: '',
};

const INITIAL_PROMO_FORM = {
  code: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: '',
  minOrderValue: '0',
  expiryDate: '',
  isActive: true,
};

const AdminNewsPromotions = () => {
  const { showToast } = useAdminToast();

  // Tab con: 'news' hoặc 'promotions'
  const [activeSubTab, setActiveSubTab] = useState('news');

  /* =========================================================================
   * PHẦN 1: TIN TỨC (News)
   * ========================================================================= */
  const [newsList, setNewsList] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsKeyword, setNewsKeyword] = useState('');
  const [debouncedNewsKw, setDebouncedNewsKw] = useState('');
  const [newsPage, setNewsPage] = useState(0);
  const [newsPagination, setNewsPagination] = useState({ totalPages: 1, totalElements: 0, size: 10 });

  const newsTimerRef = useRef(null);
  const handleNewsKeywordChange = (e) => {
    const val = e.target.value;
    setNewsKeyword(val);
    if (newsTimerRef.current) clearTimeout(newsTimerRef.current);
    newsTimerRef.current = setTimeout(() => {
      setDebouncedNewsKw(val);
      setNewsPage(0);
    }, 300);
  };

  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const res = await adminApi.listNews({
        keyword: debouncedNewsKw,
        page: newsPage,
        size: 10,
      });
      setNewsList(res.content || []);
      setNewsPagination({
        totalPages: res.totalPages || 1,
        totalElements: res.totalElements || 0,
        size: res.size || 10,
      });
    } catch (err) {
      console.error('Lỗi tải tin tức:', err);
      showToast('error', 'Không thể tải danh sách tin tức');
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'news') {
      fetchNews();
    }
  }, [debouncedNewsKw, newsPage, activeSubTab]);

  // Modal Thêm/Sửa Tin tức
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [newsForm, setNewsForm] = useState(INITIAL_NEWS_FORM);
  const [newsFormErrors, setNewsFormErrors] = useState({});
  const [newsSubmitting, setNewsSubmitting] = useState(false);

  // Xóa tin tức (XÓA THẬT theo BR-NEWS-01)
  const [deleteNewsTarget, setDeleteNewsTarget] = useState(null);
  const [deleteNewsLoading, setDeleteNewsLoading] = useState(false);

  const handleOpenAddNews = () => {
    setEditingNews(null);
    setNewsForm(INITIAL_NEWS_FORM);
    setNewsFormErrors({});
    setIsNewsModalOpen(true);
  };

  const handleOpenEditNews = (item) => {
    setEditingNews(item);
    setNewsForm({
      title: item.title,
      content: item.content,
      img: item.img || '',
    });
    setNewsFormErrors({});
    setIsNewsModalOpen(true);
  };

  const handleSubmitNews = async (e) => {
    e.preventDefault();
    const errors = {};

    const titleErr =
      validateRequired(newsForm.title, 'Vui lòng nhập tiêu đề bài viết') ||
      validateMaxLength(newsForm.title, 255, 'Tiêu đề tối đa 255 ký tự');
    if (titleErr) errors.title = titleErr;

    const contentErr = validateRequired(newsForm.content, 'Vui lòng nhập nội dung bài viết');
    if (contentErr) errors.content = contentErr;

    if (newsForm.img && newsForm.img.trim()) {
      const imgErr = validateImageUrl(newsForm.img.trim());
      if (imgErr) errors.img = imgErr;
    }

    if (Object.keys(errors).length > 0) {
      setNewsFormErrors(errors);
      return;
    }

    setNewsSubmitting(true);
    setNewsFormErrors({});

    try {
      const payload = {
        title: newsForm.title.trim(),
        content: newsForm.content.trim(),
        img: newsForm.img ? newsForm.img.trim() : '',
      };

      if (editingNews) {
        await adminApi.updateNews(editingNews.newsId, payload);
        showToast('success', 'Cập nhật bài viết thành công');
      } else {
        await adminApi.createNews(payload);
        showToast('success', 'Đăng bài viết mới thành công');
      }

      setIsNewsModalOpen(false);
      fetchNews();
    } catch (err) {
      console.error('Lỗi lưu tin tức:', err);
      showToast('error', err.message || 'Có lỗi xảy ra khi lưu tin tức');
    } finally {
      setNewsSubmitting(false);
    }
  };

  const handleConfirmDeleteNews = async () => {
    if (!deleteNewsTarget) return;
    setDeleteNewsLoading(true);
    try {
      await adminApi.deleteNews(deleteNewsTarget.newsId);
      showToast('success', `Đã xóa bài viết "${deleteNewsTarget.title}" (BR-NEWS-01)`);
      setDeleteNewsTarget(null);
      fetchNews();
    } catch (err) {
      console.error('Lỗi xóa bài viết:', err);
      showToast('error', err.message || 'Không thể xóa bài viết');
    } finally {
      setDeleteNewsLoading(false);
    }
  };

  /* =========================================================================
   * PHẦN 2: KHUYẾN MÃI (Promotions)
   * ========================================================================= */
  const [promos, setPromos] = useState([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoKeyword, setPromoKeyword] = useState('');
  const [debouncedPromoKw, setDebouncedPromoKw] = useState('');
  const [includeInactivePromo, setIncludeInactivePromo] = useState(true);

  const promoTimerRef = useRef(null);
  const handlePromoKeywordChange = (e) => {
    const val = e.target.value.toUpperCase();
    setPromoKeyword(val);
    if (promoTimerRef.current) clearTimeout(promoTimerRef.current);
    promoTimerRef.current = setTimeout(() => {
      setDebouncedPromoKw(val);
    }, 300);
  };

  const fetchPromos = async () => {
    setPromoLoading(true);
    try {
      const data = await adminApi.listPromotions({
        keyword: debouncedPromoKw,
        includeInactive: includeInactivePromo,
      });
      setPromos(data);
    } catch (err) {
      console.error('Lỗi tải khuyến mãi:', err);
      showToast('error', 'Không thể tải danh sách khuyến mãi');
    } finally {
      setPromoLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'promotions') {
      fetchPromos();
    }
  }, [debouncedPromoKw, includeInactivePromo, activeSubTab]);

  // Modal Thêm/Sửa Khuyến mãi
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [promoForm, setPromoForm] = useState(INITIAL_PROMO_FORM);
  const [promoFormErrors, setPromoFormErrors] = useState({});
  const [promoSubmitting, setPromoSubmitting] = useState(false);

  // Toggle Ngừng / Kích hoạt lại
  const [togglePromoTarget, setTogglePromoTarget] = useState(null);
  const [togglePromoLoading, setTogglePromoLoading] = useState(false);

  const handleOpenAddPromo = () => {
    setEditingPromo(null);
    setPromoForm(INITIAL_PROMO_FORM);
    setPromoFormErrors({});
    setIsPromoModalOpen(true);
  };

  const handleOpenEditPromo = (item) => {
    setEditingPromo(item);
    setPromoForm({
      code: item.code,
      description: item.description || '',
      discountType: item.discountType,
      discountValue: String(item.discountValue),
      minOrderValue: String(item.minOrderValue || 0),
      expiryDate: item.expiryDate || '',
      isActive: item.isActive,
    });
    setPromoFormErrors({});
    setIsPromoModalOpen(true);
  };

  const handleSubmitPromo = async (e) => {
    e.preventDefault();
    const errors = {};

    const cleanCode = (promoForm.code || '').trim().toUpperCase();
    if (!cleanCode) {
      errors.code = 'Mã khuyến mãi không được để trống';
    } else if (cleanCode.length > 20) {
      errors.code = 'Mã không được vượt quá 20 ký tự';
    } else if (!/^[A-Z0-9_-]+$/.test(cleanCode)) {
      errors.code = 'Mã chỉ được chứa chữ hoa không dấu, số, gạch nối (-) hoặc (_)';
    }

    const valNum = Number(promoForm.discountValue);
    if (!promoForm.discountValue || isNaN(valNum) || valNum <= 0) {
      errors.discountValue = 'Giá trị giảm phải là số dương';
    } else if (promoForm.discountType === 'PERCENT' && valNum > 100) {
      errors.discountValue = 'Tỷ lệ giảm theo phần trăm không được vượt quá 100%';
    }

    const minOrderNum = Number(promoForm.minOrderValue);
    if (isNaN(minOrderNum) || minOrderNum < 0) {
      errors.minOrderValue = 'Giá trị đơn tối thiểu không hợp lệ';
    }

    if (!promoForm.expiryDate) {
      errors.expiryDate = 'Vui lòng chọn ngày hết hạn';
    }

    if (Object.keys(errors).length > 0) {
      setPromoFormErrors(errors);
      return;
    }

    setPromoSubmitting(true);
    setPromoFormErrors({});

    try {
      const payload = {
        code: cleanCode,
        description: promoForm.description.trim(),
        discountType: promoForm.discountType,
        discountValue: Number(promoForm.discountValue),
        minOrderValue: Number(promoForm.minOrderValue) || 0,
        expiryDate: promoForm.expiryDate,
        isActive: promoForm.isActive,
      };

      if (editingPromo) {
        await adminApi.updatePromotion(editingPromo.promoId, payload);
        showToast('success', `Cập nhật mã "${payload.code}" thành công`);
      } else {
        await adminApi.createPromotion(payload);
        showToast('success', `Tạo mã khuyến mãi "${payload.code}" thành công`);
      }

      setIsPromoModalOpen(false);
      fetchPromos();
    } catch (err) {
      console.error('Lỗi lưu mã khuyến mãi:', err);
      if (err.code === 'PROMO_EXISTS') {
        setPromoFormErrors({ code: err.message });
      } else {
        setPromoFormErrors({ general: err.message || 'Có lỗi xảy ra' });
      }
      showToast('error', err.message || 'Có lỗi xảy ra khi lưu mã khuyến mãi');
    } finally {
      setPromoSubmitting(false);
    }
  };

  const handleConfirmTogglePromo = async () => {
    if (!togglePromoTarget) return;
    setTogglePromoLoading(true);
    try {
      const nextState = !togglePromoTarget.isActive;
      await adminApi.setPromotionActive(togglePromoTarget.promoId, nextState);
      showToast(
        'success',
        nextState
          ? `Đã kích hoạt lại mã "${togglePromoTarget.code}"`
          : `Đã ngừng áp dụng mã "${togglePromoTarget.code}" (BR-PROMO-05)`
      );
      setTogglePromoTarget(null);
      fetchPromos();
    } catch (err) {
      console.error('Lỗi đổi trạng thái khuyến mãi:', err);
      showToast('error', err.message || 'Không thể đổi trạng thái khuyến mãi');
    } finally {
      setTogglePromoLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header và chuyển đổi Sub-tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-rose-500" />
            Tin tức & Ưu đãi
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Quản lý bài viết truyền thông và các chương trình mã giảm giá (BR-NEWS-01, BR-PROMO-01 đến 05)
          </p>
        </div>

        {/* Nút thêm mới tùy thuộc vào sub-tab đang chọn */}
        {activeSubTab === 'news' ? (
          <button
            onClick={handleOpenAddNews}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-lg shadow-rose-950/50 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Viết bài mới</span>
          </button>
        ) : (
          <button
            onClick={handleOpenAddPromo}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-lg shadow-rose-950/50 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo mã ưu đãi</span>
          </button>
        )}
      </div>

      {/* Tabs chuyển đổi Sub-tab */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveSubTab('news')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === 'news'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Tin tức & Sự kiện</span>
        </button>

        <button
          onClick={() => setActiveSubTab('promotions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === 'promotions'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Mã khuyến mãi & Ưu đãi</span>
        </button>
      </div>

      {/* ==================== NỘI DUNG SUB-TAB 1: TIN TỨC ==================== */}
      {activeSubTab === 'news' && (
        <div className="space-y-4">
          {/* Ô tìm kiếm tin tức */}
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={newsKeyword}
                onChange={handleNewsKeywordChange}
                placeholder="Tìm bài viết theo tiêu đề, nội dung..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-800/80 border border-zinc-700/80 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          {/* Danh sách bài viết */}
          {newsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500 mb-2" />
              <p className="text-sm">Đang tải danh sách bài viết...</p>
            </div>
          ) : newsList.length === 0 ? (
            <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl p-12 text-center">
              <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-medium text-zinc-300">Không tìm thấy bài viết nào</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Hãy thử tìm kiếm với từ khóa khác hoặc bấm &quot;Viết bài mới&quot; để tạo bài viết.
              </p>
            </div>
          ) : (
            <>
              {/* Bảng Desktop */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="bg-zinc-800/60 text-xs uppercase font-semibold text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="px-4 py-3.5">Mã</th>
                      <th className="px-4 py-3.5">Hình ảnh</th>
                      <th className="px-4 py-3.5">Tiêu đề bài viết</th>
                      <th className="px-4 py-3.5">Nội dung tóm tắt</th>
                      <th className="px-4 py-3.5">Ngày đăng</th>
                      <th className="px-4 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {newsList.map((item) => (
                      <tr key={item.newsId} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                          #{item.newsId}
                        </td>

                        <td className="px-4 py-3">
                          <div className="w-14 h-10 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700/60 flex items-center justify-center flex-shrink-0">
                            {item.img ? (
                              <img
                                src={item.img}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <Newspaper className="w-4 h-4 text-zinc-600" />
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 font-medium text-white max-w-xs">
                          <div className="truncate" title={item.title}>
                            {item.title}
                          </div>
                        </td>

                        {/* Văn bản thuần túy, an toàn XSS */}
                        <td className="px-4 py-3 text-zinc-400 text-xs max-w-sm">
                          <p className="line-clamp-2">{item.content}</p>
                        </td>

                        <td className="px-4 py-3 text-zinc-400 text-xs">
                          {formatDate(item.createdAt)}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditNews(item)}
                              title="Sửa bài viết"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* XÓA THẬT (BR-NEWS-01) */}
                            <button
                              onClick={() => setDeleteNewsTarget(item)}
                              title="Xóa vĩnh viễn (BR-NEWS-01)"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Dạng thẻ Mobile */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {newsList.map((item) => (
                  <div
                    key={item.newsId}
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-14 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700/60 flex items-center justify-center flex-shrink-0">
                        {item.img ? (
                          <img
                            src={item.img}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Newspaper className="w-5 h-5 text-zinc-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white text-sm line-clamp-2">{item.title}</h4>
                        <span className="text-[11px] text-zinc-500 mt-1 block">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-3">{item.content}</p>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/60">
                      <button
                        onClick={() => handleOpenEditNews(item)}
                        className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 text-xs flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Sửa</span>
                      </button>

                      <button
                        onClick={() => setDeleteNewsTarget(item)}
                        className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Phân trang */}
              <AdminPagination
                page={newsPage}
                totalPages={newsPagination.totalPages}
                totalElements={newsPagination.totalElements}
                size={newsPagination.size}
                onPageChange={(p) => setNewsPage(p)}
              />
            </>
          )}
        </div>
      )}

      {/* ==================== NỘI DUNG SUB-TAB 2: KHUYẾN MÃI ==================== */}
      {activeSubTab === 'promotions' && (
        <div className="space-y-4">
          {/* Ô tìm kiếm mã & checkbox ẩn */}
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={promoKeyword}
                onChange={handlePromoKeywordChange}
                placeholder="Tìm theo mã ưu đãi (VD: AKASHI20)..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-800/80 border border-zinc-700/80 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors uppercase font-mono"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-zinc-400 select-none cursor-pointer hover:text-zinc-200 transition-colors">
              <input
                type="checkbox"
                checked={includeInactivePromo}
                onChange={(e) => setIncludeInactivePromo(e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-rose-600 focus:ring-rose-500"
              />
              <span>Bao gồm mã đã ngừng hoạt động</span>
            </label>
          </div>

          {/* Danh sách khuyến mãi */}
          {promoLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500 mb-2" />
              <p className="text-sm">Đang tải danh sách mã ưu đãi...</p>
            </div>
          ) : promos.length === 0 ? (
            <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl p-12 text-center">
              <Tag className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-medium text-zinc-300">Không tìm thấy mã ưu đãi nào</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Hãy thử tìm mã khác hoặc bấm &quot;Tạo mã ưu đãi&quot; để thiết lập chương trình giảm giá mới.
              </p>
            </div>
          ) : (
            <>
              {/* Bảng Desktop */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="bg-zinc-800/60 text-xs uppercase font-semibold text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="px-4 py-3.5">Mã ưu đãi</th>
                      <th className="px-4 py-3.5">Mô tả chương trình</th>
                      <th className="px-4 py-3.5">Mức giảm giá</th>
                      <th className="px-4 py-3.5">Đơn tối thiểu</th>
                      <th className="px-4 py-3.5">Hạn sử dụng</th>
                      <th className="px-4 py-3.5 text-center">Trạng thái</th>
                      <th className="px-4 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {promos.map((item) => {
                      const isExpired = new Date(item.expiryDate).getTime() < Date.now();
                      const isStopped = !item.isActive;

                      return (
                        <tr
                          key={item.promoId}
                          className={`hover:bg-zinc-800/30 transition-colors ${
                            isStopped ? 'opacity-50 bg-zinc-950/40' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-rose-400 text-sm tracking-wide bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                              {item.code}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-zinc-200 max-w-xs">
                            <div className="truncate" title={item.description}>
                              {item.description || 'Không có mô tả'}
                            </div>
                          </td>

                          <td className="px-4 py-3 font-semibold text-white">
                            {item.discountType === 'PERCENT' ? (
                              <span className="text-amber-400 font-mono">
                                Giảm {item.discountValue}%
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-mono">
                                Giảm {formatVND(item.discountValue)}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-zinc-400 text-xs font-mono">
                            {formatVND(item.minOrderValue)}
                          </td>

                          <td className="px-4 py-3 text-xs">
                            <div className={`${isExpired ? 'text-rose-400 font-medium' : 'text-zinc-300'}`}>
                              {formatDate(item.expiryDate)}
                            </div>
                            {isExpired && (
                              <span className="text-[10px] text-rose-400">Đã hết hạn</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center">
                            {item.isActive ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Đang mở
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                                Đã ngừng
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditPromo(item)}
                                title="Sửa mã khuyến mãi"
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {item.isActive ? (
                                <button
                                  onClick={() => setTogglePromoTarget(item)}
                                  title="Ngừng áp dụng mã (BR-PROMO-05)"
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setTogglePromoTarget(item)}
                                  title="Kích hoạt lại mã"
                                  className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Dạng thẻ Mobile */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {promos.map((item) => {
                  const isExpired = new Date(item.expiryDate).getTime() < Date.now();
                  const isStopped = !item.isActive;

                  return (
                    <div
                      key={item.promoId}
                      className={`p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-2.5 ${
                        isStopped ? 'opacity-60 bg-zinc-950/40' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-rose-400 text-sm tracking-wide bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                          {item.code}
                        </span>
                        {item.isActive ? (
                          <span className="text-[11px] text-emerald-400">Đang mở</span>
                        ) : (
                          <span className="text-[11px] text-zinc-500">Đã ngừng</span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-300">{item.description}</p>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/60">
                        <span className="text-zinc-400">
                          Mức giảm:{' '}
                          <strong className="text-white">
                            {item.discountType === 'PERCENT'
                              ? `${item.discountValue}%`
                              : formatVND(item.discountValue)}
                          </strong>
                        </span>
                        <span className={isExpired ? 'text-rose-400' : 'text-zinc-400'}>
                          Hạn: {formatDate(item.expiryDate)}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/60">
                        <button
                          onClick={() => handleOpenEditPromo(item)}
                          className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 text-xs flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Sửa</span>
                        </button>

                        {item.isActive ? (
                          <button
                            onClick={() => setTogglePromoTarget(item)}
                            className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 text-xs flex items-center gap-1"
                          >
                            <Power className="w-3 h-3" />
                            <span>Ngừng</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setTogglePromoTarget(item)}
                            className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Kích hoạt</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ==================== MODAL THÊM / SỬA TIN TỨC ==================== */}
      <AdminModal
        isOpen={isNewsModalOpen}
        onClose={() => setIsNewsModalOpen(false)}
        title={editingNews ? 'Sửa bài viết tin tức' : 'Viết bài viết mới'}
        description="Soạn thảo thông tin bài viết truyền thông hoặc sự kiện rạp chiếu."
        size="lg"
      >
        <form onSubmit={handleSubmitNews} className="space-y-4">
          <AdminFormField label="Tiêu đề bài viết" required error={newsFormErrors.title}>
            <input
              type="text"
              maxLength={255}
              value={newsForm.title}
              onChange={(e) => {
                setNewsForm((prev) => ({ ...prev, title: e.target.value }));
                if (newsFormErrors.title) setNewsFormErrors((prev) => ({ ...prev, title: '' }));
              }}
              placeholder="VD: Khai trương phòng chiếu IMAX đỉnh cao tại Akashi"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-rose-500"
            />
          </AdminFormField>

          <AdminFormField
            label="Đường dẫn ảnh minh họa"
            error={newsFormErrors.img}
            helperText="Đường dẫn bắt đầu bằng http://, https:// hoặc /"
          >
            <input
              type="text"
              value={newsForm.img}
              onChange={(e) => {
                setNewsForm((prev) => ({ ...prev, img: e.target.value }));
                if (newsFormErrors.img) setNewsFormErrors((prev) => ({ ...prev, img: '' }));
              }}
              placeholder="https://images.unsplash.com/... hoặc /images/..."
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-rose-500"
            />
          </AdminFormField>

          {/* Xem trước ảnh */}
          {newsForm.img && !newsFormErrors.img && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
              <div className="w-20 h-14 rounded overflow-hidden bg-zinc-900 flex-shrink-0 flex items-center justify-center">
                <img
                  src={newsForm.img}
                  alt="Xem trước ảnh bài viết"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <div className="text-xs text-zinc-400">
                <p className="font-medium text-zinc-200">Xem trước ảnh bài viết</p>
                <p className="text-[11px] truncate max-w-sm">{newsForm.img}</p>
              </div>
            </div>
          )}

          <AdminFormField
            label="Nội dung bài viết"
            required
            error={newsFormErrors.content}
            helperText="Nội dung văn bản thuần túy, an toàn bảo mật (không dùng mã HTML nguy hiểm)"
          >
            <textarea
              rows={6}
              value={newsForm.content}
              onChange={(e) => {
                setNewsForm((prev) => ({ ...prev, content: e.target.value }));
                if (newsFormErrors.content) setNewsFormErrors((prev) => ({ ...prev, content: '' }));
              }}
              placeholder="Nhập nội dung chi tiết bài viết tại đây..."
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-rose-500 resize-y"
            />
          </AdminFormField>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsNewsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={newsSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm transition-all disabled:opacity-50"
            >
              {newsSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editingNews ? 'Lưu bài viết' : 'Đăng bài viết'}</span>
            </button>
          </div>
        </form>
      </AdminModal>

      {/* ==================== MODAL THÊM / SỬA KHUYẾN MÃI ==================== */}
      <AdminModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        title={editingPromo ? 'Sửa mã ưu đãi' : 'Tạo mã ưu đãi mới'}
        description="Thiết lập mã giảm giá theo tỷ lệ phần trăm hoặc số tiền VNĐ cố định (BR-PROMO-01 đến 05)."
        size="md"
      >
        <form onSubmit={handleSubmitPromo} className="space-y-4">
          {promoFormErrors.general && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{promoFormErrors.general}</span>
            </div>
          )}

          {/* Mã code */}
          <AdminFormField
            label="Mã khuyến mãi (Viết hoa, không dấu)"
            required
            error={promoFormErrors.code}
            helperText="Tối đa 20 ký tự (VD: AKASHI50, SUMMER2026)"
          >
            <input
              type="text"
              maxLength={20}
              value={promoForm.code}
              onChange={(e) => {
                const upper = e.target.value.toUpperCase();
                setPromoForm((prev) => ({ ...prev, code: upper }));
                if (promoFormErrors.code) setPromoFormErrors((prev) => ({ ...prev, code: '' }));
              }}
              placeholder="VD: AKASHI20"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 font-mono uppercase focus:outline-none focus:border-rose-500"
            />
          </AdminFormField>

          {/* Mô tả */}
          <AdminFormField label="Mô tả ưu đãi" helperText="Tóm tắt quyền lợi khách nhận được">
            <input
              type="text"
              maxLength={255}
              value={promoForm.description}
              onChange={(e) => setPromoForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="VD: Giảm ngay 20.000đ cho đơn từ 100k"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-rose-500"
            />
          </AdminFormField>

          {/* Loại giảm giá */}
          <AdminFormField label="Hình thức giảm giá" required>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPromoForm((prev) => ({ ...prev, discountType: 'PERCENT' }))}
                className={`py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                  promoForm.discountType === 'PERCENT'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                    : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:bg-zinc-700/50'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Theo phần trăm (%)</span>
              </button>

              <button
                type="button"
                onClick={() => setPromoForm((prev) => ({ ...prev, discountType: 'FIXED' }))}
                className={`py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                  promoForm.discountType === 'FIXED'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                    : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:bg-zinc-700/50'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Số tiền cố định (VNĐ)</span>
              </button>
            </div>
          </AdminFormField>

          {/* Giá trị giảm */}
          <AdminFormField
            label={promoForm.discountType === 'PERCENT' ? 'Tỷ lệ giảm (%)' : 'Số tiền giảm (VNĐ)'}
            required
            error={promoFormErrors.discountValue}
            helperText={
              promoForm.discountType === 'PERCENT'
                ? 'Nhập từ 1 đến 100 (VD: 20 là giảm 20%)'
                : 'Nhập số tiền VNĐ (VD: 30000)'
            }
          >
            <input
              type="number"
              min="1"
              max={promoForm.discountType === 'PERCENT' ? 100 : undefined}
              value={promoForm.discountValue}
              onChange={(e) => {
                setPromoForm((prev) => ({ ...prev, discountValue: e.target.value }));
                if (promoFormErrors.discountValue) {
                  setPromoFormErrors((prev) => ({ ...prev, discountValue: '' }));
                }
              }}
              placeholder={promoForm.discountType === 'PERCENT' ? '20' : '30000'}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-rose-500 font-mono"
            />
          </AdminFormField>

          {/* Đơn hàng tối thiểu */}
          <AdminFormField
            label="Giá trị đơn hàng tối thiểu (VNĐ)"
            error={promoFormErrors.minOrderValue}
            helperText="Nhập 0 nếu không yêu cầu mức tối thiểu"
          >
            <input
              type="number"
              min="0"
              step="10000"
              value={promoForm.minOrderValue}
              onChange={(e) => {
                setPromoForm((prev) => ({ ...prev, minOrderValue: e.target.value }));
                if (promoFormErrors.minOrderValue) {
                  setPromoFormErrors((prev) => ({ ...prev, minOrderValue: '' }));
                }
              }}
              placeholder="100000"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-rose-500 font-mono"
            />
          </AdminFormField>

          {/* Ngày hết hạn */}
          <AdminFormField
            label="Ngày hết hạn"
            required
            error={promoFormErrors.expiryDate}
          >
            <input
              type="date"
              value={promoForm.expiryDate}
              onChange={(e) => {
                setPromoForm((prev) => ({ ...prev, expiryDate: e.target.value }));
                if (promoFormErrors.expiryDate) {
                  setPromoFormErrors((prev) => ({ ...prev, expiryDate: '' }));
                }
              }}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-rose-500"
            />
          </AdminFormField>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsPromoModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={promoSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm transition-all disabled:opacity-50"
            >
              {promoSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editingPromo ? 'Lưu thay đổi' : 'Tạo mã ưu đãi'}</span>
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Confirm XÓA THẬT Tin tức (BR-NEWS-01) */}
      <AdminConfirmDialog
        isOpen={Boolean(deleteNewsTarget)}
        title="Xóa vĩnh viễn bài viết"
        message={
          deleteNewsTarget
            ? `Bài viết "${deleteNewsTarget.title}" sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu và không thể khôi phục lại (BR-NEWS-01). Bạn có chắc chắn?`
            : ''
        }
        confirmText="Xóa bài viết"
        cancelText="Hủy"
        danger
        loading={deleteNewsLoading}
        onConfirm={handleConfirmDeleteNews}
        onCancel={() => setDeleteNewsTarget(null)}
      />

      {/* Confirm Ngừng / Kích hoạt lại Khuyến mãi (BR-PROMO-05) */}
      <AdminConfirmDialog
        isOpen={Boolean(togglePromoTarget)}
        title={togglePromoTarget?.isActive ? 'Ngừng áp dụng mã ưu đãi' : 'Kích hoạt lại mã ưu đãi'}
        message={
          togglePromoTarget
            ? togglePromoTarget.isActive
              ? `Mã ưu đãi "${togglePromoTarget.code}" sẽ không thể áp dụng cho các đơn đặt vé mới nữa (BR-PROMO-05). Bạn có chắc chắn?`
              : `Mã ưu đãi "${togglePromoTarget.code}" sẽ có thể sử dụng lại cho khách hàng đặt vé.`
            : ''
        }
        confirmText={togglePromoTarget?.isActive ? 'Ngừng mã' : 'Kích hoạt lại'}
        cancelText="Hủy"
        danger={togglePromoTarget?.isActive}
        loading={togglePromoLoading}
        onConfirm={handleConfirmTogglePromo}
        onCancel={() => setTogglePromoTarget(null)}
      />
    </div>
  );
};

export default AdminNewsPromotions;
