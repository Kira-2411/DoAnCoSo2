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

/**
 * Kiểm tra độ dài tối đa của chuỗi.
 */
export const validateMaxLength = (value, maxLength, message) => {
  if (value && typeof value === 'string' && value.length > maxLength) {
    return message || `Không được vượt quá ${maxLength} ký tự`;
  }
  return null;
};

/**
 * Kiểm tra số nguyên dương.
 */
export const validatePositiveInteger = (value, message = 'Vui lòng nhập số nguyên dương') => {
  if (value === null || value === undefined || value === '') {
    return null; // Bỏ qua nếu rỗng, dùng validateRequired nếu bắt buộc
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    return message;
  }
  return null;
};

/**
 * Kiểm tra số nằm trong khoảng [min, max].
 */
export const validateNumberRange = (value, min, max, message) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    return message || `Giá trị phải nằm trong khoảng từ ${min} đến ${max}`;
  }
  return null;
};

/**
 * Kiểm tra định dạng đường dẫn ảnh.
 * Chấp nhận chuỗi bắt đầu bằng http://, https:// hoặc / (đường dẫn nội bộ).
 */
export const validateImageUrl = (value, message = 'Đường dẫn ảnh không hợp lệ (phải bắt đầu bằng http://, https:// hoặc /)') => {
  if (!value || typeof value !== 'string') {
    return null; // Không bắt buộc, dùng validateRequired nếu cần bắt buộc
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const isValid = trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/');
  if (!isValid) {
    return message;
  }
  return null;
};


