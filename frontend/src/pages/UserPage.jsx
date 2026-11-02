import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  Pencil, 
  User as UserIcon, 
  Shield, 
  Ticket, 
  Tag, 
  Award, 
  LogOut, 
  Camera, 
  Check, 
  X, 
  Sparkles,
  Lock,
  ChevronRight,
  Calendar
} from 'lucide-react';

import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import MessengerButton from '../components/MessengerButton';
import { useAuth } from '../contexts/AuthContext';

// Dữ liệu mẫu lịch sử vé cá nhân
const USER_TICKETS = [
  {
    orderId: '53',
    movieTitle: 'Bóng rổ đường phố',
    showtime: '26/06/2026 23:00',
    room: 'Phòng 4',
    seats: 'A08',
    status: 'PAID',
    statusText: 'Đã thanh toán',
    totalPrice: '60.000 đ',
  },
  {
    orderId: '50',
    movieTitle: 'Bản giao hưởng địa cầu',
    showtime: '21/06/2026 10:00',
    room: 'Phòng 1',
    seats: 'C07',
    status: 'PAID',
    statusText: 'Đã thanh toán',
    totalPrice: '60.000 đ',
  },
];

// Dữ liệu mẫu ưu đãi của thành viên
const USER_VOUCHERS = [
  {
    code: 'GIAM10',
    title: 'Giảm 10% vé xem phim cuối tuần',
    desc: 'Áp dụng cho đơn từ 100.000đ',
    expiry: '31/12/2026',
  },
  {
    code: 'GIAM20K',
    title: 'Giảm 20.000đ combo bắp nước',
    desc: 'Áp dụng cho đơn từ 150.000đ',
    expiry: '15/11/2026',
  },
];

const UserPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Tab con trong trang cá nhân: 'INFO' | 'TICKETS' | 'VOUCHERS'
  const [activeTab, setActiveTab] = useState('INFO');

  // Trạng thái modal chỉnh sửa thông tin
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.username || 'Gia Bảo');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || 'Chưa cập nhật');
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  // Dữ liệu hiển thị (kết hợp tài khoản thực tế và mẫu theo UI/user.png)
  const emailDisplay = user?.email || 'baonng.25it@vku.udn.vn';
  const roleDisplay = user?.role ? `THÀNH VIÊN ${user.role}` : 'THÀNH VIÊN ADMIN';

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setEditSuccessMsg('Cập nhật thông tin thành công!');
    setTimeout(() => {
      setEditSuccessMsg('');
      setIsEditModalOpen(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-red-600 selection:text-white pb-32">
      {/* 1. Header dùng chung */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Section: Hồ sơ cá nhân (Khớp chuẩn UI/user.png) */}
        <div className="flex flex-col items-center text-center space-y-4">
          
          {/* Avatar Profile hình tròn lớn với viền đỏ phát sáng (Neon Glow) */}
          <div className="relative group">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-[#1c1c1f] border-2 border-[#e50914] shadow-[0_0_28px_rgba(229,9,20,0.55)] flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <UserIcon className="w-16 h-16 sm:w-20 sm:h-20 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
            </div>

            {/* Nút bút chì đỏ nhỏ ở góc dưới avatar (khớp UI/user.png) */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              type="button"
              className="absolute bottom-1 right-1 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#e50914] hover:bg-[#b80710] text-white flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-110 cursor-pointer border-2 border-[#141414]"
              title="Chỉnh sửa thông tin"
              aria-label="Chỉnh sửa thông tin"
            >
              <Pencil className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>

          {/* Tên người dùng (Gia Bảo) */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {displayName}
            </h1>

            {/* Cấp bậc thành viên chữ đỏ in hoa (THÀNH VIÊN ADMIN) */}
            <p className="text-xs sm:text-sm font-black text-[#e50914] tracking-widest uppercase">
              {roleDisplay}
            </p>
          </div>

          {/* Thanh thống kê nhanh phong cách mạng xã hội (Facebook style) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-lg pt-2">
            <div className="bg-[#1c1c1f] border border-zinc-800 rounded-2xl p-3 text-center">
              <p className="text-lg sm:text-2xl font-black text-white">12</p>
              <p className="text-[11px] text-zinc-400 font-medium">Vé đã đặt</p>
            </div>
            <div className="bg-[#1c1c1f] border border-zinc-800 rounded-2xl p-3 text-center">
              <p className="text-lg sm:text-2xl font-black text-[#e50914]">350</p>
              <p className="text-[11px] text-zinc-400 font-medium">Điểm tích lũy</p>
            </div>
            <div className="bg-[#1c1c1f] border border-zinc-800 rounded-2xl p-3 text-center">
              <p className="text-lg sm:text-2xl font-black text-amber-400">VIP Gold</p>
              <p className="text-[11px] text-zinc-400 font-medium">Hạng thẻ</p>
            </div>
          </div>
        </div>

        {/* Section: Thanh Tab chức năng cá nhân */}
        <div className="flex items-center justify-center space-x-2 sm:space-x-4 border-b border-zinc-800/80 pb-2 max-w-xl mx-auto">
          <button
            onClick={() => setActiveTab('INFO')}
            type="button"
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'INFO'
                ? 'bg-[#e50914] text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            Thông tin
          </button>

          <button
            onClick={() => setActiveTab('TICKETS')}
            type="button"
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'TICKETS'
                ? 'bg-[#e50914] text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            Vé đã đặt
          </button>

          <button
            onClick={() => setActiveTab('VOUCHERS')}
            type="button"
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'VOUCHERS'
                ? 'bg-[#e50914] text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            Kho ưu đãi
          </button>
        </div>

        {/* Tab 1: Khối thông tin chi tiết (Khớp chuẩn UI/user.png) */}
        {activeTab === 'INFO' && (
          <div className="space-y-4 max-w-xl mx-auto animate-in fade-in duration-200">
            
            {/* Khối EMAIL */}
            <div className="bg-[#1c1c1f] border border-zinc-800/90 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center space-x-4 hover:border-zinc-700/80 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#e50914] flex-shrink-0 shadow-inner">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  EMAIL
                </p>
                <p className="text-sm sm:text-base font-semibold text-white truncate mt-0.5">
                  {emailDisplay}
                </p>
              </div>
            </div>

            {/* Khối SỐ ĐIỆN THOẠI */}
            <div className="bg-[#1c1c1f] border border-zinc-800/90 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center space-x-4 hover:border-zinc-700/80 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#e50914] flex-shrink-0 shadow-inner">
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  SỐ ĐIỆN THOẠI
                </p>
                <p className="text-sm sm:text-base font-semibold text-white truncate mt-0.5">
                  {phoneNumber}
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(true)}
                type="button"
                className="text-xs text-[#e50914] hover:underline font-semibold flex-shrink-0 cursor-pointer"
              >
                Thay đổi
              </button>
            </div>

            {/* Nút hành động bổ sung */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsEditModalOpen(true)}
                type="button"
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-4 rounded-2xl transition cursor-pointer flex items-center justify-center space-x-2 shadow-sm"
              >
                <Pencil className="w-4 h-4 text-zinc-300" />
                <span>Chỉnh sửa hồ sơ</span>
              </button>

              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                type="button"
                className="bg-red-950/30 hover:bg-red-900/40 text-red-400 hover:text-red-300 border border-red-800/40 font-bold py-3 px-6 rounded-2xl transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>

          </div>
        )}

        {/* Tab 2: Lịch sử vé đã đặt */}
        {activeTab === 'TICKETS' && (
          <div className="space-y-4 max-w-xl mx-auto animate-in fade-in duration-200">
            {USER_TICKETS.map((t) => (
              <div
                key={t.orderId}
                className="bg-[#1c1c1f] border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-2"
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="font-black text-[#e50914] text-base">
                    Đơn #{t.orderId}
                  </span>
                  <span className="bg-emerald-500 text-black text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {t.statusText}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Phim:</span>
                  <span className="text-white font-bold">{t.movieTitle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Suất chiếu:</span>
                  <span className="text-zinc-200">{t.showtime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Ghế:</span>
                  <span className="text-red-400 font-bold">{t.seats} ({t.room})</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-zinc-800/60">
                  <span className="text-zinc-400">Tổng thanh toán:</span>
                  <span className="text-[#e50914] font-black">{t.totalPrice}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Kho ưu đãi */}
        {activeTab === 'VOUCHERS' && (
          <div className="space-y-4 max-w-xl mx-auto animate-in fade-in duration-200">
            {USER_VOUCHERS.map((v) => (
              <div
                key={v.code}
                className="bg-[#1c1c1f] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-red-600/20 text-[#e50914] font-black text-sm border border-red-600/30">
                      {v.code}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">Hạn: {v.expiry}</span>
                  </div>
                  <p className="text-sm font-bold text-white mt-1">{v.title}</p>
                  <p className="text-xs text-zinc-400">{v.desc}</p>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(v.code);
                    alert(`Đã lưu mã ${v.code} vào bộ nhớ tạm!`);
                  }}
                  type="button"
                  className="bg-[#e50914] hover:bg-[#b80710] text-white text-xs font-bold py-2 px-3.5 rounded-xl transition cursor-pointer flex-shrink-0"
                >
                  Dùng ngay
                </button>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Modal Chỉnh sửa hồ sơ cá nhân */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#1c1c1f] border border-zinc-700 rounded-3xl p-6 shadow-2xl space-y-4">
            
            {/* Nút đóng */}
            <button
              onClick={() => setIsEditModalOpen(false)}
              type="button"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-black text-white">Chỉnh sửa thông tin cá nhân</h2>

            {editSuccessMsg && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-medium flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>{editSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="text-zinc-400 block mb-1 font-semibold">Tên hiển thị</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#e50914]"
                  required
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-semibold">Số điện thoại</label>
                <input
                  type="tel"
                  value={phoneNumber === 'Chưa cập nhật' ? '' : phoneNumber}
                  placeholder="Nhập số điện thoại (ví dụ: 0912345678)"
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#e50914]"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-semibold">Email (Không thể thay đổi)</label>
                <input
                  type="email"
                  value={emailDisplay}
                  disabled
                  className="w-full bg-zinc-900/60 border border-zinc-800 text-zinc-400 rounded-xl px-3.5 py-2.5 cursor-not-allowed"
                />
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#e50914] hover:bg-[#b80710] text-white font-bold py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-red-950/40"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 2. Messenger Floating Action Button */}
      <MessengerButton />

      {/* 3. Bottom Navigation Bar dạng nổi viên thuốc (Active vào mục "Thành Viên" khớp UI/user.png) */}
      <BottomNav activeId="membership" />
    </div>
  );
};

export default UserPage;

