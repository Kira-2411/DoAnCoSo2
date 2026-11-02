import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UtensilsCrossed, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Check, 
  Sparkles,
  Ticket
} from 'lucide-react';

import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import MessengerButton from '../components/MessengerButton';

// Import các ảnh bắp nước của Akashi
import bapImg1 from '../assets/images/AkashiBap.png';
import bapImg2 from '../assets/images/AkashiBap2.png';
import coImg from '../assets/images/AkashiCo.png';
import vuiImg from '../assets/images/AkashiVui.png';
import akashiImg from '../assets/images/Akashi.png';

// Dữ liệu món ăn và combo
const FOOD_ITEMS = [
  // COMBO
  {
    id: 1,
    name: 'Bắp + Nước',
    price: 90000,
    priceFormatted: '90,000 VNĐ',
    category: 'COMBO',
    badge: 'Combo',
    image: vuiImg,
    description: '1 Bắp ngọt vừa giòn thơm + 1 Ly nước ngọt mát lạnh tự chọn.',
  },
  {
    id: 2,
    name: 'Combo 1 bắp 1 nước',
    price: 65000,
    priceFormatted: '65,000 VNĐ',
    category: 'COMBO',
    badge: 'Combo',
    image: akashiImg,
    description: 'Tiết kiệm hơn với 1 Bắp bơ truyền thống + 1 Nước ngọt size vừa.',
  },
  {
    id: 3,
    name: 'Combo 2 bắp 2 nước',
    price: 120000,
    priceFormatted: '120,000 VNĐ',
    category: 'COMBO',
    badge: 'Combo',
    image: vuiImg,
    description: 'Dành cho 2 người: 2 Bắp tùy chọn vị (ngọt/phô mai) + 2 Ly nước lớn.',
  },
  {
    id: 4,
    name: 'Combo Party Gia Đình',
    price: 165000,
    priceFormatted: '165,000 VNĐ',
    category: 'COMBO',
    badge: 'Combo',
    image: bapImg2,
    description: '2 Bắp lớn phô mai / caramel + 3 Nước ngọt lớn tặng kèm snack.',
  },

  // BẮP RANG
  {
    id: 5,
    name: 'Bắp ngọt (vừa)',
    price: 45000,
    priceFormatted: '45,000 VNĐ',
    category: 'BAP',
    badge: 'Bắp',
    image: bapImg1,
    description: 'Bắp rang bơ đường truyền thống giòn rụm, thơm ngậy.',
  },
  {
    id: 6,
    name: 'Bắp phô mai (vừa)',
    price: 55000,
    priceFormatted: '55,000 VNĐ',
    category: 'BAP',
    badge: 'Bắp',
    image: bapImg2,
    description: 'Bắp rang lắc bột phô mai mặn mà béo ngậy khó cưỡng.',
  },
  {
    id: 7,
    name: 'Bắp caramel (lớn)',
    price: 60000,
    priceFormatted: '60,000 VNĐ',
    category: 'BAP',
    badge: 'Bắp',
    image: bapImg1,
    description: 'Bắp rang phủ sốt caramel đậm vị ngọt ngào đặc biệt.',
  },

  // THỨC UỐNG
  {
    id: 8,
    name: 'Nước ngọt ly lớn',
    price: 30000,
    priceFormatted: '30,000 VNĐ',
    category: 'NUOC',
    badge: 'Nước',
    image: coImg,
    description: 'Tùy chọn: Coca-Cola, Sprite, Fanta nhiều đá sảng khoái.',
  },
  {
    id: 9,
    name: 'Trà đào hạt chia',
    price: 35000,
    priceFormatted: '35,000 VNĐ',
    category: 'NUOC',
    badge: 'Nước',
    image: coImg,
    description: 'Trà đào thơm thanh mát kèm đào miếng giòn và hạt chia bổ dưỡng.',
  },
  {
    id: 10,
    name: 'Nước suối Dasani 500ml',
    price: 15000,
    priceFormatted: '15,000 VNĐ',
    category: 'NUOC',
    badge: 'Nước',
    image: coImg,
    description: 'Nước khoáng tinh khiết đóng chai 500ml.',
  },
];

const FoodPage = () => {
  const navigate = useNavigate();
  // Tab hiện tại: 'COMBO' | 'BAP' | 'NUOC'
  const [activeTab, setActiveTab] = useState('COMBO');
  // Giỏ hàng món ăn { [itemId]: quantity }
  const [cart, setCart] = useState({});

  const filteredItems = FOOD_ITEMS.filter((item) => item.category === activeTab);

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
    const item = FOOD_ITEMS.find((f) => f.id === Number(id));
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {filteredItems.map((item) => {
              const qty = cart[item.id] || 0;

              return (
                <div
                  key={item.id}
                  className="group relative bg-[#1c1c1f] rounded-3xl border border-zinc-800/90 hover:border-zinc-700/80 p-4 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Khung hình ảnh món ăn */}
                  <div className="relative aspect-[4/3] w-full bg-[#131316] rounded-2xl overflow-hidden p-3 flex items-center justify-center border border-zinc-800/70">
                    
                    {/* Huy hiệu đỏ ở góc trên bên phải (khớp mẫu Combo trong UI/food.png) */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="bg-[#e50914] text-white font-extrabold text-[11px] sm:text-xs px-3 py-1 rounded-full shadow-md">
                        {item.badge}
                      </span>
                    </div>

                    {/* Hình ảnh hoạt hình Akashi */}
                    <img
                      src={item.image}
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
                        {item.description}
                      </p>

                      {/* Giá tiền in đậm màu đỏ đặc trưng (khớp UI/food.png) */}
                      <p className="text-base sm:text-lg font-black text-[#e50914] mt-2">
                        {item.priceFormatted}
                      </p>
                    </div>

                    {/* Bộ chọn số lượng / nút mua */}
                    <div className="pt-2 flex items-center justify-between">
                      {qty > 0 ? (
                        <div className="flex items-center space-x-3 bg-zinc-900 border border-zinc-700/80 px-2.5 py-1.5 rounded-2xl w-full justify-between">
                          <button
                            onClick={() => handleDecrease(item.id)}
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
                            onClick={() => handleIncrease(item.id)}
                            type="button"
                            className="w-7 h-7 rounded-xl bg-[#e50914] hover:bg-[#b80710] flex items-center justify-center text-white transition cursor-pointer"
                            aria-label="Tăng số lượng"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleIncrease(item.id)}
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

