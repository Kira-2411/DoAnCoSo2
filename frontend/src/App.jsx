import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import ShowtimePage from './pages/ShowtimePage';
import MoviePage from './pages/MoviePage';
import FoodPage from './pages/FoodPage';
import NewsPage from './pages/NewsPage';
import UserPage from './pages/UserPage';
import AdminPage from './pages/AdminPage';
import StaffPage from './pages/StaffPage';
import ProtectedRoute from './routes/ProtectedRoute';
import BottomNav from './components/BottomNav';

// Tự động cuộn lên đầu trang khi người dùng chuyển sang trang mới
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

// Toàn bộ 6 bước Đặt Vé (Booking Flow)
import { BookingProvider } from './contexts/BookingContext';
import BookingMoviePage from './pages/booking/BookingMoviePage';
import BookingShowtimePage from './pages/booking/BookingShowtimePage';
import BookingFoodPage from './pages/booking/BookingFoodPage';
import BookingSeatPage from './pages/booking/BookingSeatPage';
import BookingAcceptPage from './pages/booking/BookingAcceptPage';
import BookingPay from './pages/booking/BookingPay';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <BookingProvider>
        <Routes>
          {/* Tuyến đường công khai */}
          <Route path="/" element={<HomePage />} />
          <Route path="/showtimes" element={<ShowtimePage />} />
          <Route path="/movies" element={<MoviePage />} />
          <Route path="/food" element={<FoodPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/membership" element={<UserPage />} />
          <Route path="/user" element={<UserPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Tuyến đường luồng Đặt Vé (6 Bước) */}
          <Route path="/booking" element={<BookingMoviePage />} />
          <Route path="/booking/movie" element={<BookingMoviePage />} />
          <Route path="/booking/showtime" element={<BookingShowtimePage />} />
          <Route path="/booking/food" element={<BookingFoodPage />} />
          <Route path="/booking/seat" element={<BookingSeatPage />} />
          <Route path="/booking/accept" element={<BookingAcceptPage />} />
          <Route path="/booking/pay" element={<BookingPay />} />

          {/* Tuyến đường bảo vệ theo vai trò */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute roles={['STAFF', 'ADMIN']}>
                <StaffPage />
              </ProtectedRoute>
            }
          />

          {/* Chuyển hướng các đường dẫn không tồn tại về trang chủ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Thanh điều hướng chính nổi toàn cục (duy trì trên DOM để hiệu ứng trượt 100% mượt mà) */}
        <BottomNav />
      </BookingProvider>
    </BrowserRouter>
  );
}

export default App;
