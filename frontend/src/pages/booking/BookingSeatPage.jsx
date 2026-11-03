import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import MessengerButton from '../../components/MessengerButton';
import BookingStepper from '../../components/booking/BookingStepper';
import { useBooking } from '../../contexts/BookingContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// Cấu hình bảng giá và loại ghế (khớp với DB migration V1 và UI mẫu)
const SEAT_CONFIG = {
  STANDARD: { label: 'Ghế Thường', price: 60000, colorClass: 'border-[#06b6d4] text-[#06b6d4]' },
  VIP: { label: 'Ghế VIP', price: 80000, colorClass: 'border-[#eab308] text-[#eab308]' },
  COUPLE: { label: 'Ghế Couple', price: 140000, colorClass: 'border-[#ec4899] text-[#ec4899]' }
};

// Danh sách các ghế đã được bán trước (để sơ đồ trông thực tế)
const SOLD_SEATS = ['A01', 'A02', 'B14', 'B15', 'D07', 'D08', 'E05', 'F10'];

const generateSeats = () => {
  const seats = [];

  // Hàng A, B, C: Ghế thường (15 ghế mỗi hàng)
  ['A', 'B', 'C'].forEach((row) => {
    for (let num = 1; num <= 15; num++) {
      const code = `${row}${num.toString().padStart(2, '0')}`;
      seats.push({
        id: code,
        code,
        row,
        num,
        type: 'STANDARD',
        price: 60000,
        isSold: SOLD_SEATS.includes(code)
      });
    }
  });

  // Hàng D, E, F: Ghế VIP (15 ghế mỗi hàng)
  ['D', 'E', 'F'].forEach((row) => {
    for (let num = 1; num <= 15; num++) {
      const code = `${row}${num.toString().padStart(2, '0')}`;
      seats.push({
        id: code,
        code,
        row,
        num,
        type: 'VIP',
        price: 80000,
        isSold: SOLD_SEATS.includes(code)
      });
    }
  });

  // Hàng G: Ghế Couple (6 ghế đôi)
  for (let num = 1; num <= 6; num++) {
    const code = `G${num.toString().padStart(2, '0')}`;
    seats.push({
      id: code,
      code,
      row: 'G',
      num,
      type: 'COUPLE',
      price: 140000,
      isSold: SOLD_SEATS.includes(code)
    });
  }

  return seats;
};

const ALL_SEATS = generateSeats();

const BookingSeatPage = () => {
  const navigate = useNavigate();
  const { selectedSeats, toggleSeat, seatTotal } = useBooking();

  const handleBack = () => {
    navigate('/booking/food');
  };

  const handleNext = () => {
    if (selectedSeats.length === 0) {
      alert('Vui lòng chọn ít nhất 1 ghế ngồi để tiếp tục!');
      return;
    }
    navigate('/booking/accept');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col pb-28">
      {/* 1. Header */}
      <Header />

      {/* 2. Stepper tiến trình (Bước 4 active) */}
      <BookingStepper currentStep={4} showTimer={false} />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 w-full flex-1">
        {/* Navigation Bar: Quay lại & Tiếp theo */}
        <div className="flex items-center justify-between py-4 mb-3">
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

        {/* Legend Bar: Phân loại ghế */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 pt-1 text-xs sm:text-sm">
          <div className="flex items-center gap-6 flex-wrap">
            {/* Ghế Thường */}
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md border-2 border-[#06b6d4] bg-transparent" />
              <span className="text-zinc-300 font-medium">Ghế Thường</span>
            </div>

            {/* Ghế VIP */}
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md border-2 border-[#eab308] bg-transparent" />
              <span className="text-zinc-300 font-medium">Ghế VIP</span>
            </div>

            {/* Ghế Couple */}
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md border-2 border-[#ec4899] bg-transparent" />
              <span className="text-zinc-300 font-medium">Ghế Couple</span>
            </div>
          </div>

          <div className="text-zinc-400 text-xs italic">
            Có thể chọn tối đa 10 ghế
          </div>
        </div>

        {/* Cinema Screen Curve */}
        <div className="w-full flex flex-col items-center justify-center my-6">
          <span className="text-xs sm:text-sm font-extrabold tracking-[0.25em] text-zinc-400 uppercase mb-2">
            MÀN HÌNH / SCREEN
          </span>
          <div className="w-3/4 max-w-2xl h-3 border-t-2 border-zinc-600 rounded-[50%] shadow-[0_-8px_15px_rgba(255,255,255,0.08)]" />
        </div>

        {/* Sơ đồ ma trận ghế ngồi (Scrollable on small screens) */}
        <div className="w-full overflow-x-auto no-scrollbar py-4">
          <div className="min-w-[760px] flex flex-col items-center gap-2.5 mx-auto">
            {/* Rows A to F (15 ghế mỗi hàng) */}
            {['A', 'B', 'C', 'D', 'E', 'F'].map((rowLetter) => {
              const rowSeats = ALL_SEATS.filter((s) => s.row === rowLetter);
              const isVip = ['D', 'E', 'F'].includes(rowLetter);

              return (
                <div key={rowLetter} className="flex items-center gap-2">
                  {rowSeats.map((seat) => {
                    const isSelected = selectedSeats.some((s) => s.id === seat.id);

                    if (seat.isSold) {
                      return (
                        <div
                          key={seat.id}
                          className="w-10 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700/40 text-zinc-600 text-[11px] font-bold flex items-center justify-center cursor-not-allowed select-none"
                        >
                          {seat.code}
                        </div>
                      );
                    }

                    return (
                      <button
                        key={seat.id}
                        onClick={() => toggleSeat(seat)}
                        className={`w-10 h-9 rounded-lg text-[11px] font-extrabold transition-all duration-150 flex items-center justify-center select-none ${
                          isSelected
                            ? 'bg-[#22c55e] border-2 border-[#22c55e] text-black shadow-[0_0_12px_rgba(34,197,94,0.7)] scale-105'
                            : isVip
                            ? 'border-2 border-[#eab308] text-white hover:bg-yellow-500/20'
                            : 'border-2 border-[#06b6d4] text-white hover:bg-cyan-500/20'
                        }`}
                      >
                        {seat.code}
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {/* Row G: Ghế Couple (6 ghế đôi rộng) */}
            <div className="flex items-center gap-3.5 mt-2">
              {ALL_SEATS.filter((s) => s.row === 'G').map((seat) => {
                const isSelected = selectedSeats.some((s) => s.id === seat.id);

                if (seat.isSold) {
                  return (
                    <div
                      key={seat.id}
                      className="w-24 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700/40 text-zinc-600 text-xs font-bold flex items-center justify-center cursor-not-allowed select-none"
                    >
                      {seat.code}
                    </div>
                  );
                }

                return (
                  <button
                    key={seat.id}
                    onClick={() => toggleSeat(seat)}
                    className={`w-24 h-9 rounded-lg text-xs font-extrabold transition-all duration-150 flex items-center justify-center select-none ${
                      isSelected
                        ? 'bg-[#22c55e] border-2 border-[#22c55e] text-black shadow-[0_0_12px_rgba(34,197,94,0.7)] scale-105'
                        : 'border-2 border-[#ec4899] text-white hover:bg-pink-500/20'
                    }`}
                  >
                    {seat.code}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Legend & Price Bar */}
        <div className="mt-8 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Trạng thái chọn / đã bán */}
          <div className="flex items-center gap-6 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-zinc-300 font-medium">Đang chọn</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-zinc-800 border border-zinc-700/60" />
              <span className="text-zinc-400 font-medium">Đã bán</span>
            </div>
          </div>

          {/* Tạm tính tiền ghế */}
          <div className="text-right">
            <span className="text-xs uppercase tracking-wider text-zinc-400 block font-semibold">
              TẠM TÍNH
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#eab308] drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]">
              {seatTotal.toLocaleString('vi-VN')} đ
            </span>
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

export default BookingSeatPage;

