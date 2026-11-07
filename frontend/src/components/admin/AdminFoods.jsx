import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  UtensilsCrossed,
  Edit,
  Power,
  RotateCcw,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import adminApi from '../../api/adminApi';
import { useAdminToast } from './AdminLayout';
import AdminModal from './AdminModal';
import AdminConfirmDialog from './AdminConfirmDialog';
import AdminFormField from './AdminFormField';
import {
  validateRequired,
  validateMaxLength,
  validatePositiveInteger,
  validateImageUrl
} from '../../utils/validators';

const CATEGORY_MAP = {
  POPCORN: { label: 'Bắp rang', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  DRINK: { label: 'Nước uống', color: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
  COMBO: { label: 'Combo ưu đãi', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
};

const formatVND = (num) => {
  return `${Number(num || 0).toLocaleString('vi-VN')} đ`;
};

const INITIAL_FORM_STATE = {
  name: '',
  price: '',
  category: 'POPCORN',
  img: '',
  isAvailable: true,
};

const AdminFoods = () => {
  const { showToast } = useAdminToast();

  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);

  // Bộ lọc
  const [category, setCategory] = useState('');
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [includeUnavailable, setIncludeUnavailable] = useState(true);

  // Debounce search 300ms
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
  const [editingFood, setEditingFood] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Confirm Ngừng bán / Bán lại
  const [toggleTarget, setToggleTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Tải danh sách món ăn
  const fetchFoods = async () => {
    setLoading(true);
    try {
      const data = await adminApi.listFoods({
        category,
        keyword: debouncedKeyword,
        includeUnavailable,
      });
      setFoods(data);
    } catch (err) {
      console.error('Lỗi tải danh sách đồ ăn:', err);
      showToast('error', 'Không thể tải danh sách đồ ăn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, [category, debouncedKeyword, includeUnavailable]);

  // Mở modal Thêm món
  const handleOpenAdd = () => {
    setEditingFood(null);
    setFormData(INITIAL_FORM_STATE);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Mở modal Sửa món
  const handleOpenEdit = (item) => {
    setEditingFood(item);
    setFormData({
      name: item.name,
      price: String(item.price),
      category: item.category,
      img: item.img || '',
      isAvailable: item.isAvailable,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Submit form Thêm / Sửa
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    const nameErr =
      validateRequired(formData.name, 'Vui lòng nhập tên món') ||
      validateMaxLength(formData.name, 100, 'Tên món tối đa 100 ký tự');
    if (nameErr) errors.name = nameErr;

    const priceErr =
      validateRequired(formData.price, 'Vui lòng nhập giá bán') ||
      validatePositiveInteger(formData.price, 'Giá bán phải là số nguyên dương');
    if (priceErr) errors.price = priceErr;

    if (formData.img && formData.img.trim()) {
      const imgErr = validateImageUrl(formData.img.trim());
      if (imgErr) errors.img = imgErr;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    setFormErrors({});

    try {
      const payload = {
        name: formData.name.trim(),
        price: Number(formData.price),
        category: formData.category,
        img: formData.img ? formData.img.trim() : '',
        isAvailable: formData.isAvailable,
      };

      if (editingFood) {
        await adminApi.updateFood(editingFood.foodId, payload);
        showToast('success', `Đã cập nhật món "${payload.name}" thành công`);
      } else {
        await adminApi.createFood(payload);
        showToast('success', `Đã thêm món "${payload.name}" vào thực đơn`);
      }

      setIsModalOpen(false);
      fetchFoods();
    } catch (err) {
      console.error('Lỗi lưu món ăn:', err);
      showToast('error', err.message || 'Có lỗi xảy ra khi lưu món ăn');
    } finally {
      setSubmitting(false);
    }
  };

  // Xác nhận Ngừng bán / Bán lại (BR-FOOD-01)
  const handleConfirmToggleAvailable = async () => {
    if (!toggleTarget) return;
    setActionLoading(true);
    try {
      const nextState = !toggleTarget.isAvailable;
      await adminApi.setFoodAvailable(toggleTarget.foodId, nextState);
      showToast(
        'success',
        nextState
          ? `Đã mở bán lại món "${toggleTarget.name}"`
          : `Đã ngừng bán món "${toggleTarget.name}" (BR-FOOD-01)`
      );
      setToggleTarget(null);
      fetchFoods();
    } catch (err) {
      console.error('Lỗi đổi trạng thái món ăn:', err);
      showToast('error', err.message || 'Không thể đổi trạng thái món ăn');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header và nút Thêm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-rose-500" />
            Quản lý Đồ ăn & Nước uống
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Quản lý thực đơn bắp nước, combo ưu đãi và giá bán (BR-FOOD-01)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-lg shadow-rose-950/50 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm món mới</span>
        </button>
      </div>

      {/* Thanh bộ lọc & tìm kiếm */}
      <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={keyword}
              onChange={handleKeywordChange}
              placeholder="Tìm theo tên món..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-800/80 border border-zinc-700/80 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          {/* Lọc danh mục */}
          <div className="w-44">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700/80 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-rose-500 transition-colors"
            >
              <option value="">Tất cả danh mục</option>
              <option value="POPCORN">Bắp rang</option>
              <option value="DRINK">Nước uống</option>
              <option value="COMBO">Combo ưu đãi</option>
            </select>
          </div>
        </div>

        {/* Checkbox hiện cả món ngừng bán */}
        <label className="flex items-center gap-2 text-xs text-zinc-400 select-none cursor-pointer hover:text-zinc-200 transition-colors self-end md:self-center">
          <input
            type="checkbox"
            checked={includeUnavailable}
            onChange={(e) => setIncludeUnavailable(e.target.checked)}
            className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-rose-600 focus:ring-rose-500"
          />
          <span>Bao gồm món đã ngừng bán</span>
        </label>
      </div>

      {/* Danh sách món ăn */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500 mb-2" />
          <p className="text-sm">Đang tải danh sách thực đơn...</p>
        </div>
      ) : foods.length === 0 ? (
        <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl p-12 text-center">
          <UtensilsCrossed className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-medium text-zinc-300">Không tìm thấy món ăn nào</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Hãy thử tìm bằng từ khóa khác hoặc bấm &quot;Thêm món mới&quot; để bổ sung vào thực đơn.
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
                  <th className="px-4 py-3.5">Tên món</th>
                  <th className="px-4 py-3.5">Danh mục</th>
                  <th className="px-4 py-3.5">Giá bán</th>
                  <th className="px-4 py-3.5 text-center">Trạng thái</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {foods.map((item) => {
                  const cat = CATEGORY_MAP[item.category] || { label: item.category, color: 'bg-zinc-800 text-zinc-400' };
                  const isStopped = !item.isAvailable;

                  return (
                    <tr
                      key={item.foodId}
                      className={`hover:bg-zinc-800/30 transition-colors ${
                        isStopped ? 'opacity-50 bg-zinc-950/40' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                        #{item.foodId}
                      </td>

                      <td className="px-4 py-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex items-center justify-center border border-zinc-700/60">
                          {item.img ? (
                            <img
                              src={item.img}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <UtensilsCrossed className="w-5 h-5 text-zinc-600" />
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-medium text-white max-w-xs">
                        <div>{item.name}</div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cat.color}`}
                        >
                          {cat.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono font-semibold text-rose-400">
                        {formatVND(item.price)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {item.isAvailable ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Đang bán
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                            Ngừng bán
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Sửa món ăn"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {item.isAvailable ? (
                            <button
                              onClick={() => setToggleTarget(item)}
                              title="Ngừng bán món này (BR-FOOD-01)"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setToggleTarget(item)}
                              title="Bán lại món này"
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
            {foods.map((item) => {
              const cat = CATEGORY_MAP[item.category] || { label: item.category, color: 'bg-zinc-800 text-zinc-400' };
              const isStopped = !item.isAvailable;

              return (
                <div
                  key={item.foodId}
                  className={`p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-start gap-3 ${
                    isStopped ? 'opacity-60 bg-zinc-950/40' : ''
                  }`}
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 border border-zinc-700/60 flex items-center justify-center">
                    {item.img ? (
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <UtensilsCrossed className="w-6 h-6 text-zinc-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-semibold text-white text-sm truncate">{item.name}</h4>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${cat.color}`}>
                        {cat.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="font-mono font-bold text-rose-400 text-sm">
                        {formatVND(item.price)}
                      </span>
                      {item.isAvailable ? (
                        <span className="text-[11px] text-emerald-400">Đang bán</span>
                      ) : (
                        <span className="text-[11px] text-zinc-500">Ngừng bán</span>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-zinc-800/60">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 text-xs flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Sửa</span>
                      </button>

                      {item.isAvailable ? (
                        <button
                          onClick={() => setToggleTarget(item)}
                          className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 text-xs flex items-center gap-1"
                        >
                          <Power className="w-3 h-3" />
                          <span>Ngừng bán</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setToggleTarget(item)}
                          className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Bán lại</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal Thêm / Sửa món ăn */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFood ? 'Sửa thông tin món' : 'Thêm món ăn / đồ uống'}
        description="Điền thông tin và giá bán món ăn. Ảnh xem trước sẽ hiển thị ngay khi nhập URL hợp lệ."
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tên món */}
          <AdminFormField label="Tên món" required error={formErrors.name}>
            <input
              type="text"
              maxLength={100}
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
                if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="VD: Bắp rang bơ phô mai lớn"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-rose-500"
            />
          </AdminFormField>

          {/* Danh mục */}
          <AdminFormField label="Danh mục" required>
            <div className="grid grid-cols-3 gap-2">
              {['POPCORN', 'DRINK', 'COMBO'].map((catKey) => {
                const isSelected = formData.category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, category: catKey }))}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                      isSelected
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                        : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:bg-zinc-700/50'
                    }`}
                  >
                    {CATEGORY_MAP[catKey].label}
                  </button>
                );
              })}
            </div>
          </AdminFormField>

          {/* Giá bán */}
          <AdminFormField
            label="Giá bán (VNĐ)"
            required
            error={formErrors.price}
            helperText="Nhập số nguyên dương (VD: 45000)"
          >
            <input
              type="number"
              min="1000"
              step="1000"
              value={formData.price}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, price: e.target.value }));
                if (formErrors.price) setFormErrors((prev) => ({ ...prev, price: '' }));
              }}
              placeholder="45000"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-rose-500"
            />
          </AdminFormField>

          {/* Đường dẫn hình ảnh */}
          <AdminFormField
            label="Đường dẫn ảnh món ăn"
            error={formErrors.img}
            helperText="Đường dẫn bắt đầu bằng http://, https:// hoặc / (TODO: tích hợp upload Cloudinary)"
          >
            <input
              type="text"
              value={formData.img}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, img: e.target.value }));
                if (formErrors.img) setFormErrors((prev) => ({ ...prev, img: '' }));
              }}
              placeholder="https://images.unsplash.com/... hoặc /images/..."
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-rose-500"
            />
          </AdminFormField>

          {/* Xem trước ảnh */}
          {formData.img && !formErrors.img && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
              <div className="w-16 h-16 rounded overflow-hidden bg-zinc-900 flex-shrink-0 flex items-center justify-center">
                <img
                  src={formData.img}
                  alt="Xem trước"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <div className="text-xs text-zinc-400">
                <p className="font-medium text-zinc-200">Xem trước ảnh</p>
                <p className="text-[11px] truncate max-w-xs">{formData.img}</p>
              </div>
            </div>
          )}

          {/* Trạng thái mở bán */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isAvailableCheckbox"
              checked={formData.isAvailable}
              onChange={(e) => setFormData((prev) => ({ ...prev, isAvailable: e.target.checked }))}
              className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-rose-600 focus:ring-rose-500"
            />
            <label
              htmlFor="isAvailableCheckbox"
              className="text-sm text-zinc-300 select-none cursor-pointer"
            >
              Mở bán ngay cho khách hàng
            </label>
          </div>

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
              <span>{editingFood ? 'Lưu thay đổi' : 'Thêm món'}</span>
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Confirm Ngừng bán / Bán lại */}
      <AdminConfirmDialog
        isOpen={Boolean(toggleTarget)}
        title={toggleTarget?.isAvailable ? 'Ngừng bán món ăn' : 'Mở bán lại món ăn'}
        message={
          toggleTarget
            ? toggleTarget.isAvailable
              ? `Món "${toggleTarget.name}" sẽ ngừng phục vụ khách hàng. Dữ liệu các đơn cũ vẫn được bảo lưu (BR-FOOD-01). Bạn có chắc chắn?`
              : `Món "${toggleTarget.name}" sẽ hiển thị lại trên thực đơn đặt vé trực tuyến.`
            : ''
        }
        confirmText={toggleTarget?.isAvailable ? 'Ngừng bán' : 'Bán lại'}
        cancelText="Hủy"
        danger={toggleTarget?.isAvailable}
        loading={actionLoading}
        onConfirm={handleConfirmToggleAvailable}
        onCancel={() => setToggleTarget(null)}
      />
    </div>
  );
};

export default AdminFoods;
