import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { useAuth, getHomeRouteByRole } from '../../contexts/AuthContext';
import { authApi } from '../../api/authApi';
import { validateEmail, validateNewPassword } from '../../utils/validators';
import bgLogin from '../../assets/images/backgroundlogin.png';

const ForgotPasswordPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Tham chiếu DOM để quản lý focus và trợ năng
  const emailInputRef = useRef(null);
  const otpInputRefs = useRef([]);
  const newPasswordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  // Dữ liệu biểu mẫu
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Ẩn/hiện mật khẩu
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Trạng thái giao diện
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Điều kiện để kích hoạt nút "Gửi mã": phải có email
  const canSendOtp = Boolean(email.trim());

  // Kiểm tra người dùng đã điền đủ 6 chữ số mã OTP chưa
  const isOtpFilled = otp.every((d) => d.trim() !== '') && otp.join('').length === 6;

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

  // Tự động focus sang ô Mật khẩu mới khi vừa nhập đủ 6 số OTP
  useEffect(() => {
    if (isOtpFilled && !newPassword) {
      newPasswordInputRef.current?.focus();
    }
  }, [isOtpFilled]);

  // Xử lý thay đổi từng ô mã xác minh (6 ô)
  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    const newOtp = [...otp];

    if (cleanVal.length > 1) {
      // Người dùng paste hoặc gõ nhiều số
      const digits = cleanVal.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || '';
      }
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
    } else {
      newOtp[index] = cleanVal;
      setOtp(newOtp);
      if (cleanVal && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }

    if (fieldErrors.code) {
      setFieldErrors((prev) => ({ ...prev, code: '' }));
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

    if (fieldErrors.code) {
      setFieldErrors((prev) => ({ ...prev, code: '' }));
    }
  };

  // Nút "Gửi mã" / "Gửi lại mã"
  const handleSendOtp = async () => {
    if (!canSendOtp || otpCountdown > 0 || isSendingOtp) return;
    setError('');
    setSuccessMessage('');

    const trimmedEmail = email.trim().toLowerCase();
    const emailErr = validateEmail(trimmedEmail);

    if (emailErr) {
      setFieldErrors((prev) => ({ ...prev, email: emailErr }));
      emailInputRef.current?.focus();
      return;
    }

    setIsSendingOtp(true);

    try {
      const res = await authApi.forgotPassword({ email: trimmedEmail });
      setOtpSent(true);
      setOtpCountdown(30); // Đếm ngược 30 giây
      setSuccessMessage(
        res.data?.message || 'Mã xác minh đã được gửi đến email của bạn nếu tài khoản tồn tại!'
      );
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Kiểm tra tính hợp lệ của toàn bộ form trước khi gửi
  const validateForm = () => {
    const trimmedEmail = email.trim();
    const emailErr = validateEmail(trimmedEmail);
    const passErr = validateNewPassword(newPassword);

    let confirmErr = '';
    if (!confirmPassword) {
      confirmErr = 'Vui lòng xác nhận mật khẩu';
    } else if (confirmPassword !== newPassword) {
      confirmErr = 'Mật khẩu xác nhận không khớp';
    }

    let byteErr = '';
    if (newPassword && new Blob([newPassword]).size > 72) {
      byteErr = 'Mật khẩu quá dài (tối đa 72 bytes)';
    }

    const fullOtp = otp.join('');
    let otpErr = '';
    if (fullOtp.length !== 6) {
      otpErr = 'Vui lòng nhập đủ 6 chữ số mã xác minh';
    }

    const errors = {
      email: emailErr || '',
      code: otpErr,
      newPassword: byteErr || passErr || '',
      confirmPassword: confirmErr,
    };

    setFieldErrors(errors);

    if (emailErr) {
      emailInputRef.current?.focus();
      return false;
    }
    if (otpErr) {
      const emptyIdx = otp.findIndex((d) => !d);
      otpInputRefs.current[emptyIdx !== -1 ? emptyIdx : 0]?.focus();
      return false;
    }
    if (byteErr || passErr) {
      newPasswordInputRef.current?.focus();
      return false;
    }
    if (confirmErr) {
      confirmPasswordInputRef.current?.focus();
      return false;
    }

    return true;
  };

  // Xử lý gửi form "Xác nhận →"
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!isOtpFilled) {
      setFieldErrors((prev) => ({
        ...prev,
        code: 'Vui lòng nhập đủ 6 chữ số mã xác minh để mở khóa đặt lại mật khẩu',
      }));
      const emptyIdx = otp.findIndex((d) => !d);
      otpInputRefs.current[emptyIdx !== -1 ? emptyIdx : 0]?.focus();
      return;
    }

    if (!validateForm()) return;

    if (!otpSent) {
      setError('Vui lòng nhấn "Gửi mã" để nhận mã xác minh qua email trước.');
      return;
    }

    setIsSubmitting(true);
    const trimmedEmail = email.trim().toLowerCase();
    const fullOtp = otp.join('');

    try {
      const res = await authApi.resetPassword({
        email: trimmedEmail,
        code: fullOtp,
        newPassword: newPassword,
      });

      setSuccessMessage(
        res.data?.message || 'Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...'
      );

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý lỗi API
  const handleApiError = (err) => {
    if (!err.response) {
      setError('Không thể kết nối máy chủ, vui lòng thử lại sau');
      return;
    }

    const data = err.response.data;
    if (data && data.code === 'INVALID_OTP') {
      setFieldErrors((prev) => ({
        ...prev,
        code: 'Mã xác minh không hợp lệ hoặc đã hết hạn',
      }));
      otpInputRefs.current[0]?.focus();
    } else if (data && data.code === 'OTP_EXPIRED') {
      setFieldErrors((prev) => ({
        ...prev,
        code: 'Mã xác minh đã hết hạn, vui lòng nhấn Gửi lại mã',
      }));
      otpInputRefs.current[0]?.focus();
    } else if (data && data.code === 'TOO_MANY_REQUESTS') {
      setError(data.message || 'Bạn thao tác quá nhanh, vui lòng chờ giây lát');
    } else if (data && data.code === 'VALIDATION_ERROR') {
      if (data.details && typeof data.details === 'object') {
        setFieldErrors((prev) => ({
          ...prev,
          email: data.details.email || '',
          code: data.details.code || '',
          newPassword: data.details.newPassword || data.details.password || '',
        }));
        if (data.details.code) {
          otpInputRefs.current[0]?.focus();
        } else if (data.details.newPassword || data.details.password) {
          newPasswordInputRef.current?.focus();
        }
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

      {/* Thẻ quên mật khẩu căn giữa */}
      <div className="relative z-10 w-full max-w-[480px] bg-black/65 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl">
        {/* Tên rạp và Huy hiệu xoay tròn */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-[#e50914] font-black text-sm sm:text-base tracking-widest uppercase mb-3">
            AKASHI CINEMA
          </span>

          <div className="w-14 h-14 rounded-full bg-[#e50914]/10 border border-[#e50914]/30 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(229,9,20,0.2)]">
            <RotateCcw className="w-6 h-6 text-[#e50914]" />
          </div>
        </div>

        {/* Tiêu đề & phụ đề */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mt-1 mb-2">
          QUÊN MẬT KHẨU
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 text-center mb-6 leading-relaxed">
          Nhập email của bạn để nhận mã xác minh và thiết lập lại mật khẩu mới cho tài khoản.
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

        {/* Form quên & đặt lại mật khẩu */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Ô 1: EMAIL (KÈM NÚT GỬI MÃ) */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
            >
              EMAIL
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                placeholder="email@example.com"
                autoComplete="email"
                aria-invalid={fieldErrors.email ? 'true' : 'false'}
                className={`w-full bg-[#242424] border ${
                  fieldErrors.email
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-zinc-700/60 focus:border-[#e50914]'
                } focus:outline-none rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 text-sm transition`}
              />
            </div>

            {/* Hàng dưới ô email: Lỗi sát bên trái, nút Gửi mã ở bên phải */}
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

          {/* Ô 2: MÃ XÁC MINH (6 Ô SỐ) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              MÃ XÁC MINH
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
                  aria-label={`Số thứ ${idx + 1} của mã xác minh`}
                  className={`w-11 h-12 sm:w-14 sm:h-13 text-center text-lg sm:text-xl font-bold bg-[#242424] border ${
                    fieldErrors.code
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-zinc-700/60 focus:border-[#e50914]'
                  } text-white focus:outline-none rounded-lg transition`}
                />
              ))}
            </div>
            {fieldErrors.code && (
              <p role="alert" className="text-xs text-red-400 mt-1.5">
                {fieldErrors.code}
              </p>
            )}
          </div>

          {/* Khung MẬT KHẨU MỚI & XÁC NHẬN MẬT KHẨU (Khóa khi chưa nhập đủ 6 số OTP) */}
          <div
            className={`transition-all duration-300 rounded-xl p-3.5 sm:p-4 space-y-3.5 border ${
              isOtpFilled
                ? 'bg-[#181818]/80 border-zinc-700/80'
                : 'bg-[#141414]/50 border-zinc-800/40 opacity-55'
            }`}
          >
            {/* Thanh thông báo trạng thái khóa / mở khóa */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                THIẾT LẬP MẬT KHẨU MỚI
              </span>
              <div className="flex items-center gap-1.5 text-xs">
                {isOtpFilled ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Đã mở khóa</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-zinc-500 text-[11px]">Nhập đủ 6 số OTP để mở khóa</span>
                  </>
                )}
              </div>
            </div>

            {/* Ô 3: MẬT KHẨU MỚI */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
              >
                MẬT KHẨU MỚI
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={newPasswordInputRef}
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  disabled={!isOtpFilled}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (fieldErrors.newPassword) {
                      setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
                    }
                  }}
                  placeholder={isOtpFilled ? '••••••••' : 'Đang tạm khóa...'}
                  autoComplete="new-password"
                  aria-invalid={fieldErrors.newPassword ? 'true' : 'false'}
                  className={`w-full bg-[#242424] border ${
                    fieldErrors.newPassword
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-zinc-700/60 focus:border-[#e50914]'
                  } disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none rounded-lg pl-10 pr-11 py-3 text-white placeholder-zinc-500 text-sm transition`}
                />
                <button
                  type="button"
                  disabled={!isOtpFilled}
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition p-1 cursor-pointer"
                  aria-label={showNewPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.newPassword && (
                <p role="alert" className="text-xs text-red-400 mt-1">
                  {fieldErrors.newPassword}
                </p>
              )}
            </div>

            {/* Ô 4: XÁC NHẬN MẬT KHẨU */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
              >
                XÁC NHẬN MẬT KHẨU
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={confirmPasswordInputRef}
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  disabled={!isOtpFilled}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  placeholder={isOtpFilled ? '••••••••' : 'Đang tạm khóa...'}
                  autoComplete="new-password"
                  aria-invalid={fieldErrors.confirmPassword ? 'true' : 'false'}
                  className={`w-full bg-[#242424] border ${
                    fieldErrors.confirmPassword
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-zinc-700/60 focus:border-[#e50914]'
                  } disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none rounded-lg pl-10 pr-11 py-3 text-white placeholder-zinc-500 text-sm transition`}
                />
                <button
                  type="button"
                  disabled={!isOtpFilled}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition p-1 cursor-pointer"
                  aria-label={
                    showConfirmPassword ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'
                  }
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p role="alert" className="text-xs text-red-400 mt-1">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Nút "Xác nhận →" (Màu đỏ giống nút Đăng nhập và Đăng ký) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !isOtpFilled}
              className="w-full bg-[#e50914] hover:bg-[#b80710] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg transition tracking-wide text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-950/30"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>Xác nhận</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Nút "Quay lại Đăng nhập" (Chữ màu đỏ theo yêu cầu) */}
        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-[#e50914] hover:text-red-400 font-bold transition flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
