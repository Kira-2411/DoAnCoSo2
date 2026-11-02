import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Film, 
  Clock, 
  Calendar, 
  Ticket, 
  Info, 
  Sparkles, 
  X,
  Play
} from 'lucide-react';

import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import MessengerButton from '../components/MessengerButton';

// Dữ liệu phim đang chiếu
const NOW_SHOWING_MOVIES = [
  {
    id: 1,
    title: 'Hành Trình Về Phía Biển',
    genre: 'Tâm lý, Gia đình',
    duration: '120 phút',
    ageLimit: 'P',
    ageColor: 'bg-emerald-600',
    rating: '9.4',
    releaseDate: '18/10/2026',
    description: 'Hai anh em đi dọc miền Trung để tìm lại ngôi nhà tuổi thơ và hàn gắn những vết thương quá khứ.',
    director: 'Nguyễn Quang Dũng',
    cast: 'Thái Hòa, Kaity Nguyễn, Kiều Minh Tuấn',
    gradient: 'from-blue-900 via-indigo-950 to-neutral-950',
  },
  {
    id: 2,
    title: 'Thám Tử Phố Cổ',
    genre: 'Hình sự, Bí ẩn',
    duration: '105 phút',
    ageLimit: 'T16',
    ageColor: 'bg-amber-600',
    rating: '9.1',
    releaseDate: '22/10/2026',
    description: 'Một vụ mất tích bí ẩn giữa những con phố cổ Hà Nội về đêm dẫn đến chuỗi âm mưu nguy hiểm.',
    director: 'Victor Vũ',
    cast: 'Quang Sự, Quốc Cường, Lan Phương',
    gradient: 'from-amber-950 via-stone-900 to-neutral-950',
  },
  {
    id: 3,
    title: 'Đêm Cuối Ở Hội An',
    genre: 'Lãng mạn, Hài',
    duration: '130 phút',
    ageLimit: 'T13',
    ageColor: 'bg-rose-600',
    rating: '8.9',
    releaseDate: '26/10/2026',
    description: 'Chuyến du lịch cuối năm của nhóm bạn thân đưa họ vào những tình huống dở khóc dở cười và định mệnh bất ngờ.',
    director: 'Phan Gia Nhật Linh',
    cast: 'Nhan Phúc Vinh, Diệu Nhi, Anh Tú',
    gradient: 'from-rose-950 via-pink-950 to-neutral-950',
  },
  {
    id: 4,
    title: 'Bóng Rổ Đường Phố',
    genre: 'Thể thao, Nhiệt huyết',
    duration: '110 phút',
    ageLimit: 'P',
    ageColor: 'bg-emerald-600',
    rating: '9.3',
    releaseDate: '28/10/2026',
    description: 'Cuộc so tài nảy lửa giữa những đội bóng phong trào nhằm bảo vệ sân tập cộng đồng của khu phố nghèo.',
    director: 'Lê Thanh Sơn',
    cast: 'B Trần, Avin Lu, Hoàng Yến Chibi',
    gradient: 'from-orange-950 via-amber-950 to-neutral-950',
  },
  {
    id: 5,
    title: 'Bản Giao Hưởng Địa Cầu',
    genre: 'Khoa học, Giả tưởng',
    duration: '145 phút',
    ageLimit: 'T13',
    ageColor: 'bg-rose-600',
    rating: '9.5',
    releaseDate: '30/10/2026',
    description: 'Khi Trái Đất đứng trước bờ vực suy thoái khí quyển, các nhà khoa học mở ra cánh cổng không gian tìm kiếm nguồn sống mới.',
    director: 'Christopher Nolan (Phụ đề)',
    cast: 'Matthew McConaughey, Anne Hathaway',
    gradient: 'from-cyan-950 via-slate-900 to-neutral-950',
  },
];

// Dữ liệu phim sắp chiếu
const COMING_SOON_MOVIES = [
  {
    id: 6,
    title: 'Tiếng Gọi Từ Rừng Sâu',
    genre: 'Phiêu lưu, Kịch tính',
    duration: '115 phút',
    ageLimit: 'T13',
    ageColor: 'bg-rose-600',
    rating: 'Chờ đón',
    releaseDate: '15/11/2026',
    description: 'Đoàn thám hiểm lạc vào cánh rừng nhiệt đới không có trên bản đồ và phát hiện bí mật sinh học kỳ vĩ.',
    director: 'Charlie Nguyễn',
    cast: 'Johnny Trí Nguyễn, Suboi, Dustin Nguyễn',
    gradient: 'from-emerald-950 via-teal-950 to-neutral-950',
  },
  {
    id: 7,
    title: 'Mùa Hè Cuối Cùng',
    genre: 'Học đường, Thanh xuân',
    duration: '98 phút',
    ageLimit: 'P',
    ageColor: 'bg-emerald-600',
    rating: 'Chờ đón',
    releaseDate: '22/11/2026',
    description: 'Câu chuyện tình bạn trong trẻo và những ước mơ hoài bão trước ngưỡng cửa rời ghế nhà trường.',
    director: 'Vũ Ngọc Phượng',
    cast: 'Jun Phạm, Khả Ngân, Hoàng Hà',
    gradient: 'from-sky-950 via-indigo-950 to-neutral-950',
  },
  {
    id: 8,
    title: 'Chiến Binh Ánh Sáng',
    genre: 'Hành động, Viễn tưởng',
    duration: '135 phút',
    ageLimit: 'T16',
    ageColor: 'bg-amber-600',
    rating: 'Chờ đón',
    releaseDate: '01/12/2026',
    description: 'Cuộc chiến bảo vệ hành tinh trước các thực thể bóng tối đến từ chiều không gian bí ẩn.',
    director: 'Denis Villeneuve',
    cast: 'Timothée Chalamet, Zendaya',
    gradient: 'from-purple-950 via-fuchsia-950 to-neutral-950',
  },
  {
    id: 9,
    title: 'Mật Mã Cung Đình',
    genre: 'Lịch sử, Hành động',
    duration: '125 phút',
    ageLimit: 'T18',
    ageColor: 'bg-red-700',
    rating: 'Chờ đón',
    releaseDate: '10/12/2026',
    description: 'Bí mật đằng sau những bản đồ kho báu cổ xưa và cuộc truy đuổi sinh tử giữa các phe phái triều đình.',
    director: 'Ngô Thanh Vân',
    cast: 'Ngô Thanh Vân, Hứa Vĩ Văn, Song Luân',
    gradient: 'from-red-950 via-stone-900 to-neutral-950',
  },
];

const MoviePage = () => {
  const navigate = useNavigate();
  // Tab hiện tại: 'NOW_SHOWING' hoặc 'COMING_SOON'
  const [activeTab, setActiveTab] = useState('NOW_SHOWING');
  // Modal xem chi tiết phim
  const [selectedMovie, setSelectedMovie] = useState(null);

  const displayMovies = activeTab === 'NOW_SHOWING' ? NOW_SHOWING_MOVIES : COMING_SOON_MOVIES;

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-red-600 selection:text-white pb-32">
      {/* 1. Header dùng chung */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
        
        {/* Section: Thanh Tab chọn Phim Đang Chiếu / Phim Sắp Chiếu (Khớp UI/movie.png) */}
        <div className="border-b border-zinc-800/80">
          <div className="flex items-center space-x-6 sm:space-x-8">
            
            {/* Tab: PHIM ĐANG CHIẾU */}
            <button
              onClick={() => setActiveTab('NOW_SHOWING')}
              type="button"
              className={`pb-3 text-lg sm:text-2xl font-black uppercase tracking-wider transition-all duration-200 cursor-pointer relative ${
                activeTab === 'NOW_SHOWING'
                  ? 'text-[#e50914]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>PHIM ĐANG CHIẾU</span>
              {/* Gạch chân đỏ khi active (theo UI/movie.png) */}
              {activeTab === 'NOW_SHOWING' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#e50914] rounded-full animate-in fade-in zoom-in-95 duration-200"></div>
              )}
            </button>

            {/* Tab: PHIM SẮP CHIẾU */}
            <button
              onClick={() => setActiveTab('COMING_SOON')}
              type="button"
              className={`pb-3 text-lg sm:text-2xl font-black uppercase tracking-wider transition-all duration-200 cursor-pointer relative ${
                activeTab === 'COMING_SOON'
                  ? 'text-[#e50914]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>PHIM SẮP CHIẾU</span>
              {/* Gạch chân đỏ khi active */}
              {activeTab === 'COMING_SOON' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#e50914] rounded-full animate-in fade-in zoom-in-95 duration-200"></div>
              )}
            </button>

          </div>
        </div>

        {/* Section: Lưới hiển thị danh sách phim */}
        <section aria-label="Danh sách phim">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {displayMovies.map((movie) => (
              <div
                key={movie.id}
                className="group relative bg-[#1c1c1f] rounded-2xl overflow-hidden border border-zinc-800/90 hover:border-zinc-700/80 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col"
              >
                {/* Poster Graphic Artwork */}
                <div
                  className={`relative aspect-[3/4] w-full bg-gradient-to-br ${movie.gradient} p-4 flex flex-col justify-between overflow-hidden cursor-pointer`}
                  onClick={() => setSelectedMovie(movie)}
                >
                  {/* Background Cinema Elements */}
                  <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/5 blur-xl pointer-events-none"></div>

                  {/* Top Badges */}
                  <div className="flex items-center justify-between z-10">
                    <span
                      className={`text-white font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-md shadow ${movie.ageColor}`}
                    >
                      {movie.ageLimit}
                    </span>
                    <span className="bg-black/60 backdrop-blur-md text-white font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-md border border-white/10">
                      ★ {movie.rating}
                    </span>
                  </div>

                  {/* Center Clapper Icon */}
                  <div className="z-10 my-auto text-center py-4">
                    <Film className="w-10 h-10 mx-auto text-white/20 mb-2 group-hover:scale-110 group-hover:text-white/50 transition-all duration-300" />
                    <p className="text-white font-black text-sm sm:text-base leading-tight drop-shadow-md group-hover:text-[#e50914] transition-colors">
                      {movie.title}
                    </p>
                  </div>

                  {/* Bottom Duration info */}
                  <div className="z-10 flex items-center justify-between text-[11px] text-zinc-300 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{movie.duration}</span>
                    </span>
                    <span className="text-zinc-300 font-medium">{movie.releaseDate}</span>
                  </div>
                </div>

                {/* Movie Meta Info & Action Button */}
                <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between space-y-3">
                  <div>
                    <h3
                      onClick={() => setSelectedMovie(movie)}
                      className="text-xs sm:text-sm font-bold text-white group-hover:text-[#e50914] transition-colors line-clamp-1 cursor-pointer"
                    >
                      {movie.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                      {movie.genre}
                    </p>
                  </div>

                  {/* Nút hành động */}
                  {activeTab === 'NOW_SHOWING' ? (
                    <button
                      onClick={() => navigate(`/booking?movieId=${movie.id}`)}
                      type="button"
                      className="w-full bg-[#e50914] hover:bg-[#b80710] text-white text-xs font-bold py-2 px-3 rounded-xl transition duration-150 shadow-md shadow-red-950/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Đặt vé</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedMovie(movie)}
                      type="button"
                      className="w-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold py-2 px-3 rounded-xl transition duration-150 border border-zinc-700/60 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Chi tiết</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Modal xem chi tiết phim */}
      {selectedMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#1c1c1f] border border-zinc-700 rounded-3xl p-6 shadow-2xl space-y-4">
            
            {/* Nút đóng modal */}
            <button
              onClick={() => setSelectedMovie(null)}
              type="button"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header modal */}
            <div className="flex items-start space-x-3 pr-8">
              <span
                className={`text-white font-black text-xs px-2.5 py-1 rounded-md flex-shrink-0 ${selectedMovie.ageColor}`}
              >
                {selectedMovie.ageLimit}
              </span>
              <div>
                <h2 className="text-xl font-black text-white">
                  {selectedMovie.title}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {selectedMovie.genre} • {selectedMovie.duration}
                </p>
              </div>
            </div>

            {/* Nội dung mô tả */}
            <div className="space-y-3 text-sm text-zinc-300">
              <div>
                <span className="text-zinc-400 text-xs font-semibold block mb-0.5">Mô tả phim:</span>
                <p className="leading-relaxed bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                  {selectedMovie.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-400 font-semibold block">Đạo diễn:</span>
                  <span className="text-white font-medium">{selectedMovie.director}</span>
                </div>
                <div>
                  <span className="text-zinc-400 font-semibold block">Khởi chiếu:</span>
                  <span className="text-emerald-400 font-semibold">{selectedMovie.releaseDate}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-400 font-semibold block">Diễn viên chính:</span>
                  <span className="text-white font-medium">{selectedMovie.cast}</span>
                </div>
              </div>
            </div>

            {/* Footer modal: nút hành động */}
            <div className="pt-2 flex space-x-3">
              {activeTab === 'NOW_SHOWING' ? (
                <button
                  onClick={() => {
                    const id = selectedMovie.id;
                    setSelectedMovie(null);
                    navigate(`/booking?movieId=${id}`);
                  }}
                  type="button"
                  className="flex-1 bg-[#e50914] hover:bg-[#b80710] text-white font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-red-950/40"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Đặt vé xem phim này</span>
                </button>
              ) : (
                <button
                  onClick={() => setSelectedMovie(null)}
                  type="button"
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer"
                >
                  Đóng
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 2. Messenger Floating Action Button */}
      <MessengerButton />

      {/* 3. Bottom Navigation Bar dạng nổi viên thuốc (Active vào mục "Phim") */}
      <BottomNav activeId="movies" />
    </div>
  );
};

export default MoviePage;

