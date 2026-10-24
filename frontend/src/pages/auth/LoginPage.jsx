import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth, getHomeRouteByRole } from '../../contexts/AuthContext';
import akashiLogo from '../../assets/images/Akashi.png';
import bgLogin from '../../assets/images/backgroundlogin.png';

const LoginPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nếu đã đăng nhập thì tự động chuyển về trang chủ theo vai trò
  useEffect(() => {
    if (user) {
      navigate(getHomeRouteByRole(user.role), { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const loggedUser = await login(email, password);
      const destination = getHomeRouteByRole(loggedUser.role);
      navigate(destination, { replace: true });
    } catch (err) {
      if (!err.response) {
        // Mất kết nối hoặc backend chưa chạy
        setError('Không thể kết nối máy chủ, vui lòng thử lại sau');
      } else if (err.response.data && err.response.data.message) {
        // Message lỗi chính xác do server trả về (BAD_CREDENTIALS, ACCOUNT_LOCKED, EMAIL_NOT_VERIFIED, ...)
        setError(err.response.data.message);
      } else {
        // Lỗi không xác định khác
        setError('Đã xảy ra lỗi, vui lòng thử lại sau');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat p-4"
      style={{ backgroundImage: `url(${bgLogin})` }}
    >
      {/* Lớp phủ tối mờ toàn trang như mockup */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" />

      {/* Thẻ đăng nhập kính mờ căn giữa */}
      <div className="relative z-10 w-full max-w-[440px] bg-black/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl">
        {/* Logo nhân vật chibi Akashi */}
        <div className="flex justify-center">
          <img
            src={akashiLogo}
            alt="Akashi Cinema"
            className="w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(229,9,20,0.4)]"
          />
        </div>

        {/* Tiêu đề */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mt-3 mb-1">
          Chào mừng bạn trở lại!
        </h1>
        <p className="text-sm text-zinc-400 text-center mb-6">
          Đăng nhập để trải nghiệm điện ảnh đỉnh cao
        </p>

        {/* Thông báo lỗi */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {/* Form đăng nhập */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ô nhập Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2"
            >
              NHẬP EMAIL DÙNG ĐỂ ĐĂNG KÝ TÀI KHOẢN
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              className="w-full bg-[#242424] border border-zinc-700/60 focus:border-[#e50914] focus:outline-none rounded-lg px-4 py-3 text-white placeholder-zinc-500 text-sm transition"
            />
          </div>

          {/* Ô nhập Mật khẩu */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="text-xs font-semibold text-zinc-400 uppercase tracking-wider"
              >
                MẬT KHẨU
              </label>
              {/* TODO: Nối tính năng Quên mật khẩu sau */}
              <button
                type="button"
                className="text-xs font-bold text-[#e50914] hover:text-red-500 uppercase tracking-wider transition cursor-pointer"
              >
                QUÊN MẬT KHẨU?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#242424] border border-zinc-700/60 focus:border-[#e50914] focus:outline-none rounded-lg px-4 py-3 pr-11 text-white placeholder-zinc-500 text-sm transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition p-1 cursor-pointer"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Nút Đăng nhập */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#e50914] hover:bg-[#b80710] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg transition tracking-wide text-sm flex items-center justify-center cursor-pointer shadow-lg shadow-red-950/30"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Đang xử lý...
                </>
              ) : (
                'ĐĂNG NHẬP'
              )}
            </button>
          </div>
        </form>

        {/* Dòng liên kết Đăng ký */}
        <div className="text-center text-xs sm:text-sm text-zinc-400 mt-6">
          Bạn chưa có tài khoản?{' '}
          {/* TODO: Nối tính năng Đăng ký sau */}
          <button
            type="button"
            className="text-[#e50914] font-bold hover:underline cursor-pointer"
          >
            Đăng ký ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
