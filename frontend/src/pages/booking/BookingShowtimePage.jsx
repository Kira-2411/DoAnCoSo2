import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import MessengerButton from '../../components/MessengerButton';
import BookingStepper from '../../components/booking/BookingStepper';
import { useBooking } from '../../contexts/BookingContext';
import { ChevronLeft, ChevronRight, ArrowRight, ArrowLeft, BarChart2 } from 'lucide-react';

const DATES = [
  { dayOfWeek: 'TH 2', dateNum: '2', fullDate: '2026-11-02', formatted: '02/11/2026' },
  { dayOfWeek: 'TH 3', dateNum: '3', fullDate: '2026-11-03', formatted: '03/11/2026' },
  { dayOfWeek: 'TH 4', dateNum: '4', fullDate: '2026-11-04', formatted: '04/11/2026' },
  { dayOfWeek: 'TH 5', dateNum: '5', fullDate: '2026-11-05', formatted: '05/11/2026' },
  { dayOfWeek: 'TH 6', dateNum: '6', fullDate: '2026-11-06', formatted: '06/11/2026' },
  { dayOfWeek: 'TH 7', dateNum: '7', fullDate: '2026-11-07', formatted: '07/11/2026' },
  { dayOfWeek: 'CN', dateNum: '8', fullDate: '2026-11-08', formatted: '08/11/2026' }
];

const ROOM_SHOWTIMES = [
  {
    roomId: 1,
    roomName: 'Phòng 1',
    slots: [
      {
        id: 1,
        time: '20:00 - 21:40',
        startTime: '20:00',
        endTime: '21:40',
        room: 'Phòng 1',
        totalSeats: 96,
        availableSeats: 96,
        priceMultiplier: 1.0
      },
      {
        id: 2,
        time: '22:00 - 23:40',
        startTime: '22:00',
        endTime: '23:40',
        room: 'Phòng 1',
        totalSeats: 96,
        availableSeats: 88,
        priceMultiplier: 1.0
      }
    ]
  },
  {
    roomId: 2,
    roomName: 'Phòng 2',
    slots: [
      {
        id: 3,
        time: '19:30 - 21:10',
        startTime: '19:30',
        endTime: '21:10',
        room: 'Phòng 2',
        totalSeats: 96,
        availableSeats: 92,
        priceMultiplier: 1.0
      }
    ]
  }
];

const BookingShowtimePage = () => {
  const navigate = useNavigate();
  const { 
    selectedDate, 
    setSelectedDate, 
    selectedShowtime, 
    setSelectedShowtime 
  } = useBooking();

  const [dateIndex, setDateIndex] = useState(1); // Mặc định TH 3 ngày 3 tháng 11

  const handleSelectDate = (d, index) => {
    setDateIndex(index);
    setSelectedDate(d.fullDate);
    if (selectedShowtime) {
      setSelectedShowtime({
        ...selectedShowtime,
        dateFormatted: d.formatted
      });
    }
  };

  const handleSelectSlot = (slot) => {
    const curDate = DATES[dateIndex];
    setSelectedShowtime({
      ...slot,
      dateFormatted: curDate ? curDate.formatted : '03/11/2026'
    });
  };

  const handleBack = () => {
    navigate('/booking');
  };

  const handleNext = () => {
    if (!selectedShowtime) {
      alert('Vui lòng chọn một suất chiếu để tiếp tục!');
      return;
    }
    navigate('/booking/food');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col pb-28">
      {/* 1. Header */}
      <Header />

      {/* 2. Stepper tiến trình (Bước 2 active) */}
      <BookingStepper currentStep={2} showTimer={false} />

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

        {/* Content Layout: 2 Cột */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: Lịch chiếu & Chọn ngày (8/12) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Header Lịch chiếu & Tháng */}
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                LỊCH CHIẾU PHIM
              </h2>
              <div className="text-right">
                <span className="text-sm font-bold text-[#e50914] border-b-2 border-[#e50914] pb-0.5">
                  Tháng 11 - 2026
                </span>
              </div>
            </div>

            {/* Thanh chọn ngày trượt ngang */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Nút lùi ngày */}
              <button
                onClick={() => setDateIndex((prev) => Math.max(0, prev - 1))}
                className="w-10 h-14 sm:w-11 sm:h-16 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition flex-shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Danh sách ngày */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 overflow-x-auto no-scrollbar py-1">
                {DATES.map((d, index) => {
                  const isSelected = dateIndex === index;

                  return (
                    <button
                      key={d.fullDate}
                      onClick={() => handleSelectDate(d, index)}
                      className={`flex-1 min-w-[56px] sm:min-w-[68px] h-14 sm:h-16 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 select-none ${
                        isSelected
                          ? 'bg-[#e50914] text-white shadow-[0_0_20px_rgba(229,9,20,0.6)] font-bold scale-105'
                          : 'bg-zinc-900/90 text-zinc-400 border border-zinc-800/80 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      <span className="text-[11px] sm:text-xs font-medium tracking-wide">
                        {d.dayOfWeek}
                      </span>
                      <span className="text-base sm:text-lg font-black mt-0.5">
                        {d.dateNum}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Nút tiến ngày */}
              <button
                onClick={() => setDateIndex((prev) => Math.min(DATES.length - 1, prev + 1))}
                className="w-10 h-14 sm:w-11 sm:h-16 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition flex-shrink-0"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Danh sách suất chiếu theo từng phòng */}
            <div className="mt-4 flex flex-col gap-6">
              {ROOM_SHOWTIMES.map((room) => (
                <div key={room.roomId} className="flex flex-col gap-3">
                  <h3 className="font-extrabold text-base text-zinc-200">
                    {room.roomName}
                  </h3>

                  <div className="flex flex-wrap gap-4">
                    {room.slots.map((slot) => {
                      const isSelected = selectedShowtime?.id === slot.id;

                      return (
                        <button
                          key={slot.id}
                          onClick={() => handleSelectSlot(slot)}
                          className={`w-40 sm:w-44 py-3 px-4 rounded-xl text-center border-2 transition-all duration-200 ${
                            isSelected
                              ? 'border-[#e50914] bg-zinc-900 text-red-500 shadow-[0_0_20px_rgba(229,9,20,0.4)] ring-2 ring-red-500/30'
                              : 'border-zinc-800 bg-zinc-900/70 text-zinc-300 hover:border-zinc-700'
                          }`}
                        >
                          <div className="font-black text-sm tracking-wide">
                            {slot.time}
                          </div>
                          <div className="text-xs font-semibold text-zinc-400 mt-1">
                            {slot.room}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CỘT PHẢI: Theo dõi phòng thời gian thực (4/12) */}
          <div className="lg:col-span-4 flex flex-col gap-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[#e50914] font-extrabold text-base tracking-wider">
              <BarChart2 className="w-5 h-5" />
              <span>THEO DÕI PHÒNG</span>
            </div>

            <div className="flex flex-col gap-3 divide-y divide-zinc-800/70 pt-2">
              <div className="flex items-center justify-between pt-3">
                <span className="text-sm text-zinc-300 font-medium">
                  {selectedShowtime ? `${selectedShowtime.room} ( suất ${selectedShowtime.startTime} )` : 'Phòng 1 ( suất 20:00 )'}
                </span>
                <span className="text-sm font-extrabold text-[#22c55e] drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]">
                  {selectedShowtime ? `${selectedShowtime.availableSeats}/${selectedShowtime.totalSeats} ghế trống` : '96/96 ghế trống'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-sm text-zinc-400 font-medium">
                  Phòng 1 ( suất 22:00 )
                </span>
                <span className="text-sm font-extrabold text-[#22c55e]">
                  88/96 ghế trống
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-sm text-zinc-400 font-medium">
                  Phòng 2 ( suất 19:30 )
                </span>
                <span className="text-sm font-extrabold text-[#22c55e]">
                  92/96 ghế trống
                </span>
              </div>
            </div>

            <p className="text-xs italic text-zinc-500 mt-4">
              * Dữ liệu cập nhật thời gian thực
            </p>
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

export default BookingShowtimePage;

