import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth, getHomeRouteByRole } from '../../contexts/AuthContext';
import { validateEmail, validateRequired } from '../../utils/validators';
import akashiLogo from '../../assets/images/Akashi.png';
import bgLogin from '../../assets/images/backgroundlogin.png';

const LoginPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nếu đã đăng nhập thì tự động chuyển về trang chủ theo vai trò
  useEffect(() => {
    if (user) {
      navigate(getHomeRouteByRole(user.role), { replace: true });
    }
  }, [user, navigate]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: '' }));
    }
    if (error) {
      setError('');
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: '' }));
    }
    if (error) {
      setError('');
    }
  };

  const handleEmailBlur = () => {
    const emailErr = validateEmail(email);
    setFieldErrors((prev) => ({ ...prev, email: emailErr || '' }));
  };

  const handlePasswordBlur = () => {
    const passwordErr = validateRequired(password, 'Vui lòng nhập mật khẩu', false);
    setFieldErrors((prev) => ({ ...prev, password: passwordErr || '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Cắt khoảng trắng đầu cuối của email trước khi kiểm tra và gửi
    const trimmedEmail = email.trim();
    // KHÔNG trim mật khẩu, giữ nguyên vẹn
    const emailErr = validateEmail(trimmedEmail);
    const passwordErr = validateRequired(password, 'Vui lòng nhập mật khẩu', false);

    if (emailErr || passwordErr) {
      setFieldErrors({
        email: emailErr || '',
        password: passwordErr || '',
      });

      // Trợ năng: Đưa focus về ô lỗi đầu tiên
      if (emailErr) {
        emailInputRef.current?.focus();
      } else if (passwordErr) {
        passwordInputRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Chỉ gửi email đã trim, mật khẩu giữ nguyên văn
      const loggedUser = await login(trimmedEmail, password);
      const destination = getHomeRouteByRole(loggedUser.role);
      navigate(destination, { replace: true });
    } catch (err) {
      if (!err.response) {
        // Mất kết nối hoặc backend chưa chạy
        setError('Không thể kết nối máy chủ, vui lòng thử lại sau');
      } else {
        const data = err.response.data;
        if (data && data.code === 'VALIDATION_ERROR') {
          const details = data.details;
          if (details && typeof details === 'object' && Object.keys(details).length > 0) {
            const hasEmailErr = Boolean(details.email);
            const hasPasswordErr = Boolean(details.password);
            const hasUnknownKey = Object.keys(details).some(
              (key) => key !== 'email' && key !== 'password'
            );

            setFieldErrors({
              email: details.email || '',
              password: details.password || '',
            });

            // Focus vào ô lỗi đầu tiên
            if (hasEmailErr) {
              emailInputRef.current?.focus();
            } else if (hasPasswordErr) {
              passwordInputRef.current?.focus();
            }

            // Nếu có khóa lạ hoặc không có lỗi nào thuộc email/password thì hiện thông báo chung
            if (hasUnknownKey || (!hasEmailErr && !hasPasswordErr)) {
              setError(data.message || 'Dữ liệu gửi lên không hợp lệ');
            }
          } else {
            // Không có details thì hiển thị thông báo chung phía trên form
            setError(data.message || 'Dữ liệu gửi lên không hợp lệ');
          }
        } else if (data && data.message) {
          // Lỗi nghiệp vụ từ server (BAD_CREDENTIALS, ACCOUNT_LOCKED, ...)
          setError(data.message);
        } else {
          setError('Đã xảy ra lỗi, vui lòng thử lại sau');
        }
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

        {/* Thông báo lỗi chung từ server */}
        {error && (
          <div
            role="alert"
            className="mb-5 p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-red-200 text-sm text-center"
          >
            {error}
          </div>
        )}

        {/* Form đăng nhập */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Ô nhập Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2"
            >
              NHẬP EMAIL DÙNG ĐỂ ĐĂNG KÝ TÀI KHOẢN
            </label>
            <input
              ref={emailInputRef}
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              placeholder="example@email.com"
              autoComplete="email"
              aria-invalid={fieldErrors.email ? 'true' : 'false'}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              className={`w-full bg-[#242424] border ${
                fieldErrors.email
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-zinc-700/60 focus:border-[#e50914]'
              } focus:outline-none rounded-lg px-4 py-3 text-white placeholder-zinc-500 text-sm transition`}
            />
            {fieldErrors.email && (
              <p
                id="email-error"
                role="alert"
                className="text-xs text-red-400 mt-1.5"
              >
                {fieldErrors.email}
              </p>
            )}
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
                ref={passwordInputRef}
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={fieldErrors.password ? 'true' : 'false'}
                aria-describedby={
                  fieldErrors.password ? 'password-error' : undefined
                }
                className={`w-full bg-[#242424] border ${
                  fieldErrors.password
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-zinc-700/60 focus:border-[#e50914]'
                } focus:outline-none rounded-lg px-4 py-3 pr-11 text-white placeholder-zinc-500 text-sm transition`}
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
            {fieldErrors.password && (
              <p
                id="password-error"
                role="alert"
                className="text-xs text-red-400 mt-1.5"
              >
                {fieldErrors.password}
              </p>
            )}
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
