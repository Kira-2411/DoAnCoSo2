import React, { createContext, useContext, useState, useEffect } from 'react';
import AkashiBap from '../assets/images/AkashiBap.png';
import AkashiBap2 from '../assets/images/AkashiBap2.png';
import AkashiCo from '../assets/images/AkashiCo.png';
import AkashiVui from '../assets/images/AkashiVui.png';
import AkashiImg from '../assets/images/Akashi.png';
import foodApi from '../api/foodApi';

const BookingContext = createContext(null);

export const FALLBACK_FOODS = [
  {
    id: '1',
    foodId: 1,
    name: 'Bắp ngọt (vừa)',
    shortName: 'Bắp ngọt (vừa)',
    category: 'POPCORN',
    categoryLabel: 'Bắp',
    price: 45000,
    image: AkashiBap,
    description: 'Bắp rang bơ đường truyền thống giòn rụm, thơm ngậy.'
  },
  {
    id: '2',
    foodId: 2,
    name: 'Bắp phô mai (vừa)',
    shortName: 'Bắp phô mai (vừa)',
    category: 'POPCORN',
    categoryLabel: 'Bắp',
    price: 55000,
    image: AkashiBap2,
    description: 'Bắp rang lắc bột phô mai mặn mà béo ngậy.'
  },
  {
    id: '3',
    foodId: 3,
    name: 'Nước ngọt ly lớn',
    shortName: 'Nước ngọt ly lớn',
    category: 'DRINK',
    categoryLabel: 'Nước',
    price: 30000,
    image: AkashiCo,
    description: 'Thức uống mát lạnh sảng khoái đánh tan cơn khát.'
  },
  {
    id: '4',
    foodId: 4,
    name: 'Combo 1 bắp 1 nước',
    shortName: 'Combo 1 bắp 1 nước',
    category: 'COMBO',
    categoryLabel: 'Combo',
    price: 65000,
    image: AkashiImg,
    description: '1 Bắp ngọt vừa + 1 Nước ngọt ly lớn (Tiết kiệm 20%).'
  },
  {
    id: '5',
    foodId: 5,
    name: 'Combo 2 bắp 2 nước',
    shortName: 'Combo 2 bắp 2 nước',
    category: 'COMBO',
    categoryLabel: 'Combo',
    price: 120000,
    image: AkashiVui,
    description: '2 Bắp rang giòn rụm + 2 Nước ngọt ly lớn siêu tiết kiệm cho cặp đôi & nhóm bạn.'
  }
];

export const getFoodImageByItem = (item) => {
  if (item?.img) return item.img;
  if (item?.image) return item.image;
  const cat = (item?.category || item?.categoryLabel || '').toLowerCase();
  const name = (item?.name || '').toLowerCase();

  if (cat.includes('bắp') || cat === 'popcorn') {
    if (name.includes('phô mai')) return AkashiBap2;
    return AkashiBap;
  }
  if (cat.includes('nước') || cat === 'drink') {
    return AkashiCo;
  }
  if (cat.includes('combo')) {
    if (name.includes('1 bắp 1 nước')) return AkashiImg;
    return AkashiVui;
  }
  return AkashiImg;
};

export const getFoodDescriptionByItem = (item) => {
  if (item?.description) return item.description;
  const cat = (item?.category || item?.categoryLabel || '').toLowerCase();
  const name = (item?.name || '').toLowerCase();

  if (cat.includes('combo')) {
    if (name.includes('2 bắp')) {
      return '2 Bắp rang giòn rụm + 2 Nước ngọt ly lớn siêu tiết kiệm cho cặp đôi & nhóm bạn.';
    }
    return 'Combo bắp nước siêu tiết kiệm kèm trải nghiệm điện ảnh trọn vẹn.';
  }
  if (cat.includes('bắp') || cat === 'popcorn') {
    if (name.includes('phô mai')) return 'Bắp rang lắc bột phô mai mặn mà béo ngậy.';
    return 'Bắp rang bơ đường truyền thống giòn rụm, thơm ngậy.';
  }
  if (cat.includes('nước') || cat === 'drink') {
    return 'Thức uống mát lạnh sảng khoái đánh tan cơn khát.';
  }
  return 'Món ăn kèm thơm ngon tại quầy bắp nước Akashi Cinema.';
};

export const normalizeFoodItem = (f) => {
  const rawCategory = (f.category || '').trim();
  const lowerCat = rawCategory.toLowerCase();
  let categoryCode = 'COMBO';
  if (lowerCat.includes('bắp') || lowerCat === 'popcorn') {
    categoryCode = 'POPCORN';
  } else if (lowerCat.includes('nước') || lowerCat === 'drink') {
    categoryCode = 'DRINK';
  } else if (lowerCat.includes('combo')) {
    categoryCode = 'COMBO';
  }

  return {
    id: String(f.foodId ?? f.id),
    foodId: Number(f.foodId ?? f.id),
    name: f.name,
    shortName: f.name,
    category: categoryCode,
    categoryLabel: rawCategory || 'Món ngon',
    price: Number(f.price || 0),
    image: getFoodImageByItem(f),
    img: f.img || null,
    description: getFoodDescriptionByItem(f)
  };
};

export const DEFAULT_FOODS = FALLBACK_FOODS;

export const BookingProvider = ({ children }) => {
  // Danh sách món ăn thật từ Database (fallback về FALLBACK_FOODS nếu chưa tải xong)
  const [foodsCatalog, setFoodsCatalog] = useState(FALLBACK_FOODS);
  const [loadingFoodsCatalog, setLoadingFoodsCatalog] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAllFoods = async () => {
      try {
        setLoadingFoodsCatalog(true);
        const res = await foodApi.getFoods();
        const rawList = Array.isArray(res.data) ? res.data : [];
        if (isMounted && rawList.length > 0) {
          setFoodsCatalog(rawList.map(normalizeFoodItem));
        }
      } catch (err) {
        console.error('Lỗi khi tải danh mục bắp nước:', err);
      } finally {
        if (isMounted) {
          setLoadingFoodsCatalog(false);
        }
      }
    };
    fetchAllFoods();
    return () => {
      isMounted = false;
    };
  }, []);

  // Step 1: Phim đang chọn
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

  // Step 3: Đồ ăn & Combo đã chọn (đồng bộ xuyên suốt giữa trang /food và luồng /booking)
  const [selectedFoods, setSelectedFoods] = useState({});

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

  // Thao tác số lượng đồ ăn (nhận cả foodId kiểu số hoặc chuỗi)
  const updateFoodQuantity = (foodId, delta) => {
    const key = String(foodId);
    setSelectedFoods((prev) => {
      const current = prev[key] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return { ...prev, [key]: next };
    });
  };

  const clearFoods = () => {
    setSelectedFoods({});
  };

  // Tính tiền
  const seatTotal = selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
  
  const foodTotal = Object.entries(selectedFoods).reduce((sum, [foodId, qty]) => {
    const item = foodsCatalog.find((f) => String(f.id) === String(foodId) || String(f.foodId) === String(foodId));
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const foodTotalQuantity = Object.values(selectedFoods).reduce((sum, qty) => sum + qty, 0);

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
        clearFoods,
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
        foodTotalQuantity,
        grandTotal,
        resetBooking,
        DEFAULT_FOODS: foodsCatalog,
        foodsCatalog,
        loadingFoodsCatalog
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

