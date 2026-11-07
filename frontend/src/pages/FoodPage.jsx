import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UtensilsCrossed, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Check, 
  Sparkles,
  Ticket,
  Loader2
} from 'lucide-react';

import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import MessengerButton from '../components/MessengerButton';
import foodApi from '../api/foodApi';

// Import các ảnh bắp nước của Akashi
import bapImg1 from '../assets/images/AkashiBap.png';
import bapImg2 from '../assets/images/AkashiBap2.png';
import coImg from '../assets/images/AkashiCo.png';
import vuiImg from '../assets/images/AkashiVui.png';
import akashiImg from '../assets/images/Akashi.png';

// Lấy hình ảnh đại diện cho món ăn
const getFoodImage = (item) => {
  if (item.img) return item.img;
  const cat = (item.category || '').toLowerCase();
  const name = (item.name || '').toLowerCase();

  if (cat.includes('bắp')) {
    if (name.includes('phô mai')) return bapImg2;
    return bapImg1;
  }
  if (cat.includes('nước')) {
    return coImg;
  }
  if (cat.includes('combo')) {
    if (name.includes('1 bắp 1 nước')) return akashiImg;
    return vuiImg;
  }
  return akashiImg;
};

// Mô tả mặc định nếu database chưa có trường description
const getFoodDescription = (item) => {
  const cat = (item.category || '').toLowerCase();
  const name = (item.name || '').toLowerCase();

  if (cat.includes('combo')) {
    return 'Combo bắp nước siêu tiết kiệm kèm trải nghiệm điện ảnh trọn vẹn.';
  }
  if (cat.includes('bắp')) {
    if (name.includes('phô mai')) return 'Bắp rang lắc bột phô mai mặn mà béo ngậy.';
    return 'Bắp rang bơ đường truyền thống giòn rụm, thơm ngậy.';
  }
  if (cat.includes('nước')) {
    return 'Thức uống mát lạnh sảng khoái đánh tan cơn khát.';
  }
  return 'Món ăn kèm thơm ngon tại quầy bắp nước Akashi Cinema.';
};

const FoodPage = () => {
  const navigate = useNavigate();
  // Tab hiện tại: 'COMBO' | 'BAP' | 'NUOC'
  const [activeTab, setActiveTab] = useState('COMBO');
  // Danh sách món ăn từ database
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Giỏ hàng món ăn { [itemId]: quantity }
  const [cart, setCart] = useState({});

  // Tải danh sách món ăn từ database theo danh mục
  useEffect(() => {
    let isMounted = true;
    const fetchFoods = async () => {
      try {
        setLoading(true);
        let categoryParam;
        if (activeTab === 'COMBO') categoryParam = 'Combo';
        else if (activeTab === 'BAP') categoryParam = 'Bắp';
        else if (activeTab === 'NUOC') categoryParam = 'Nước';

        const res = await foodApi.getFoods({ category: categoryParam });
        if (isMounted) {
          setFoods(res.data || []);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách món ăn:', err);
        if (isMounted) {
          setFoods([]);
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
  }, [activeTab]);

  const handleIncrease = (id) => {
    setCart((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const handleDecrease = (id) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return {
        ...prev,
        [id]: current - 1,
      };
    });
  };

  // Tính tổng số món và tổng tiền
  const totalQuantity = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = foods.find((f) => f.foodId === Number(id));
    return sum + (item ? item.price * qty : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-red-600 selection:text-white pb-32">
      {/* 1. Header dùng chung */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
        
        {/* Section: Thanh Tab phân loại (Khớp chuẩn UI/food.png) */}
        <div className="border-b border-zinc-800/80">
          <div className="flex items-center space-x-6 sm:space-x-12 overflow-x-auto no-scrollbar">
            
            {/* Tab: COMBO */}
            <button
              onClick={() => setActiveTab('COMBO')}
              type="button"
              className={`pb-3 text-lg sm:text-2xl font-black uppercase tracking-wider transition-all duration-200 cursor-pointer relative whitespace-nowrap ${
                activeTab === 'COMBO'
                  ? 'text-[#e50914]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>COMBO</span>
              {activeTab === 'COMBO' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#e50914] rounded-full animate-in fade-in zoom-in-95 duration-200"></div>
              )}
            </button>

            {/* Tab: BẮP RANG */}
            <button
              onClick={() => setActiveTab('BAP')}
              type="button"
              className={`pb-3 text-lg sm:text-2xl font-black uppercase tracking-wider transition-all duration-200 cursor-pointer relative whitespace-nowrap ${
                activeTab === 'BAP'
                  ? 'text-[#e50914]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>BẮP RANG</span>
              {activeTab === 'BAP' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#e50914] rounded-full animate-in fade-in zoom-in-95 duration-200"></div>
              )}
            </button>

            {/* Tab: THỨC UỐNG */}
            <button
              onClick={() => setActiveTab('NUOC')}
              type="button"
              className={`pb-3 text-lg sm:text-2xl font-black uppercase tracking-wider transition-all duration-200 cursor-pointer relative whitespace-nowrap ${
                activeTab === 'NUOC'
                  ? 'text-[#e50914]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>THỨC UỐNG</span>
              {activeTab === 'NUOC' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#e50914] rounded-full animate-in fade-in zoom-in-95 duration-200"></div>
              )}
            </button>

          </div>
        </div>

        {/* Section: Lưới món ăn & Combo (Khớp mẫu thẻ UI/food.png) */}
        <section aria-label="Danh sách món ăn">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400 bg-[#1c1c1f]/40 rounded-3xl border border-zinc-800">
              <Loader2 className="w-8 h-8 animate-spin text-[#e50914] mb-3" />
              <p className="text-sm font-medium">Đang tải danh sách món ăn từ rạp...</p>
            </div>
          ) : foods.length === 0 ? (
            <div className="bg-[#1c1c1f]/80 border border-zinc-800/90 rounded-3xl p-12 text-center text-zinc-400 space-y-2">
              <UtensilsCrossed className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">Chưa có món trong danh mục này</h3>
              <p className="text-xs text-zinc-500">Vui lòng chọn danh mục khác để xem menu của rạp nhé!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
              {foods.map((item) => {
                const qty = cart[item.foodId] || 0;
                const imageSrc = getFoodImage(item);
                const desc = getFoodDescription(item);
                const priceFormatted = (item.price || 0).toLocaleString('vi-VN') + ' VNĐ';

                return (
                  <div
                    key={item.foodId}
                    className="group relative bg-[#1c1c1f] rounded-3xl border border-zinc-800/90 hover:border-zinc-700/80 p-4 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Khung hình ảnh món ăn */}
                    <div className="relative aspect-[4/3] w-full bg-[#131316] rounded-2xl overflow-hidden p-3 flex items-center justify-center border border-zinc-800/70">
                      
                      {/* Huy hiệu đỏ ở góc trên bên phải (khớp mẫu Combo trong UI/food.png) */}
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
                        {/* Tên món màu trắng in đậm (khớp UI/food.png) */}
                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#e50914] transition-colors">
                          {item.name}
                        </h3>

                        {/* Mô tả ngắn */}
                        <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                          {desc}
                        </p>

                        {/* Giá tiền in đậm màu đỏ đặc trưng (khớp UI/food.png) */}
                        <p className="text-base sm:text-lg font-black text-[#e50914] mt-2">
                          {priceFormatted}
                        </p>
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

      {/* Floating Cart Bar khi có món được chọn */}
      {totalQuantity > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-[#1c1c1f]/95 backdrop-blur-xl border border-zinc-700 rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#e50914]/20 border border-[#e50914]/40 flex items-center justify-center text-[#e50914]">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium">
                  Đã chọn <span className="text-white font-bold">{totalQuantity}</span> món
                </p>
                <p className="text-sm sm:text-base font-black text-[#e50914]">
                  {totalPrice.toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
            </div>

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
      )}

      {/* 2. Messenger Floating Action Button */}
      <MessengerButton />

      {/* 3. Bottom Navigation Bar dạng nổi viên thuốc (Active vào mục "Đồ ăn") */}
      <BottomNav activeId="food" />
    </div>
  );
};

export default FoodPage;

