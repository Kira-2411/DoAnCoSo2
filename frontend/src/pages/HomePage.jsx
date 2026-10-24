import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#1f1f1f] border border-zinc-800 rounded-2xl p-8 text-center shadow-xl">
        <h1 className="text-2xl font-bold mb-4">🎬 Trang chủ (Customer)</h1>
        
        {user ? (
          <div className="space-y-4">
            <p className="text-zinc-300">
              Xin chào, <span className="font-semibold text-white">{user.username || user.email}</span>!
            </p>
            <p className="text-xs text-zinc-400">
              Vai trò: <span className="text-[#e50914] font-semibold">{user.role}</span>
            </p>
            <button
              onClick={logout}
              className="w-full bg-[#e50914] hover:bg-[#b80710] text-white font-bold py-2.5 px-4 rounded-lg transition cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-zinc-400 text-sm">
              Bạn đang duyệt với tư cách Khách vãng lai.
            </p>
            <Link
              to="/login"
              className="inline-block w-full bg-[#e50914] hover:bg-[#b80710] text-white font-bold py-2.5 px-4 rounded-lg transition text-center"
            >
              Đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
