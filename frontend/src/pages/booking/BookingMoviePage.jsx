import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';
import MessengerButton from '../../components/MessengerButton';
import BookingStepper from '../../components/booking/BookingStepper';
import { useBooking } from '../../contexts/BookingContext';
import { Check, Star, Clock, Calendar, ArrowRight } from 'lucide-react';

const MOCK_MOVIES = [
  {
    id: 1,
    title: 'HELLO',
    format: '2D - dd',
    ageRating: 'T18',
    duration: '120 phút',
    genre: 'Kinh dị, Giật gân',
    releaseDate: '01/11/2026',
    rating: 8.8,
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
    synopsis: 'Một trải nghiệm rùng rợn và hồi hộp đến nghẹt thở theo phong cách điện ảnh kinh điển.'
  },
  {
    id: 2,
    title: 'HÀNH TINH CÁT: PHẦN 2',
    format: '2D / IMAX',
    ageRating: 'T16',
    duration: '166 phút',
    genre: 'Khoa học viễn tưởng, Phiêu lưu',
    releaseDate: '15/10/2026',
    rating: 9.2,
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    synopsis: 'Hành trình huyền thoại của Paul Atreides khi anh hợp lực cùng Chani và tộc Fremen.'
  },
  {
    id: 3,
    title: 'QUẬT MỘ TRÙNG MA',
    format: '2D - Lồng tiếng',
    ageRating: 'T18',
    duration: '134 phút',
    genre: 'Kinh dị, Bí ẩn',
    releaseDate: '20/10/2026',
    rating: 8.5,
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    synopsis: 'Hai pháp sư và một chuyên gia phong thủy giải mã bí ẩn về ngôi mộ cổ tại một ngôi làng hẻo lánh.'
  },
  {
    id: 4,
    title: 'VÂY HÃM: KẺ ĐỐI ĐẦU',
    format: '2D - Phụ đề',
    ageRating: 'T18',
    duration: '109 phút',
    genre: 'Hành động, Tội phạm',
    releaseDate: '25/10/2026',
    rating: 8.3,
    poster: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&auto=format&fit=crop&q=80',
    synopsis: 'Cảnh sát quái vật Ma Seok-do đối đầu với một tổ chức tội phạm xuyên quốc gia.'
  }
];

const BookingMoviePage = () => {
  const navigate = useNavigate();
  const { selectedMovie, setSelectedMovie } = useBooking();
  const [activeTab, setActiveTab] = useState('NOW_SHOWING'); // 'NOW_SHOWING' | 'COMING_SOON'

  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie);
  };

  const handleNext = () => {
    if (!selectedMovie) {
      alert('Vui lòng chọn một bộ phim để tiếp tục!');
      return;
    }
    navigate('/booking/showtime');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col pb-28">
      {/* 1. Header dùng chung */}
      <Header />

      {/* 2. Stepper tiến trình (Bước 1 active) */}
      <BookingStepper currentStep={1} showTimer={false} />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 w-full flex-1">
        {/* Top Control Bar: Tabs & Nút Tiếp Theo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
          {/* Tabs Filter */}
          <div className="flex items-center gap-6 sm:gap-8">
            <button
              onClick={() => setActiveTab('NOW_SHOWING')}
              className={`text-lg sm:text-xl font-bold uppercase transition-colors relative pb-2 ${
                activeTab === 'NOW_SHOWING'
                  ? 'text-[#e50914]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              PHIM ĐANG CHIẾU
              {activeTab === 'NOW_SHOWING' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#e50914] rounded-full shadow-[0_0_10px_rgba(229,9,20,0.8)]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('COMING_SOON')}
              className={`text-lg sm:text-xl font-bold uppercase transition-colors relative pb-2 ${
                activeTab === 'COMING_SOON'
                  ? 'text-[#e50914]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              PHIM SẮP CHIẾU
              {activeTab === 'COMING_SOON' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#e50914] rounded-full shadow-[0_0_10px_rgba(229,9,20,0.8)]" />
              )}
            </button>
          </div>

          {/* Nút Tiếp Theo (Yêu cầu màu đỏ theo thiết kế) */}
          <div className="flex justify-end">
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 bg-[#e50914] hover:bg-[#b80710] active:scale-95 text-white font-bold px-7 py-2.5 rounded-full shadow-[0_4px_20px_rgba(229,9,20,0.4)] transition-all duration-200"
            >
              <span>Tiếp theo</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Danh sách phim */}
        {activeTab === 'NOW_SHOWING' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {MOCK_MOVIES.map((movie) => {
              const isSelected = selectedMovie?.id === movie.id;

              return (
                <div
                  key={movie.id}
                  onClick={() => handleSelectMovie(movie)}
                  className={`group relative bg-zinc-900/80 rounded-2xl overflow-hidden border cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                    isSelected
                      ? 'border-[#e50914] shadow-[0_0_25px_rgba(229,9,20,0.45)] ring-2 ring-red-500/50'
                      : 'border-zinc-800/80 hover:border-zinc-600'
                  }`}
                >
                  {/* Poster Thumbnail */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Age Rating Badge */}
                    <span className="absolute top-3 left-3 bg-[#e50914] text-white text-xs font-black px-2.5 py-1 rounded-md shadow-md uppercase">
                      {movie.ageRating}
                    </span>

                    {/* Selected Checkmark Indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-lg shadow-red-950/80 animate-in zoom-in-50 duration-200">
                        <Check className="w-5 h-5 stroke-[3]" />
                      </div>
                    )}

                    {/* Rating Pill */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                      <span>{movie.rating}</span>
                    </div>
                  </div>

                  {/* Movie Info */}
                  <div className="p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-base line-clamp-1 group-hover:text-red-400 transition-colors uppercase">
                        {movie.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-400">
                        <span className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          {movie.format}
                        </span>
                        <span>•</span>
                        <span>{movie.genre}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{movie.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{movie.releaseDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center text-zinc-400">
            <p className="text-lg">Danh sách phim sắp chiếu sẽ sớm được cập nhật!</p>
          </div>
        )}
      </main>

      {/* 3. Floating Messenger Button */}
      <MessengerButton />

      {/* 4. Bottom Navigation Bar */}
      <BottomNav activeId="booking" />
    </div>
  );
};

export default BookingMoviePage;

