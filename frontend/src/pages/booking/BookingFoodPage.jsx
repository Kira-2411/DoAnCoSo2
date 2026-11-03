import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import MessengerButton from '../../components/MessengerButton';
import BookingStepper from '../../components/booking/BookingStepper';
import { useBooking } from '../../contexts/BookingContext';
import { ArrowLeft, ArrowRight, Lightbulb, Plus, Minus } from 'lucide-react';

const TABS = [
  { id: 'ALL', label: 'TẤT CẢ' },
  { id: 'COMBO', label: 'COMBO' },
  { id: 'POPCORN', label: 'BẮP RANG' },
  { id: 'DRINK', label: 'THỨC UỐNG' }
];

const BookingFoodPage = () => {
  const navigate = useNavigate();
  const { 
    selectedFoods, 
    updateFoodQuantity, 
    DEFAULT_FOODS,
    foodTotal 
  } = useBooking();
  const [activeTab, setActiveTab] = useState('ALL');

  const filteredFoods = activeTab === 'ALL'
    ? DEFAULT_FOODS
    : DEFAULT_FOODS.filter((item) => item.category === activeTab);

  const handleBack = () => {
    navigate('/booking/showtime');
  };

  const handleNext = () => {
    // Đồ ăn là tùy chọn (optional theo BR-BOOK-01), có thể bấm tiếp theo luôn
    navigate('/booking/seat');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col pb-28">
      {/* 1. Header */}
      <Header />

      {/* 2. Stepper tiến trình (Bước 3 active) */}
      <BookingStepper currentStep={3} showTimer={false} />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 w-full flex-1">
        {/* Navigation Bar: Quay lại & Tiếp theo */}
        <div className="flex items-center justify-between py-4 mb-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 text-zinc-200 font-medium px-5 py-2.5 rounded-xl border border-zinc-700/60 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>

          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 bg-[#e50914] hover:bg-[#b80710] active:scale-95 text-white font-bold px-7 py-2.5 rounded-full shadow-[0_4px_20px_rgba(229,9,20,0.4)] transition-all duration-200"
          >
            <span>Tiếp theo</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Categories Tabs */}
        <div className="flex items-center gap-6 sm:gap-8 border-b border-zinc-800 pb-3 mb-6 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-sm sm:text-base font-extrabold uppercase transition-colors relative pb-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-[#e50914]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#e50914] rounded-full shadow-[0_0_10px_rgba(229,9,20,0.8)]" />
              )}
            </button>
          ))}
        </div>

        {/* Tip Banner (Mẹo nhỏ theo đúng UI mẫu) */}
        <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-[#2a0e14] to-zinc-900 border border-red-900/40 flex items-center gap-3 shadow-lg">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 fill-amber-400/30 text-amber-400" />
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed">
            <span className="font-bold text-amber-300">Mẹo nhỏ:</span> Chọn các Combo có sẵn giúp bạn tiết kiệm lên đến 20% so với mua lẻ từng món!
          </p>
        </div>

        {/* Food Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFoods.map((food) => {
            const quantity = selectedFoods[food.id] || 0;

            return (
              <div
                key={food.id}
                className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 hover:border-zinc-700 transition overflow-hidden flex flex-col group"
              >
                {/* Image Container with Badge */}
                <div className="relative aspect-[4/3] w-full bg-zinc-950 flex items-center justify-center overflow-hidden p-4">
                  <img
                    src={food.image}
                    alt={food.name}
                    className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
                  />

                  {/* Badge Category (Đỏ bo tròn theo UI mẫu) */}
                  <span className="absolute top-3 right-3 bg-[#e50914] text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md">
                    {food.categoryLabel}
                  </span>
                </div>

                {/* Details */}
                <div className="p-5 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="font-extrabold text-base text-zinc-100 group-hover:text-red-400 transition-colors">
                      {food.name}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                      {food.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-zinc-800 flex items-center justify-between">
                    <span className="font-black text-lg text-[#e50914]">
                      {food.price.toLocaleString('vi-VN')} đ
                    </span>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 bg-zinc-800/80 rounded-xl p-1 border border-zinc-700/60">
                      <button
                        onClick={() => updateFoodQuantity(food.id, -1)}
                        disabled={quantity === 0}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                          quantity === 0
                            ? 'text-zinc-600 cursor-not-allowed'
                            : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
                        }`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-7 text-center font-bold text-sm text-white select-none">
                        {quantity}
                      </span>

                      <button
                        onClick={() => updateFoodQuantity(food.id, 1)}
                        className="w-7 h-7 rounded-lg bg-red-600/30 hover:bg-red-600 text-white flex items-center justify-center transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 3. Floating Messenger Button */}
      <MessengerButton />

      {/* 4. Bottom Navigation Bar */}
      <BottomNav activeId="booking" />
    </div>
  );
};

export default BookingFoodPage;

