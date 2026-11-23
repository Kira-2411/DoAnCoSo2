import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UtensilsCrossed, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Sparkles,
  Ticket,
  Search,
  ArrowUpDown,
  RotateCcw,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  Lightbulb
} from 'lucide-react';

import Header from '../components/Header';
import MessengerButton from '../components/MessengerButton';
import foodApi from '../api/foodApi';
import { useBooking } from '../contexts/BookingContext';

// Import các ảnh bắp nước của Akashi
import bapImg1 from '../assets/images/AkashiBap.png';
import bapImg2 from '../assets/images/AkashiBap2.png';
import coImg from '../assets/images/AkashiCo.png';
import vuiImg from '../assets/images/AkashiVui.png';
import akashiImg from '../assets/images/Akashi.png';

// Chuẩn hóa nhóm phân loại món ăn (COMBO | BAP | NUOC | OTHER)
const getFoodCategoryGroup = (item) => {
  if (!item) return 'OTHER';
  const cat = (item.category || '').toUpperCase().trim();
  const name = (item.name || '').toLowerCase();

  if (cat === 'COMBO' || cat.includes('COMBO') || name.includes('combo')) {
    return 'COMBO';
  }
  if (cat === 'POPCORN' || cat.includes('BẮP') || cat.includes('BAP') || name.includes('bắp') || name.includes('popcorn')) {
    return 'BAP';
  }
  if (cat === 'DRINK' || cat.includes('NƯỚC') || cat.includes('NUOC') || name.includes('nước') || name.includes('drink')) {
    return 'NUOC';
  }
  return 'OTHER';
};

// Lấy hình ảnh đại diện cho món ăn
const getFoodImage = (item) => {
  if (item.img) return item.img;
  if (item.image) return item.image;
  const group = getFoodCategoryGroup(item);
  const name = (item.name || '').toLowerCase();

  if (group === 'BAP') {
    if (name.includes('phô mai')) return bapImg2;
    return bapImg1;
  }
  if (group === 'NUOC') {
    return coImg;
  }
  if (group === 'COMBO') {
    if (name.includes('1 bắp 1 nước')) return akashiImg;
    return vuiImg;
  }
  return akashiImg;
};

// Mô tả mặc định nếu database chưa có trường description
const getFoodDescription = (item) => {
  const group = getFoodCategoryGroup(item);
  const name = (item.name || '').toLowerCase();

  if (group === 'COMBO') {
    if (name.includes('2 bắp')) {
      return '2 Bắp rang giòn rụm + 2 Nước ngọt ly lớn siêu tiết kiệm cho cặp đôi & nhóm bạn.';
    }
    return 'Combo bắp nước siêu tiết kiệm kèm trải nghiệm điện ảnh trọn vẹn.';
  }
  if (group === 'BAP') {
    if (name.includes('phô mai')) return 'Bắp rang lắc bột phô mai mặn mà béo ngậy.';
    return 'Bắp rang bơ đường truyền thống giòn rụm, thơm ngậy.';
  }
  if (group === 'NUOC') {
    return 'Thức uống mát lạnh sảng khoái đánh tan cơn khát.';
  }
  return 'Món ăn kèm thơm ngon tại quầy bắp nước Akashi Cinema.';
};

const SORT_OPTIONS = [
  { value: 'DEFAULT', label: 'Sắp xếp: Mặc định' },
  { value: 'PRICE_ASC', label: 'Giá: Thấp → Cao' },
  { value: 'PRICE_DESC', label: 'Giá: Cao → Thấp' },
  { value: 'SELECTED_FIRST', label: 'Món đã chọn lên đầu' },
];

const FoodPage = () => {
  const navigate = useNavigate();
  const {
    selectedFoods,
    updateFoodQuantity,
    clearFoods
  } = useBooking();

  // Tab hiện tại: 'ALL' | 'COMBO' | 'BAP' | 'NUOC'
  const [activeTab, setActiveTab] = useState('ALL');
  // Toàn bộ danh sách món ăn từ database (giữ đầy đủ để tính giỏ hàng không bao giờ bị 0 VNĐ khi đổi tab)
  const [allFoods, setAllFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tìm kiếm & Sắp xếp
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState('DEFAULT');

  // Mở/đóng khay xem chi tiết các món đã chọn ở Floating Cart Bar
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Tải toàn bộ danh sách món ăn thật từ Backend 1 lần
  useEffect(() => {
    let isMounted = true;
    const fetchFoods = async () => {
      try {
        setLoading(true);
        const res = await foodApi.getFoods();
        if (isMounted) {
          setAllFoods(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách món ăn:', err);
        if (isMounted) {
          setAllFoods([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFoods();
    return () => {
      isMounted = false;
    };
  }, []);

  // Đếm số món theo từng tab
  const tabCounts = useMemo(() => {
    const counts = { ALL: allFoods.length, COMBO: 0, BAP: 0, NUOC: 0 };
    allFoods.forEach((f) => {
      const group = getFoodCategoryGroup(f);
      if (counts[group] !== undefined) {
        counts[group] += 1;
      }
    });
    return counts;
  }, [allFoods]);

  // Lọc và sắp xếp danh sách món ăn theo Tab + Từ khóa + Giá
  const filteredFoods = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    const filtered = allFoods.filter((item) => {
      if (activeTab !== 'ALL') {
        const group = getFoodCategoryGroup(item);
        if (group !== activeTab) return false;
      }

      if (keyword) {
        const cat = (item.category || '').toLowerCase();
        const matchName = (item.name || '').toLowerCase().includes(keyword);
        const matchCat = cat.includes(keyword);
        const matchDesc = getFoodDescription(item).toLowerCase().includes(keyword);
        if (!matchName && !matchCat && !matchDesc) return false;
      }

      return true;
    });

    const sorted = [...filtered];
    if (sortBy === 'PRICE_ASC') {
      sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'PRICE_DESC') {
      sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'SELECTED_FIRST') {
      sorted.sort((a, b) => {
        const qtyA = selectedFoods[String(a.foodId)] || 0;
        const qtyB = selectedFoods[String(b.foodId)] || 0;
        return qtyB - qtyA;
      });
    }

    return sorted;
  }, [allFoods, activeTab, searchKeyword, sortBy, selectedFoods]);

  const handleIncrease = (id) => {
    updateFoodQuantity(String(id), 1);
  };

  const handleDecrease = (id) => {
    updateFoodQuantity(String(id), -1);
  };

  // Danh sách chi tiết các món đang có trong giỏ (luôn tra trên allFoods nên chuyển tab không bao giờ mất giá)
  const cartItems = useMemo(() => {
    return Object.entries(selectedFoods)
      .map(([id, qty]) => {
        const found = allFoods.find((f) => String(f.foodId) === String(id));
        if (!found || qty <= 0) return null;
        return {
          ...found,
          qty,
          subtotal: (Number(found.price) || 0) * qty
        };
      })
      .filter(Boolean);
  }, [selectedFoods, allFoods]);

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-red-600 selection:text-white pb-36">
      {/* 1. Header dùng chung */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 min-h-[65vh]">
        
        {/* Section 1: Thanh Tab phân loại (TẤT CẢ | COMBO | BẮP RANG | THỨC UỐNG) */}
        <div className="border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-6 sm:space-x-10 overflow-x-auto no-scrollbar">
            {[
              { id: 'ALL', label: 'TẤT CẢ', count: tabCounts.ALL },
              { id: 'COMBO', label: 'COMBO', count: tabCounts.COMBO },
              { id: 'BAP', label: 'BẮP RANG', count: tabCounts.BAP },
              { id: 'NUOC', label: 'THỨC UỐNG', count: tabCounts.NUOC },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                  className={`pb-3 text-base sm:text-xl font-black uppercase tracking-wider transition-all duration-200 cursor-pointer relative whitespace-nowrap flex items-center gap-2 ${
                    isActive
                      ? 'text-[#e50914]'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span>{tab.label}</span>
                  {!loading && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-[#e50914]/20 text-[#e50914]'
                          : 'bg-zinc-800/80 text-zinc-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#e50914] rounded-full animate-in fade-in zoom-in-95 duration-200"></div>
                  )}
                </button>
              );
            })}
          </div>

          {!loading && (
            <div className="pb-2 sm:pb-3 text-xs text-zinc-400">
              Hiển thị <strong className="text-white">{filteredFoods.length}</strong> / {allFoods.length} món
            </div>
          )}
        </div>

        {/* Section 2: Banner Mẹo tiết kiệm + Thanh Tìm kiếm & Sắp xếp theo giá */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Banner Mẹo tiết kiệm */}
          <div className="lg:col-span-5 p-3.5 rounded-2xl bg-gradient-to-r from-[#2a0e14] to-[#1c1c1f] border border-red-900/40 flex items-center gap-3 shadow-lg">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 fill-amber-400/30 text-amber-400" />
            </div>
            <p className="text-xs text-zinc-300 font-medium leading-relaxed">
              <span className="font-bold text-amber-300">Mẹo nhỏ:</span> Chọn các gói{' '}
              <strong className="text-white">Combo</strong> giúp tiết kiệm đến 20% và tự động giữ nguyên khi bạn chuyển sang bước Đặt vé!
            </p>
          </div>

          {/* Ô tìm kiếm món ăn */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm món ăn, bắp phô mai, combo..."
              aria-label="Tìm kiếm bắp nước"
              className="w-full bg-[#1c1c1f] border border-zinc-800 focus:border-[#e50914] text-white placeholder-zinc-500 text-xs sm:text-sm rounded-2xl pl-10 pr-9 py-3 outline-none transition"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword('')}
                aria-label="Xóa từ khóa"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Menu Sắp xếp theo giá */}
          <div className="lg:col-span-3 relative">
            <ArrowUpDown className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sắp xếp món ăn"
              className="w-full bg-[#1c1c1f] border border-zinc-800 focus:border-[#e50914] text-zinc-200 text-xs sm:text-sm rounded-2xl pl-10 pr-4 py-3 outline-none transition cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 3: Lưới món ăn & Combo */}
        <section aria-label="Danh sách món ăn">
          {loading ? (
            /* Lưới 4 thẻ Skeleton Loading chuẩn khung ảnh 4:3 */
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6"
              aria-busy="true"
              aria-label="Đang tải danh sách món ăn"
            >
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="bg-[#1c1c1f] rounded-3xl border border-zinc-800/90 p-4 animate-pulse flex flex-col justify-between"
                >
                  <div className="aspect-[4/3] w-full bg-zinc-800/70 rounded-2xl" />
                  <div className="pt-4 space-y-3">
                    <div className="h-5 w-2/3 bg-zinc-800 rounded" />
                    <div className="h-3 w-full bg-zinc-800/70 rounded" />
                    <div className="h-5 w-1/3 bg-zinc-800 rounded" />
                    <div className="h-10 w-full bg-zinc-800 rounded-2xl mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="bg-[#1c1c1f]/80 border border-zinc-800/90 rounded-3xl p-12 text-center text-zinc-400 space-y-3">
              <UtensilsCrossed className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">
                Không tìm thấy món ăn phù hợp
              </h3>
              <p className="text-xs text-zinc-500">
                Thử đổi danh mục hoặc xóa từ khóa tìm kiếm để xem toàn bộ menu bắp nước của rạp nhé!
              </p>
              {(searchKeyword || activeTab !== 'ALL') && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('ALL');
                      setSearchKeyword('');
                      setSortBy('DEFAULT');
                    }}
                    className="inline-flex items-center gap-1.5 bg-[#e50914] hover:bg-[#b80710] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Xem tất cả món ăn</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
              {filteredFoods.map((item) => {
                const qty = selectedFoods[String(item.foodId)] || 0;
                const imageSrc = getFoodImage(item);
                const desc = getFoodDescription(item);
                const priceFormatted = (item.price || 0).toLocaleString('vi-VN') + ' VNĐ';
                const isCombo = getFoodCategoryGroup(item) === 'COMBO';

                return (
                  <div
                    key={item.foodId}
                    className={`group relative bg-[#1c1c1f] rounded-3xl border p-4 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between ${
                      qty > 0
                        ? 'border-[#e50914]/80 ring-1 ring-[#e50914]/40'
                        : 'border-zinc-800/90 hover:border-zinc-700/80'
                    }`}
                  >
                    {/* Khung hình ảnh món ăn */}
                    <div className="relative aspect-[4/3] w-full bg-[#131316] rounded-2xl overflow-hidden p-3 flex items-center justify-center border border-zinc-800/70">
                      {/* Nhãn Tiết kiệm ở góc trái trên cho các gói Combo */}
                      {isCombo && (
                        <div className="absolute top-3 left-3 z-10">
                          <span className="inline-flex items-center gap-1 bg-amber-500/90 text-zinc-950 font-black text-[10px] sm:text-xs px-2.5 py-1 rounded-full shadow-md">
                            <Sparkles className="w-3 h-3" />
                            <span>Tiết kiệm</span>
                          </span>
                        </div>
                      )}

                      {/* Huy hiệu đỏ ở góc trên bên phải */}
                      <div className="absolute top-3 right-3 z-10">
                        <span className="bg-[#e50914] text-white font-extrabold text-[11px] sm:text-xs px-3 py-1 rounded-full shadow-md">
                          {item.category || 'Món ngon'}
                        </span>
                      </div>

                      {/* Hình ảnh hoạt hình Akashi */}
                      <img
                        src={imageSrc}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md select-none"
                      />
                    </div>

                    {/* Thông tin & giá món */}
                    <div className="pt-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#e50914] transition-colors">
                          {item.name}
                        </h3>

                        <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                          {desc}
                        </p>

                        <div className="flex items-baseline justify-between mt-2">
                          <p className="text-base sm:text-lg font-black text-[#e50914]">
                            {priceFormatted}
                          </p>
                          {qty > 0 && (
                            <span className="text-xs font-bold text-emerald-400">
                              Tạm tính: {((item.price || 0) * qty).toLocaleString('vi-VN')} đ
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bộ chọn số lượng / nút mua */}
                      <div className="pt-2 flex items-center justify-between">
                        {qty > 0 ? (
                          <div className="flex items-center space-x-3 bg-zinc-900 border border-zinc-700/80 px-2.5 py-1.5 rounded-2xl w-full justify-between">
                            <button
                              onClick={() => handleDecrease(item.foodId)}
                              type="button"
                              className="w-7 h-7 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition cursor-pointer"
                              aria-label="Giảm số lượng"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <span className="text-sm font-bold text-white px-2">
                              {qty}
                            </span>

                            <button
                              onClick={() => handleIncrease(item.foodId)}
                              type="button"
                              className="w-7 h-7 rounded-xl bg-[#e50914] hover:bg-[#b80710] flex items-center justify-center text-white transition cursor-pointer"
                              aria-label="Tăng số lượng"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleIncrease(item.foodId)}
                            type="button"
                            className="w-full bg-[#1e1e22] hover:bg-[#e50914] text-zinc-300 hover:text-white border border-zinc-700/70 hover:border-[#e50914] text-xs sm:text-sm font-bold py-2.5 px-4 rounded-2xl transition-all duration-150 flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Thêm vào đơn</span>
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

      {/* Floating Cart Bar kèm Mini Cart xem/xóa món đã chọn */}
      {totalQuantity > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-[#1c1c1f]/95 backdrop-blur-xl border border-zinc-700 rounded-3xl p-4 shadow-2xl space-y-3">
            {/* Danh sách chi tiết các món đã chọn (khi bấm mở Mini Cart) */}
            {isCartOpen && (
              <div className="border-b border-zinc-800 pb-3 space-y-2.5 max-h-52 overflow-y-auto pr-1">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-bold pb-1">
                  <span>Món bắp nước đã chọn ({totalQuantity})</span>
                  <button
                    type="button"
                    onClick={() => {
                      clearFoods();
                      setIsCartOpen(false);
                    }}
                    className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa tất cả</span>
                  </button>
                </div>

                {cartItems.map((ci) => (
                  <div
                    key={ci.foodId}
                    className="flex items-center justify-between gap-3 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl px-3 py-2 text-xs sm:text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white truncate">{ci.name}</p>
                      <p className="text-[11px] text-zinc-400">
                        {Number(ci.price).toLocaleString('vi-VN')} đ × {ci.qty} ={' '}
                        <strong className="text-[#e50914]">
                          {ci.subtotal.toLocaleString('vi-VN')} đ
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-1">
                      <button
                        type="button"
                        onClick={() => handleDecrease(ci.foodId)}
                        className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center cursor-pointer"
                        aria-label={`Giảm ${ci.name}`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-xs w-5 text-center text-white">
                        {ci.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleIncrease(ci.foodId)}
                        className="w-6 h-6 rounded-lg bg-[#e50914] hover:bg-[#b80710] text-white flex items-center justify-center cursor-pointer"
                        aria-label={`Tăng ${ci.name}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Thanh điều khiển chính của Floating Cart */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsCartOpen((prev) => !prev)}
                className="flex items-center space-x-3 text-left group cursor-pointer"
                title="Bấm để xem hoặc chỉnh sửa các món đã chọn"
              >
                <div className="relative w-10 h-10 rounded-2xl bg-[#e50914]/20 border border-[#e50914]/40 flex items-center justify-center text-[#e50914]">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute -top-1.5 -right-1.5 bg-[#e50914] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {totalQuantity}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-zinc-300 font-semibold flex items-center gap-1 group-hover:text-white transition">
                    <span>Đã chọn {totalQuantity} món</span>
                    {isCartOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                  </p>
                  <p className="text-sm sm:text-base font-black text-[#e50914]">
                    {totalPrice.toLocaleString('vi-VN')} VNĐ
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    clearFoods();
                    setIsCartOpen(false);
                  }}
                  type="button"
                  title="Xóa toàn bộ món đã chọn"
                  aria-label="Xóa giỏ bắp nước"
                  className="p-2.5 rounded-2xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => navigate('/booking')}
                  type="button"
                  className="bg-[#e50914] hover:bg-[#b80710] text-white text-xs sm:text-sm font-bold py-2.5 px-5 rounded-2xl transition shadow-lg shadow-red-950/40 flex items-center space-x-2 cursor-pointer active:scale-95"
                >
                  <span>Đặt vé & Bắp nước</span>
                  <Ticket className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Messenger Floating Action Button */}
      <MessengerButton />
    </div>
  );
};

export default FoodPage;

