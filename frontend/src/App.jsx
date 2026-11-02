import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
