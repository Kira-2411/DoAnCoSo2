import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import MessengerButton from '../../components/MessengerButton';
import BookingStepper from '../../components/booking/BookingStepper';
import { useBooking } from '../../contexts/BookingContext';
import { ArrowLeft } from 'lucide-react';

const BookingAcceptPage = () => {
  const navigate = useNavigate();
  const { 
    selectedMovie, 
    selectedShowtime, 
    selectedSeats, 
    selectedFoods, 
    DEFAULT_FOODS,
    seatTotal, 
    foodTotal, 
    grandTotal 
  } = useBooking();

  const handleBack = () => {
    navigate('/booking/seat');
  };

  const handleConfirmAndPay = () => {
    navigate('/booking/pay');
  };

  // Ghép chuỗi các mã ghế
  const seatCodesText = selectedSeats.map((s) => s.code).join(', ');
  const seatCount = selectedSeats.length;

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col pb-28">
      {/* 1. Header */}
      <Header />

      {/* 2. Stepper tiến trình (Bước 5 active kèm bộ đếm ngược giữ ghế) */}
      <BookingStepper currentStep={5} showTimer={true} />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 w-full flex-1">
        {/* Navigation Bar: Quay lại */}
        <div className="flex items-center justify-start py-4 mb-3">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 text-zinc-200 font-medium px-5 py-2.5 rounded-xl border border-zinc-700/60 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>
        </div>

        {/* Khung xem lại đơn hàng (Matching bookingaccept1.png & bookingaccept2.png) */}
        <div className="bg-zinc-900/60 border border-zinc-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md">
          {/* Tiêu đề màu cam đậm */}
          <h2 className="text-xl sm:text-2xl font-black text-[#f59e0b] tracking-wider text-center uppercase mb-8 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
            XEM LẠI ĐƠN CỦA BẠN :
          </h2>

          <div className="flex flex-col gap-6">
            {/* Hàng 1: Thông tin Phim & Suất chiếu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-zinc-800/70">
              {/* Phim */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  PHIM
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
                  {selectedMovie?.title || 'HELLO'}
                </h3>
                <span className="inline-block mt-1 text-sm font-bold text-[#e50914]">
                  {selectedMovie?.format || '2D - dd'}
                </span>
              </div>

              {/* Suất chiếu */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  SUẤT CHIẾU
                </span>
                <div className="text-base sm:text-lg font-bold text-zinc-200">
                  Suất: {selectedShowtime?.startTime || '20:00'} | {selectedShowtime?.dateFormatted || '03/11/2026'}
                </div>
                <div className="text-sm font-medium text-zinc-400 mt-0.5">
                  Phòng chiếu: {selectedShowtime?.roomId || 1}
                </div>
              </div>
            </div>

            {/* Hàng 2: Ghế ngồi */}
            <div className="pb-6 border-b border-zinc-800/70">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                GHẾ NGỒI
              </span>
              <div className="flex items-center justify-between">
                <span className="text-base sm:text-lg font-bold text-zinc-200">
                  {seatCount > 0 ? `${seatCount} ghế (${seatCodesText})` : 'Chưa chọn ghế'}
                </span>
                <span className="text-base sm:text-lg font-black text-white">
                  {seatTotal.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* Hàng 3: Đồ ăn & Combo */}
            <div className="pb-6 border-b border-zinc-800/70">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                ĐỒ ĂN
              </span>
              {Object.keys(selectedFoods).length > 0 ? (
                <div className="flex flex-col gap-2">
                  {Object.entries(selectedFoods).map(([foodId, qty]) => {
                    const food = DEFAULT_FOODS.find((f) => f.id === foodId);
                    if (!food) return null;
                    const itemTotal = food.price * qty;

                    return (
                      <div key={foodId} className="flex items-center justify-between">
                        <span className="text-base font-semibold text-zinc-300">
                          {food.shortName || food.name} {qty > 1 && `(x${qty})`}
                        </span>
                        <span className="text-base font-black text-white">
                          {itemTotal.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-between text-zinc-500 italic text-sm">
                  <span>Không chọn đồ ăn kèm</span>
                  <span>0 đ</span>
                </div>
              )}
            </div>

            {/* Hàng 4: Tổng cộng */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
                TỔNG CỘNG
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#e50914] drop-shadow-[0_0_12px_rgba(229,9,20,0.5)]">
                {grandTotal.toLocaleString('vi-VN')} đ
              </span>
            </div>

            {/* Nút Đỏ Xác nhận & Thanh toán */}
            <div className="mt-4">
              <button
                onClick={handleConfirmAndPay}
                className="w-full bg-[#e50914] hover:bg-[#b80710] active:scale-[0.99] text-white text-base sm:text-lg font-black tracking-wider uppercase py-4 rounded-full shadow-[0_4px_25px_rgba(229,9,20,0.5)] transition duration-200"
              >
                XÁC NHẬN & THANH TOÁN
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Floating Messenger Button */}
      <MessengerButton />

      {/* 4. Bottom Navigation Bar */}
      <BottomNav activeId="booking" />
    </div>
  );
};

export default BookingAcceptPage;

