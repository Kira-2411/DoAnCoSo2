import React from 'react';
import { 
  Clapperboard, 
  Clock, 
  UtensilsCrossed, 
  Armchair, 
  Check, 
  CreditCard 
} from 'lucide-react';
import { useBooking } from '../../contexts/BookingContext';

const STEPS = [
  { step: 1, label: '1. CHỌN PHIM', icon: Clapperboard, path: '/booking' },
  { step: 2, label: '2. CHỌN SUẤT CHIẾU', icon: Clock, path: '/booking/showtime' },
  { step: 3, label: '3. CHỌN BẮP NƯỚC', icon: UtensilsCrossed, path: '/booking/food' },
  { step: 4, label: '4. CHỌN GHẾ', icon: Armchair, path: '/booking/seat' },
  { step: 5, label: '5. XÁC NHẬN', icon: Check, path: '/booking/accept' },
  { step: 6, label: '6. THANH TOÁN', icon: CreditCard, path: '/booking/pay' }
];

const BookingStepper = ({ currentStep = 1, showTimer = false }) => {
  const { holdCountdown } = useBooking();

  return (
    <div className="relative w-full max-w-6xl mx-auto pt-4 sm:pt-6 pb-4 sm:pb-6 px-4">
      {/* Top right hold countdown badge (Hiện ở Bước 5 và 6 theo đúng UI mẫu) */}
      {showTimer && (
        <div className="flex justify-end mb-3 sm:mb-1">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-amber-500/80 bg-amber-950/30 text-amber-400 text-xs sm:text-sm font-medium tracking-wide shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse">
            <span>Thời gian giữ ghế :</span>
            <span className="font-bold text-amber-300">{holdCountdown} giây</span>
          </div>
        </div>
      )}

      {/* Stepper Steps Bar */}
      <div className="flex items-center justify-between sm:justify-center sm:gap-2 lg:gap-4 overflow-x-auto no-scrollbar py-2">
        {STEPS.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.step === currentStep;
          const isPassed = item.step < currentStep;

          return (
            <React.Fragment key={item.step}>
              {/* Step Item */}
              <div className="flex flex-col items-center flex-shrink-0 group">
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? 'bg-[#e50914] text-white shadow-[0_0_25px_rgba(229,9,20,0.85)] scale-110 ring-4 ring-red-500/30'
                      : isPassed
                      ? 'bg-zinc-800 text-red-400 border border-red-900/60'
                      : 'bg-[#27272a]/60 text-zinc-500 border border-zinc-800'
                  }`}
                >
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                </div>

                <span
                  className={`mt-2 text-[10px] sm:text-xs font-bold tracking-wider uppercase transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-amber-400 font-extrabold drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      : isPassed
                      ? 'text-zinc-300'
                      : 'text-zinc-500'
                  }`}
                >
                  {item.label}
                </span>
              </div>

              {/* Connecting Line */}
              {index < STEPS.length - 1 && (
                <div
                  className={`hidden sm:block h-[2px] w-6 md:w-10 lg:w-14 transition-colors mb-5 ${
                    isPassed ? 'bg-red-900/80' : 'bg-zinc-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default BookingStepper;

