import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Copy, 
  Check, 
  Tag, 
  Sparkles, 
  BadgeCheck, 
  Send,
  Ticket
} from 'lucide-react';

import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import MessengerButton from '../components/MessengerButton';
import heroBannerImg from '../assets/images/AnhBiaAkashiCinema.png';

// Dữ liệu bài viết tin tức và ưu đãi
const INITIAL_POSTS = [
  {
    id: 1,
    title: 'Ngày mới tốt lành',
    category: 'NEWS',
    categoryLabel: 'Tin rạp',
    time: '25/06/2026 08:28',
    content: 'Thời tiết hôm nay dễ chịu quá , phải làm 1 suất đi xem phim tại AKASHI CINEMA thôi các bạn uiiiiii',
    likesCount: 128,
    commentsCount: 18,
    isLiked: false,
    promoCode: null,
    image: null,
  },
  {
    id: 2,
    title: 'Bùng nổ ưu đãi cuối tuần - Giảm ngay 10% toàn bộ vé',
    category: 'PROMO',
    categoryLabel: 'Khuyến mãi',
    time: '22/06/2026 14:00',
    content: 'Đừng bỏ lỡ siêu ưu đãi dành riêng cho thành viên Akashi Cinema! Nhập mã GIAM10 khi thanh toán trực tuyến để được giảm ngay 10% cho đơn đặt vé từ 100.000 VNĐ. Áp dụng cho mọi suất chiếu thứ 6, thứ 7 và chủ nhật tuần này!',
    likesCount: 342,
    commentsCount: 56,
    isLiked: true,
    promoCode: 'GIAM10',
    promoDesc: 'Giảm 10% cho đơn từ 100.000đ',
    image: heroBannerImg,
  },
  {
    id: 3,
    title: 'Chúc mừng',
    category: 'NEWS',
    categoryLabel: 'Tin rạp',
    time: '19/05/2026 16:58',
    content: 'Các bộ phim cực hot đã cập bến AKASHI CINEMA , còn chần chừ gì mà không mua vé ngay !!!',
    likesCount: 215,
    commentsCount: 29,
    isLiked: false,
    promoCode: null,
    image: null,
  },
  {
    id: 4,
    title: 'Chào đón bạn mới - Giảm thẳng 20.000đ cho đơn từ 150.000đ',
    category: 'PROMO',
    categoryLabel: 'Khuyến mãi',
    time: '10/05/2026 09:15',
    content: 'Tặng ngay voucher giảm giá 20.000 VNĐ cho khách hàng đặt vé xem phim kèm combo bắp nước qua website chính thức. Nhanh tay lưu mã để cùng bạn bè thưởng thức những siêu phẩm điện ảnh đỉnh cao!',
    likesCount: 409,
    commentsCount: 72,
    isLiked: false,
    promoCode: 'GIAM20K',
    promoDesc: 'Giảm ngay 20.000đ cho đơn từ 150.000đ',
    image: null,
  },
  {
    id: 5,
    title: 'Chính thức khai trương cụm rạp Akashi Cinema Đà Nẵng',
    category: 'EVENT',
    categoryLabel: 'Sự kiện',
    time: '01/05/2026 10:00',
    content: 'Akashi Cinema tự hào ra mắt cụm rạp tiêu chuẩn quốc tế tại số 24 Phan Anh, Đà Nẵng với hệ thống âm thanh vòm sống động và màn chiếu Laser sắc nét đỉnh cao. Hàng ngàn phần quà bắp nước và móc khóa Akashi độc quyền đang chờ đón bạn ghé thăm!',
    likesCount: 520,
    commentsCount: 94,
    isLiked: false,
    promoCode: null,
    image: null,
  },
];

const CATEGORIES = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PROMO', label: 'Khuyến mãi & Voucher' },
  { id: 'NEWS', label: 'Tin điện ảnh' },
  { id: 'EVENT', label: 'Sự kiện rạp' },
];

const NewsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [copiedCode, setCopiedCode] = useState(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [commentInput, setCommentInput] = useState('');

  // Xử lý Thích bài viết
  const handleToggleLike = (postId) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const newLiked = !p.isLiked;
          return {
            ...p,
            isLiked: newLiked,
            likesCount: newLiked ? p.likesCount + 1 : p.likesCount - 1,
          };
        }
        return p;
      })
    );
  };

  // Sao chép mã giảm giá vào clipboard
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  // Lọc bài viết theo danh mục
  const filteredPosts = posts.filter((p) => {
    if (selectedCategory === 'ALL') return true;
    return p.category === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-red-600 selection:text-white pb-32">
      {/* 1. Header dùng chung */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        
        {/* Section: Tiêu đề trang (Khớp chuẩn UI/new.png) */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Tin tức & Ưu đãi
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl">
            Khám phá những ưu đãi độc quyền, tin tức điện ảnh mới nhất và các sự kiện đặc biệt tại Akashi Cinema. Thế giới điện ảnh nằm trong tầm tay bạn.
          </p>
        </div>

        {/* Section: Thanh lọc danh mục phong cách mạng xã hội */}
        <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                type="button"
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap shadow-sm ${
                  isSelected
                    ? 'bg-[#e50914] text-white shadow-md shadow-red-950/40'
                    : 'bg-[#1c1c1f] hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Section: News Feed (Dạng lướt Facebook / bảng tin) */}
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="bg-[#1c1c1f] border border-zinc-800/90 rounded-3xl p-5 sm:p-6 shadow-xl hover:border-zinc-700/80 transition-all duration-200 space-y-4"
            >
              {/* Header bài đăng: Avatar Akashi, Tên thương hiệu, Thời gian */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Avatar hình tròn màu đỏ chữ A (khớp UI/new.png) */}
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#e50914] text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-md select-none flex-shrink-0">
                    A
                  </div>

                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                        AKASHI CINEMA
                      </span>
                      <BadgeCheck className="w-4 h-4 text-sky-400 inline-block" />
                    </div>
                    <span className="text-xs text-zinc-400 font-medium">
                      {post.time}
                    </span>
                  </div>
                </div>

                {/* Huy hiệu loại tin */}
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                  {post.categoryLabel}
                </span>
              </div>

              {/* Tiêu đề bài viết */}
              <h2 className="text-base sm:text-lg font-black text-white hover:text-[#e50914] transition-colors">
                {post.title}
              </h2>

              {/* Nội dung bài đăng */}
              <p className="text-sm sm:text-base text-zinc-200 leading-relaxed whitespace-pre-line">
                {post.content}
              </p>

              {/* Hộp mã giảm giá Voucher (nếu có) */}
              {post.promoCode && (
                <div className="bg-gradient-to-r from-red-950/30 to-zinc-900 border border-red-600/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#e50914]/20 border border-[#e50914]/40 flex items-center justify-center text-[#e50914]">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Mã khuyến mãi độc quyền</p>
                      <p className="text-base sm:text-lg font-black text-white tracking-wider">
                        {post.promoCode}
                      </p>
                      <p className="text-xs text-emerald-400 font-medium">
                        {post.promoDesc}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyCode(post.promoCode)}
                    type="button"
                    className="flex items-center justify-center space-x-2 bg-[#e50914] hover:bg-[#b80710] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-md shadow-red-950/30 cursor-pointer self-start sm:self-auto"
                  >
                    {copiedCode === post.promoCode ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Đã lưu mã!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Sao chép mã</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Hình ảnh đính kèm bài viết (nếu có) */}
              {post.image && (
                <div className="rounded-2xl overflow-hidden border border-zinc-800">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-auto max-h-72 object-cover hover:scale-[1.01] transition-transform duration-300"
                  />
                </div>
              )}

              {/* Thống kê Like & Bình luận */}
              <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/60">
                <div className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#e50914] flex items-center justify-center text-[9px] text-white">
                    ❤️
                  </span>
                  <span>{post.likesCount} lượt thích</span>
                </div>
                <span>{post.commentsCount} bình luận</span>
              </div>

              {/* Nút tương tác phong cách Facebook: Thích, Bình luận, Chia sẻ */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80">
                
                {/* Nút Thích */}
                <button
                  onClick={() => handleToggleLike(post.id)}
                  type="button"
                  className={`flex items-center justify-center space-x-2 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    post.isLiked
                      ? 'text-[#e50914] bg-red-950/20'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                  <span>Thích</span>
                </button>

                {/* Nút Bình luận */}
                <button
                  onClick={() => setActiveCommentsPostId(activeCommentsPostId === post.id ? null : post.id)}
                  type="button"
                  className="flex items-center justify-center space-x-2 py-2 rounded-xl text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800/70 transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Bình luận</span>
                </button>

                {/* Nút Chia sẻ */}
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: post.title, text: post.content, url: window.location.href });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Đã sao chép liên kết bài viết!');
                    }
                  }}
                  type="button"
                  className="flex items-center justify-center space-x-2 py-2 rounded-xl text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800/70 transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Chia sẻ</span>
                </button>
              </div>

              {/* Khung bình luận khi mở ra */}
              {activeCommentsPostId === post.id && (
                <div className="pt-3 border-t border-zinc-800 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Viết bình luận của bạn..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e50914]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (commentInput.trim()) {
                          alert('Bình luận của bạn đã được gửi!');
                          setCommentInput('');
                        }
                      }}
                      className="w-8 h-8 rounded-full bg-[#e50914] text-white flex items-center justify-center hover:bg-[#b80710] transition cursor-pointer flex-shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

            </article>
          ))}
        </div>

      </main>

      {/* 2. Messenger Floating Action Button */}
      <MessengerButton />

      {/* 3. Bottom Navigation Bar dạng nổi viên thuốc (Active vào mục "Tin tức & Ưu đãi") */}
      <BottomNav activeId="news" />
    </div>
  );
};

export default NewsPage;

