import React, { createContext, useContext, useState, useEffect } from 'react';
import AkashiBap from '../assets/images/AkashiBap.png';
import AkashiCo from '../assets/images/AkashiCo.png';
import AkashiVui from '../assets/images/AkashiVui.png';

const BookingContext = createContext(null);

export const DEFAULT_FOODS = [
  {
    id: 'food-coca',
    name: 'Coca-Cola',
    shortName: 'Coca',
    category: 'DRINK',
    categoryLabel: 'Thức uống',
    price: 20000,
    image: AkashiCo,
    description: 'Nước ngọt có gas mát lạnh sảng khoái'
  },
  {
    id: 'food-combo-solo',
    name: 'Combo Solo Akashi',
    shortName: 'Combo Solo',
    category: 'COMBO',
    categoryLabel: 'Combo',
    price: 65000,
    image: AkashiVui,
    description: '1 Bắp ngọt vừa + 1 Nước có gas lớn (Tiết kiệm 20%)'
  },
  {
    id: 'food-popcorn-caramel',
    name: 'Bắp rang vị Caramel',
    shortName: 'Bắp Caramel',
    category: 'POPCORN',
    categoryLabel: 'Bắp rang',
    price: 45000,
    image: AkashiBap,
    description: 'Bắp rang bơ béo ngậy phủ caramel vàng óng thơm lừng'
  }
];

export const BookingProvider = ({ children }) => {
  // Step 1: Phim đang chọn (Mặc định gợi ý phim HELLO chuẩn như trong UI mẫu)
  const [selectedMovie, setSelectedMovie] = useState({
    id: 1,
    title: 'HELLO',
    format: '2D - dd',
    ageRating: 'T18',
    duration: '120 phút',
    genre: 'Kinh dị, Hồi hộp',
    releaseDate: '01/11/2026',
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80'
  });

  // Step 2: Ngày và Suất chiếu đang chọn
  const [selectedDate, setSelectedDate] = useState('2026-11-03');
  const [selectedShowtime, setSelectedShowtime] = useState({
    id: 1,
    time: '20:00 - 21:40',
    startTime: '20:00',
    endTime: '21:40',
    dateFormatted: '03/11/2026',
    room: 'Phòng 1',
    roomId: 1,
    totalSeats: 96,
    availableSeats: 96,
    priceMultiplier: 1.0
  });

  // Step 3: Đồ ăn & Combo đã chọn
  // Khởi tạo sẵn 1 Coca (20.000đ) theo đúng ảnh UI mẫu bookingaccept2.png
  const [selectedFoods, setSelectedFoods] = useState({
    'food-coca': 1
  });

  // Step 4: Ghế đã chọn (Mặc định chọn 1 ghế A08 giá 60.000đ theo UI bookingaccept1.png)
  const [selectedSeats, setSelectedSeats] = useState([
    {
      id: 'A08',
      code: 'A08',
      row: 'A',
      number: 8,
      type: 'STANDARD',
      price: 60000
    }
  ]);

  // Step 5 & 6: Giữ ghế & Mã đơn hàng
  const [orderId, setOrderId] = useState(54); // Khớp mã #54 trong bookingpay1.png
  const [holdCountdown, setHoldCountdown] = useState(300); // 300 giây (5 phút)
  const [isHolding, setIsHolding] = useState(true);

  // Bộ đếm lùi thời gian giữ ghế
  useEffect(() => {
    if (!isHolding || holdCountdown <= 0) return;
    const interval = setInterval(() => {
      setHoldCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isHolding, holdCountdown]);

  // Thao tác với ghế ngồi
  const toggleSeat = (seat) => {
    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.id === seat.id);
      if (exists) {
        return prev.filter((s) => s.id !== seat.id);
      }
      if (prev.length >= 10) {
        alert('Bạn chỉ có thể chọn tối đa 10 ghế trong một đơn đặt (Quy tắc BR-BOOK-01)!');
        return prev;
      }
      return [...prev, seat];
    });
  };

  // Thao tác số lượng đồ ăn
  const updateFoodQuantity = (foodId, delta) => {
    setSelectedFoods((prev) => {
      const current = prev[foodId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[foodId];
        return copy;
      }
      return { ...prev, [foodId]: next };
    });
  };

  // Tính tiền
  const seatTotal = selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
  
  const foodTotal = Object.entries(selectedFoods).reduce((sum, [foodId, qty]) => {
    const item = DEFAULT_FOODS.find((f) => f.id === foodId);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const grandTotal = seatTotal + foodTotal;

  const resetBooking = () => {
    setSelectedSeats([]);
    setSelectedFoods({});
    setHoldCountdown(300);
  };

  return (
    <BookingContext.Provider
      value={{
        selectedMovie,
        setSelectedMovie,
        selectedDate,
        setSelectedDate,
        selectedShowtime,
        setSelectedShowtime,
        selectedFoods,
        setSelectedFoods,
        updateFoodQuantity,
        selectedSeats,
        setSelectedSeats,
        toggleSeat,
        orderId,
        setOrderId,
        holdCountdown,
        setHoldCountdown,
        isHolding,
        setIsHolding,
        seatTotal,
        foodTotal,
        grandTotal,
        resetBooking,
        DEFAULT_FOODS
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking phải được sử dụng bên trong BookingProvider');
  }
  return context;
};

