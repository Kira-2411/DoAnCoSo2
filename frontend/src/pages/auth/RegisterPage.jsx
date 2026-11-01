import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth, getHomeRouteByRole } from '../../contexts/AuthContext';
import { authApi } from '../../api/authApi';
import { validateEmail, validateRequired, validateNewPassword } from '../../utils/validators';
import akashiLogo from '../../assets/images/Akashi.png';
import bgLogin from '../../assets/images/backgroundlogin.png';

const RegisterPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Tham chiếu DOM để quản lý focus và trợ năng
  const usernameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const otpInputRefs = useRef([]);

  // Dữ liệu biểu mẫu
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);

  // Trạng thái giao diện
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    email: '',
    password: '',
    otp: '',
  });

  // Điều kiện để kích hoạt nút "Gửi mã": phải nhập cả Tên tài khoản và Email
  const canSendOtp = Boolean(username.trim() && email.trim());

  // Nếu người dùng đã đăng nhập, tự động chuyển về trang chủ theo vai trò
  useEffect(() => {
    if (user) {
      navigate(getHomeRouteByRole(user.role), { replace: true });
    }
  }, [user, navigate]);

  // Bộ đếm ngược thời gian gửi lại mã OTP (30 giây)
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Hàm xác thực mã OTP và kích hoạt tài khoản
  const verifyEmailCode = async (codeToVerify) => {
    if (isSubmitting) return;
    setError('');
    setSuccessMessage('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setFieldErrors((prev) => ({ ...prev, email: 'Vui lòng nhập email' }));
      emailInputRef.current?.focus();
      return;
    }

    if (!codeToVerify || codeToVerify.length !== 6) {
      setFieldErrors((prev) => ({
        ...prev,
        otp: 'Vui lòng nhập đủ 6 chữ số mã xác thực',
      }));
      return;
    }

    if (!otpSent) {
      setError('Vui lòng nhấn "Gửi mã" để nhận mã xác thực qua email trước.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.verifyEmail({
        email: trimmedEmail,
        code: codeToVerify,
      });

      setSuccessMessage('Đăng ký tài khoản thành công! Đang chuyển đến trang đăng nhập...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý thay đổi từng ô OTP (6 ô)
  const handleOtpChange = (index, value) => {
    // Chỉ cho phép nhập số
    const cleanVal = value.replace(/\D/g, '');
    const newOtp = [...otp];

    if (cleanVal.length > 1) {
      // Người dùng paste hoặc gõ nhanh chuỗi số
      const digits = cleanVal.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || '';
      }
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();

      // Nếu đã đủ 6 số và đã gửi mã OTP, tự động xác thực
      const fullCode = newOtp.join('');
      if (fullCode.length === 6 && otpSent) {
        verifyEmailCode(fullCode);
      }
    } else {
      newOtp[index] = cleanVal;
      setOtp(newOtp);
      if (cleanVal && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }

      // Khi điền đến ô cuối cùng (ô 6) và đủ 6 số, tự động xác thực
      const fullCode = newOtp.join('');
      if (fullCode.length === 6 && otpSent) {
        verifyEmailCode(fullCode);
      }
    }

    if (fieldErrors.otp) {
      setFieldErrors((prev) => ({ ...prev, otp: '' }));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || '';
    }
    setOtp(newOtp);
    const focusIdx = Math.min(pastedData.length, 5);
    otpInputRefs.current[focusIdx]?.focus();

    if (pastedData.length === 6 && otpSent) {
      verifyEmailCode(pastedData);
    }
    if (fieldErrors.otp) {
      setFieldErrors((prev) => ({ ...prev, otp: '' }));
    }
  };

  // Kiểm tra tính hợp lệ cơ bản của biểu mẫu
  const validateForm = () => {
    const trimmedEmail = email.trim();
    const userErr = validateRequired(username, 'Vui lòng nhập tên tài khoản');
    const emailErr = validateEmail(trimmedEmail);
    const passErr = validateNewPassword(password);

    const errors = {
      username: userErr || '',
      email: emailErr || '',
      password: passErr || '',
      otp: '',
    };

    setFieldErrors((prev) => ({ ...prev, ...errors }));

    if (userErr) {
      usernameInputRef.current?.focus();
      return false;
    }
    if (emailErr) {
      emailInputRef.current?.focus();
      return false;
    }
    if (passErr) {
      passwordInputRef.current?.focus();
      return false;
    }

    return true;
  };

  // Nút "Gửi mã" / "Gửi lại mã"
  const handleSendOtp = async () => {
    if (!canSendOtp || otpCountdown > 0 || isSendingOtp) return;
    setError('');
    setSuccessMessage('');

    // Kiểm tra tên tài khoản và email
    const trimmedEmail = email.trim().toLowerCase();
    const userErr = validateRequired(username, 'Vui lòng nhập tên tài khoản');
    const emailErr = validateEmail(trimmedEmail);

    if (userErr) {
      setFieldErrors((prev) => ({ ...prev, username: userErr }));
      usernameInputRef.current?.focus();
      return;
    }
    if (emailErr) {
      setFieldErrors((prev) => ({ ...prev, email: emailErr }));
      emailInputRef.current?.focus();
      return;
    }

    // Lần đầu gửi mã: backend tạo user và cần cả mật khẩu hợp lệ
    if (!otpSent) {
      const passErr = validateNewPassword(password);
      if (passErr) {
        setFieldErrors((prev) => ({ ...prev, password: passErr }));
        passwordInputRef.current?.focus();
        return;
      }
    }

    setIsSendingOtp(true);

    try {
      if (!otpSent) {
        // Lần đầu gửi mã: gọi API đăng ký (tạo user và gửi OTP)
        await authApi.register({
          username: username.trim(),
          email: trimmedEmail,
          password: password,
        });
      } else {
        // Đã gửi mã trước đó: gọi API gửi lại mã
        await authApi.resendOtp({
          email: trimmedEmail,
          purpose: 'REGISTER',
        });
      }

      setOtpSent(true);
      setOtpCountdown(30); // Đếm ngược 30 giây
      setSuccessMessage('Mã xác thực 6 chữ số đã được gửi đến email của bạn!');
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Xử lý khi nhấn nút "ĐĂNG KÝ"
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateForm()) return;

    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setFieldErrors((prev) => ({
        ...prev,
        otp: 'Vui lòng nhập đủ 6 chữ số mã xác thực',
      }));
      if (!otpSent) {
        setError('Vui lòng nhấn "Gửi mã" để nhận mã xác thực qua email trước.');
      } else {
        const emptyIndex = otp.findIndex((d) => !d);
        otpInputRefs.current[emptyIndex !== -1 ? emptyIndex : 0]?.focus();
      }
      return;
    }

    verifyEmailCode(fullOtp);
  };

  // Xử lý chuẩn hóa lỗi từ server
  const handleApiError = (err) => {
    if (!err.response) {
      setError('Không thể kết nối máy chủ, vui lòng thử lại sau');
      return;
    }

    const data = err.response.data;
    if (data && data.code === 'EMAIL_EXISTS') {
      setFieldErrors((prev) => ({
        ...prev,
        email: 'Email này đã tồn tại trên hệ thống',
      }));
      emailInputRef.current?.focus();
    } else if (data && data.code === 'INVALID_OTP') {
      setFieldErrors((prev) => ({
        ...prev,
        otp: 'Mã xác thực không hợp lệ hoặc đã hết hạn',
      }));
      otpInputRefs.current[0]?.focus();
    } else if (data && data.code === 'OTP_EXPIRED') {
      setFieldErrors((prev) => ({
        ...prev,
        otp: 'Mã xác thực đã hết hạn, vui lòng nhấn Gửi lại mã',
      }));
    } else if (data && data.code === 'TOO_MANY_REQUESTS') {
      setError(data.message || 'Bạn thao tác quá nhanh, vui lòng chờ giây lát');
    } else if (data && data.code === 'VALIDATION_ERROR') {
      if (data.details && typeof data.details === 'object') {
        setFieldErrors((prev) => ({
          ...prev,
          username: data.details.username || '',
          email: data.details.email || '',
          password: data.details.password || '',
          otp: data.details.code || '',
        }));
      } else {
        setError(data.message || 'Dữ liệu gửi lên không hợp lệ');
      }
    } else if (data && data.message) {
      setError(data.message);
    } else {
      setError('Đã xảy ra lỗi, vui lòng thử lại sau');
    }
  };

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat p-4 sm:p-6"
      style={{ backgroundImage: `url(${bgLogin})` }}
    >
      {/* Lớp phủ tối mờ toàn trang */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" />

      {/* Thẻ đăng ký căn giữa */}
      <div className="relative z-10 w-full max-w-[480px] bg-black/65 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl">
        {/* Tên rạp và Logo */}
        <div className="flex flex-col items-center justify-center">
          <img
            src={akashiLogo}
            alt="Akashi Cinema"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_0_15px_rgba(229,9,20,0.4)] mb-1"
          />
          <span className="text-[#e50914] font-black text-sm sm:text-base tracking-widest uppercase">
            AKASHI CINEMA
          </span>
        </div>

        {/* Tiêu đề & phụ đề */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mt-3 mb-1">
          Tạo tài khoản mới
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 text-center mb-6">
          Bắt đầu hành trình điện ảnh của bạn
        </p>

        {/* Thông báo lỗi chung */}
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-red-200 text-xs sm:text-sm text-center"
          >
            {error}
          </div>
        )}

        {/* Thông báo thành công */}
        {successMessage && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm flex items-center justify-center gap-2 text-center"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form đăng ký */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Ô 1: TÊN TÀI KHOẢN */}
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
            >
              TÊN TÀI KHOẢN
            </label>
            <input
              ref={usernameInputRef}
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (fieldErrors.username) {
                  setFieldErrors((prev) => ({ ...prev, username: '' }));
                }
              }}
              placeholder="Nhập tên của bạn"
              autoComplete="name"
              aria-invalid={fieldErrors.username ? 'true' : 'false'}
              className={`w-full bg-[#242424] border ${
                fieldErrors.username
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-zinc-700/60 focus:border-[#e50914]'
              } focus:outline-none rounded-lg px-4 py-3 text-white placeholder-zinc-500 text-sm transition`}
            />
            {fieldErrors.username && (
              <p role="alert" className="text-xs text-red-400 mt-1">
                {fieldErrors.username}
              </p>
            )}
          </div>

          {/* Ô 2: EMAIL (KÈM NÚT GỬI MÃ) */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
            >
              EMAIL
            </label>
            <input
              ref={emailInputRef}
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: '' }));
                }
              }}
              placeholder="example@gmail.com"
              autoComplete="email"
              aria-invalid={fieldErrors.email ? 'true' : 'false'}
              className={`w-full bg-[#242424] border ${
                fieldErrors.email
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-zinc-700/60 focus:border-[#e50914]'
              } focus:outline-none rounded-lg px-4 py-3 text-white placeholder-zinc-500 text-sm transition`}
            />

            {/* Hàng ngay dưới ô input: Lỗi email sát bên trái, nút Gửi mã ở bên phải */}
            <div className="flex items-center justify-between mt-1 min-h-[30px]">
              <div className="flex-1 pr-2">
                {fieldErrors.email && (
                  <p role="alert" className="text-xs text-red-400">
                    {fieldErrors.email}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={!canSendOtp || isSendingOtp || otpCountdown > 0}
                className={`shrink-0 px-3.5 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                  canSendOtp && otpCountdown === 0 && !isSendingOtp
                    ? 'bg-[#2a2a2a] hover:bg-[#333] text-[#e50914] border border-[#e50914]/40 hover:border-[#e50914] cursor-pointer'
                    : 'bg-[#1e1e1e] text-zinc-500 border border-zinc-800 opacity-50 cursor-not-allowed'
                }`}
              >
                {isSendingOtp && <Loader2 className="w-3 h-3 animate-spin" />}
                {otpCountdown > 0
                  ? `Gửi lại (${otpCountdown}s)`
                  : otpSent
                  ? 'Gửi lại mã'
                  : 'Gửi mã'}
              </button>
            </div>
          </div>

          {/* Ô 3: MẬT KHẨU (ĐÃ DI CHUYỂN LÊN TRÊN MÃ XÁC THỰC) */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
            >
              MẬT KHẨU
            </label>
            <div className="relative">
              <input
                ref={passwordInputRef}
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }
                }}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={fieldErrors.password ? 'true' : 'false'}
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
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p role="alert" className="text-xs text-red-400 mt-1">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Ô 4: MÃ XÁC THỰC (6 Ô SỐ) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              MÃ XÁC THỰC
            </label>
            <div
              className="flex items-center justify-between gap-1.5 sm:gap-2.5"
              onPaste={handleOtpPaste}
            >
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  placeholder="0"
                  aria-label={`Số thứ ${idx + 1} của mã xác thực`}
                  className={`w-11 h-12 sm:w-14 sm:h-13 text-center text-lg sm:text-xl font-bold bg-[#242424] border ${
                    fieldErrors.otp
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-zinc-700/60 focus:border-[#e50914]'
                  } text-white focus:outline-none rounded-lg transition`}
                />
              ))}
            </div>
            {fieldErrors.otp && (
              <p role="alert" className="text-xs text-red-400 mt-1.5">
                {fieldErrors.otp}
              </p>
            )}
          </div>

          {/* Nút ĐĂNG KÝ (Màu đỏ giống nút Đăng nhập ở trang Login) */}
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
                'ĐĂNG KÝ'
              )}
            </button>
          </div>
        </form>

        {/* Dòng chuyển về Đăng nhập (chữ "Đăng nhập" chỉnh thành màu đỏ) */}
        <div className="text-center text-xs sm:text-sm text-zinc-400 mt-6">
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            className="text-[#e50914] font-bold hover:underline cursor-pointer ml-1"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
