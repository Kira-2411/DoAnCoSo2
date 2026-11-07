import React, { useState, useEffect } from 'react';
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
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';

import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import MessengerButton from '../components/MessengerButton';
import { useAuth } from '../contexts/AuthContext';
import userApi from '../api/userApi';
import newsApi from '../api/newsApi';

// Định dạng thời gian
const formatDateTime = (dateStr) => {
  if (!dateStr) return 'Đang cập nhật';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

const UserPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Tab con trong trang cá nhân: 'INFO' | 'TICKETS' | 'VOUCHERS'
  const [activeTab, setActiveTab] = useState('INFO');

  // Thông tin người dùng
  const [profile, setProfile] = useState(user);
  const [displayName, setDisplayName] = useState(user?.username || 'Gia Bảo');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');

  // Trạng thái modal chỉnh sửa thông tin
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState('');

  // Lịch sử vé và kho ưu đãi từ database
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  // Tải thông tin cá nhân từ backend
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const res = await userApi.getProfile();
        if (isMounted && res.data) {
          setProfile(res.data);
          setDisplayName(res.data.username || '');
          setPhoneNumber(res.data.phone || '');
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin cá nhân:', err);
      }
    };

    if (user) {
      fetchProfile();
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Tải danh sách vé khi chuyển sang tab TICKETS
  useEffect(() => {
    let isMounted = true;
    const fetchTickets = async () => {
      try {
        setLoadingTickets(true);
        const res = await userApi.getMyBookings({ page: 0, size: 20 });
        if (isMounted) {
          setTickets(res.data?.content || []);
        }
      } catch (err) {
        console.error('Lỗi khi tải lịch sử vé:', err);
        if (isMounted) {
          setTickets([]);
        }
      } finally {
        if (isMounted) {
          setLoadingTickets(false);
        }
      }
    };

    if (user && activeTab === 'TICKETS') {
      fetchTickets();
    }
    return () => {
      isMounted = false;
    };
  }, [user, activeTab]);

  // Tải danh sách voucher khuyến mãi khi chuyển sang tab VOUCHERS
  useEffect(() => {
    let isMounted = true;
    const fetchVouchers = async () => {
      try {
        setLoadingVouchers(true);
        const res = await newsApi.getActivePromotions();
        if (isMounted) {
          setVouchers(res.data || []);
        }
      } catch (err) {
        console.error('Lỗi khi tải voucher:', err);
        if (isMounted) {
          setVouchers([]);
        }
      } finally {
        if (isMounted) {
          setLoadingVouchers(false);
        }
      }
    };

    if (activeTab === 'VOUCHERS') {
      fetchVouchers();
    }
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  // Dữ liệu hiển thị
  const emailDisplay = profile?.email || user?.email || 'baonng.25it@vku.udn.vn';
  const roleDisplay = profile?.role ? `THÀNH VIÊN ${profile.role}` : (user?.role ? `THÀNH VIÊN ${user.role}` : 'THÀNH VIÊN ADMIN');

  // Lưu thông tin cá nhân lên database
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setEditErrorMsg('');
      setEditSuccessMsg('');

      const res = await userApi.updateProfile({
        username: displayName.trim(),
        phone: phoneNumber.trim(),
      });

      setProfile(res.data);
      setEditSuccessMsg('Cập nhật thông tin thành công!');
      setTimeout(() => {
        setEditSuccessMsg('');
        setIsEditModalOpen(false);
      }, 1200);
    } catch (err) {
      console.error('Lỗi khi cập nhật hồ sơ:', err);
      const msg = err.response?.data?.message || 'Cập nhật thất bại. Vui lòng kiểm tra lại số điện thoại!';
      setEditErrorMsg(msg);
    } finally {
      setSavingProfile(false);
    }
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
            {loadingTickets ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-400 bg-[#1c1c1f]/60 rounded-2xl border border-zinc-800">
                <Loader2 className="w-8 h-8 animate-spin text-[#e50914] mb-3" />
                <p className="text-sm font-medium">Đang tải lịch sử vé của bạn...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-[#1c1c1f] border border-zinc-800 rounded-2xl p-10 text-center text-zinc-400 space-y-3">
                <Ticket className="w-10 h-10 text-zinc-600 mx-auto" />
                <h3 className="text-base font-bold text-white">Bạn chưa có vé xem phim nào</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Hãy chọn phim yêu thích và đặt vé ngay để tận hưởng trải nghiệm điện ảnh đỉnh cao cùng Akashi Cinema!
                </p>
                <button
                  onClick={() => navigate('/movies')}
                  type="button"
                  className="mt-2 bg-[#e50914] hover:bg-[#b80710] text-white text-xs font-bold py-2.5 px-5 rounded-xl transition cursor-pointer shadow-md inline-flex items-center gap-1.5"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Khám phá phim đang chiếu</span>
                </button>
              </div>
            ) : (
              tickets.map((t) => {
                const isPaid = t.status === 'PAID';
                const statusText = isPaid ? 'Đã thanh toán' : (t.status === 'PENDING' ? 'Chờ thanh toán' : (t.status === 'CANCELLED' ? 'Đã hủy' : t.status));
                const badgeColor = isPaid ? 'bg-emerald-500 text-black' : (t.status === 'PENDING' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-300 border border-zinc-700');
                const seatList = Array.isArray(t.seats) ? t.seats.join(', ') : (t.seats || 'Chưa chọn ghế');
                const totalFormatted = (t.totalPrice || 0).toLocaleString('vi-VN') + ' đ';

                return (
                  <div
                    key={t.bookingId || t.bookingCode}
                    className="bg-[#1c1c1f] border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-2.5 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <span className="font-black text-[#e50914] text-base">
                        Đơn #{t.bookingCode || t.bookingId}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${badgeColor}`}>
                        {statusText}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Phim:</span>
                      <span className="text-white font-bold text-right">{t.movieTitle}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Suất chiếu:</span>
                      <span className="text-zinc-200">{formatDateTime(t.showtime)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Ghế & Phòng:</span>
                      <span className="text-red-400 font-bold">{seatList} ({t.roomName || 'Rạp Akashi'})</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t border-zinc-800/60">
                      <span className="text-zinc-400">Tổng thanh toán:</span>
                      <span className="text-[#e50914] font-black">{totalFormatted}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 3: Kho ưu đãi */}
        {activeTab === 'VOUCHERS' && (
          <div className="space-y-4 max-w-xl mx-auto animate-in fade-in duration-200">
            {loadingVouchers ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-400 bg-[#1c1c1f]/60 rounded-2xl border border-zinc-800">
                <Loader2 className="w-8 h-8 animate-spin text-[#e50914] mb-3" />
                <p className="text-sm font-medium">Đang tải mã ưu đãi từ hệ thống...</p>
              </div>
            ) : vouchers.length === 0 ? (
              <div className="bg-[#1c1c1f] border border-zinc-800 rounded-2xl p-10 text-center text-zinc-400 space-y-2">
                <Tag className="w-10 h-10 text-zinc-600 mx-auto" />
                <h3 className="text-base font-bold text-white">Chưa có mã ưu đãi</h3>
                <p className="text-xs text-zinc-500">Các chương trình khuyến mãi mới nhất sẽ được thông báo sớm!</p>
              </div>
            ) : (
              vouchers.map((v) => {
                const discountTitle = v.discountType === 'PERCENT'
                  ? `Giảm ${v.discountValue}% vé xem phim`
                  : `Giảm ${Number(v.discountValue).toLocaleString('vi-VN')} đ`;
                const conditionDesc = v.minOrderValue
                  ? `Áp dụng cho đơn từ ${Number(v.minOrderValue).toLocaleString('vi-VN')} đ`
                  : 'Áp dụng cho mọi đơn đặt vé trực tuyến';

                return (
                  <div
                    key={v.promoId || v.code}
                    className="bg-[#1c1c1f] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-lg hover:border-zinc-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-red-600/20 text-[#e50914] font-black text-sm border border-red-600/30">
                          {v.code}
                        </span>
                        <span className="text-xs text-zinc-400 font-medium">
                          Hạn: {v.expiryDate ? formatDateTime(v.expiryDate) : 'Vô thời hạn'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white mt-1">{discountTitle}</p>
                      <p className="text-xs text-zinc-400">{conditionDesc}</p>
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
                );
              })
            )}
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

            {editErrorMsg && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-medium flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editErrorMsg}</span>
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
                  value={phoneNumber}
                  placeholder="Nhập số điện thoại (ví dụ: 0912345678)"
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#e50914]"
                  required
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
                  disabled={savingProfile}
                  className="flex-1 bg-[#e50914] hover:bg-[#b80710] disabled:bg-red-900/60 text-white font-bold py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-red-950/40 flex items-center justify-center space-x-2"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Lưu thay đổi</span>
                  )}
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

