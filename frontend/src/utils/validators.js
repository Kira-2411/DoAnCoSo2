/**
 * Bộ kiểm tra dữ liệu (validators) dùng chung cho hệ thống xác thực.
 */

/**
 * Kiểm tra trường bắt buộc.
 * @param {*} value - Giá trị cần kiểm tra
 * @param {string} [message='Trường này không được để trống'] - Thông báo lỗi
 * @param {boolean} [trim=true] - Có cắt khoảng trắng hay không (mặc định true)
 * @returns {string|null} - Thông báo lỗi nếu không hợp lệ, null nếu hợp lệ
 */
export const validateRequired = (
  value,
  message = 'Trường này không được để trống',
  trim = true
) => {
  if (value === null || value === undefined) {
    return message;
  }
  if (typeof value === 'string') {
    const checkValue = trim ? value.trim() : value;
    if (checkValue === '') {
      return message;
    }
  }
  return null;
};

/**
 * Kiểm tra định dạng và tính bắt buộc của email.
 * Cắt khoảng trắng đầu cuối trước khi kiểm tra.
 * @param {string} value - Email cần kiểm tra
 * @returns {string|null} - Thông báo lỗi nếu không hợp lệ, null nếu hợp lệ
 */
export const validateEmail = (value) => {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    return 'Vui lòng nhập email';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return 'Email không đúng định dạng';
  }
  return null;
};

/**
 * Kiểm tra mật khẩu mới theo quy tắc BR-AUTH-02:
 * Tối thiểu 8 ký tự, có ít nhất một chữ và một số.
 * Dùng cho đăng ký và đổi mật khẩu, KHÔNG dùng ở trang đăng nhập.
 * @param {string} value - Mật khẩu mới
 * @returns {string|null} - Thông báo lỗi nếu không hợp lệ, null nếu hợp lệ
 */
export const validateNewPassword = (value) => {
  if (!value) {
    return 'Vui lòng nhập mật khẩu';
  }
  if (value.length < 8) {
    return 'Mật khẩu phải có tối thiểu 8 ký tự';
  }
  const hasLetter = /[a-zA-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  if (!hasLetter || !hasNumber) {
    return 'Mật khẩu phải chứa ít nhất một chữ cái và một số';
  }
  return null;
};

