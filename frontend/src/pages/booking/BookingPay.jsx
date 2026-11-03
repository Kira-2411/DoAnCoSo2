import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import MessengerButton from '../../components/MessengerButton';
import BookingStepper from '../../components/booking/BookingStepper';
import { useBooking } from '../../contexts/BookingContext';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Loader2, 
  Landmark, 
  CheckCircle2, 
  Copy, 
  Check 
} from 'lucide-react';

const BookingPay = () => {
  const navigate = useNavigate();
  const { orderId, grandTotal, resetBooking } = useBooking();
  const [copiedSTK, setCopiedSTK] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const transferMemo = `AKASHI ${orderId}`;
  const bankAccount = '0942004115';
  const bankName = 'MB Bank';
  const accountHolder = 'AKASHI CINEMA';

  // Tạo URL mã VietQR chuẩn
  const vietQrUrl = `https://api.vietqr.io/image/970422-${bankAccount}-compact2.png?amount=${grandTotal}&addInfo=${encodeURIComponent(transferMemo)}&accountName=${encodeURIComponent(accountHolder)}`;

  const handleBack = () => {
    navigate('/booking/accept');
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'STK') {
      setCopiedSTK(true);
      setTimeout(() => setCopiedSTK(false), 2000);
    } else {
      setCopiedMemo(true);
      setTimeout(() => setCopiedMemo(false), 2000);
    }
  };

  const handleSimulatePayment = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      alert('Thanh toán thành công! Vé xem phim đã được chuyển vào mục "Vé của tôi".');
      resetBooking();
      navigate('/membership');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col pb-28">
      {/* 1. Header */}
      <Header />

      {/* 2. Stepper tiến trình (Bước 6 active kèm đồng hồ đếm ngược giữ ghế) */}
      <BookingStepper currentStep={6} showTimer={true} />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 w-full flex-1">
        {/* Navigation Bar: Quay lại */}
        <div className="flex items-center justify-start py-4 mb-2">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 text-zinc-200 font-medium px-5 py-2.5 rounded-xl border border-zinc-700/60 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>
        </div>

        {/* Banner Cảnh Báo Quan Trọng (Viền đỏ neon phát sáng theo UI mẫu bookingpay1.png) */}
        <div className="relative w-full rounded-2xl border-2 border-[#e50914] bg-gradient-to-r from-[#3b080d] via-[#1a0507] to-[#3b080d] shadow-[0_0_35px_rgba(229,9,20,0.7)] p-5 sm:p-7 mb-10 overflow-hidden">
          <div className="flex items-center justify-between gap-4">
            {/* Warning icon trái */}
            <div className="flex-shrink-0 text-amber-400 hidden sm:block">
              <AlertTriangle className="w-12 h-12 stroke-[2.5] drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
            </div>

            {/* Nội dung cảnh báo giữa */}
            <div className="flex flex-col items-center text-center flex-1">
              <h2 className="text-lg sm:text-2xl font-black text-amber-400 tracking-wider uppercase drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                CẢNH BÁO QUAN TRỌNG
              </h2>
              <p className="text-sm sm:text-base font-bold text-white mt-1.5 leading-relaxed">
                Vui lòng không thoát trang trước khi quá trình thanh toán hoàn tất
              </p>
            </div>

            {/* Warning icon phải */}
            <div className="flex-shrink-0 text-amber-400 hidden sm:block">
              <AlertTriangle className="w-12 h-12 stroke-[2.5] drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
            </div>
          </div>
        </div>

        {/* Bố cục 2 Cột: Quét QR & Chi tiết đơn hàng */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* CỘT TRÁI: Quét mã QR */}
          <div className="flex flex-col items-center text-center">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
              QUÉT MÃ QR ĐỂ THANH TOÁN
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 mb-6">
              Sử dụng ứng dụng ngân hàng để quét mã
            </p>

            {/* Khung mã QR trắng */}
            <div className="bg-white rounded-3xl p-5 shadow-[0_15px_40px_rgba(0,0,0,0.8)] border border-zinc-200 w-full max-w-xs flex flex-col items-center justify-center">
              <img
                src={vietQrUrl}
                alt="VietQR MB Bank"
                className="w-full aspect-square object-contain rounded-xl"
                onError={(e) => {
                  // Fallback nếu không có mạng tải ảnh VietQR trực tiếp
                  e.target.src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=AKASHI_CINEMA_PAYMENT';
                }}
              />
            </div>

            {/* Thông tin tài khoản ngân hàng */}
            <div className="mt-5 flex flex-col items-center gap-1.5 text-zinc-300">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Landmark className="w-4 h-4 text-red-500" />
                <span>{accountHolder} - {bankName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm sm:text-base font-black tracking-wide text-white">
                <span>STK: {bankAccount} | MB</span>
                <button
                  onClick={() => handleCopy(bankAccount, 'STK')}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                  title="Sao chép STK"
                >
                  {copiedSTK ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Chi tiết đơn hàng & Trạng thái */}
          <div className="flex flex-col gap-6 lg:pl-6">
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                CHI TIẾT ĐƠN HÀNG
              </h3>
            </div>

            {/* Chi tiết đơn */}
            <div className="flex flex-col gap-4 text-base">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-medium">Mã đơn hàng:</span>
                <span className="font-extrabold text-white">#{orderId}</span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-zinc-400 font-medium">Số tiền cần thanh toán:</span>
                <span className="text-2xl sm:text-3xl font-black text-[#e50914] drop-shadow-[0_0_12px_rgba(229,9,20,0.6)]">
                  {grandTotal.toLocaleString('vi-VN')} đ
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-medium">Nội dung CK:</span>
                <span className="font-black text-amber-400 tracking-wider">
                  {transferMemo}
                </span>
                <button
                  onClick={() => handleCopy(transferMemo, 'MEMO')}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                  title="Sao chép nội dung CK"
                >
                  {copiedMemo ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Trạng thái chờ thanh toán */}
            <div className="mt-4 flex flex-col items-start gap-3">
              {paymentSuccess ? (
                <div className="flex items-center gap-2 text-green-400 font-bold text-lg">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                  <span>Thanh toán thành công! Đang chuyển hướng...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2 text-amber-400 font-bold text-base sm:text-lg">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400 stroke-[2.5]" />
                  <span>⌛ Đang chờ thanh toán...</span>
                </div>
              )}

              {/* Nút Đỏ Xác nhận (Theo đúng bookingpay2.png) */}
              <button
                onClick={handleSimulatePayment}
                className="w-full sm:w-auto min-w-[200px] bg-[#e50914] hover:bg-[#b80710] active:scale-95 text-white font-black text-base py-3.5 px-10 rounded-2xl shadow-[0_4px_20px_rgba(229,9,20,0.5)] transition duration-200 mt-2"
              >
                Xác nhận
              </button>

              <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1.5">
                <span>⚠ Lưu ý:</span>
                <span>Nhập ĐÚNG số tiền và nội dung chuyển khoản</span>
              </p>
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

export default BookingPay;

