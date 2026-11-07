import React, { useState, useEffect } from 'react';
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
  Ticket,
  Loader2,
  Newspaper
} from 'lucide-react';

import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import MessengerButton from '../components/MessengerButton';
import heroBannerImg from '../assets/images/AnhBiaAkashiCinema.png';
import newsApi from '../api/newsApi';

// Định dạng thời gian
const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
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

const CATEGORIES = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PROMO', label: 'Khuyến mãi & Voucher' },
  { id: 'NEWS', label: 'Tin điện ảnh' },
  { id: 'EVENT', label: 'Sự kiện rạp' },
];

const NewsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [commentInput, setCommentInput] = useState('');

  // Tải tin tức và khuyến mãi từ database
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [newsRes, promoRes] = await Promise.allSettled([
          newsApi.getNews({ page: 0, size: 20 }),
          newsApi.getActivePromotions(),
        ]);

        const combined = [];

        // 1. Khuyến mãi từ database
        if (promoRes.status === 'fulfilled' && Array.isArray(promoRes.value.data)) {
          promoRes.value.data.forEach((p) => {
            const discountLabel = p.discountType === 'PERCENT'
              ? `Giảm ${p.discountValue}%`
              : `Giảm ${Number(p.discountValue).toLocaleString('vi-VN')} đ`;
            const minCondition = p.minOrderValue
              ? ` cho đơn từ ${Number(p.minOrderValue).toLocaleString('vi-VN')} đ`
              : '';

            combined.push({
              id: `promo-${p.promoId}`,
              title: `Bùng nổ ưu đãi: Mã ${p.code} - ${discountLabel}`,
              category: 'PROMO',
              categoryLabel: 'Khuyến mãi',
              time: p.expiryDate ? `Hạn dùng đến ${formatDateTime(p.expiryDate)}` : 'Đang diễn ra',
              content: `Nhập mã ${p.code} khi thanh toán trực tuyến để nhận ngay ưu đãi ${discountLabel}${minCondition}. Áp dụng cho mọi suất chiếu tại cụm rạp Akashi Cinema!`,
              likesCount: 342,
              commentsCount: 56,
              isLiked: false,
              promoCode: p.code,
              promoDesc: `${discountLabel}${minCondition}`,
              image: heroBannerImg,
            });
          });
        }

        // 2. Tin tức từ database
        if (newsRes.status === 'fulfilled') {
          const newsList = newsRes.value.data?.content || newsRes.value.data || [];
          if (Array.isArray(newsList)) {
            newsList.forEach((n) => {
              combined.push({
                id: `news-${n.newsId}`,
                title: n.title,
                category: 'NEWS',
                categoryLabel: 'Tin rạp',
                time: formatDateTime(n.createdAt) || 'Vừa xong',
                content: n.content,
                likesCount: 128,
                commentsCount: 18,
                isLiked: false,
                promoCode: null,
                image: n.imageUrl || null,
              });
            });
          }
        }

        if (isMounted) {
          setPosts(combined);
        }
      } catch (err) {
        console.error('Lỗi khi tải tin tức và khuyến mãi:', err);
        if (isMounted) {
          setPosts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400 bg-[#1c1c1f]/40 rounded-3xl border border-zinc-800">
              <Loader2 className="w-8 h-8 animate-spin text-[#e50914] mb-3" />
              <p className="text-sm font-medium">Đang tải tin tức và ưu đãi mới nhất...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-[#1c1c1f]/80 border border-zinc-800/90 rounded-3xl p-12 text-center text-zinc-400 space-y-2">
              <Newspaper className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">Chưa có bài viết nào</h3>
              <p className="text-xs text-zinc-500">Các chương trình ưu đãi và tin tức mới nhất sẽ sớm được cập nhật!</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
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
          ))
        )}
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

