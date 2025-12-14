const express = require('express');
const axios = require('axios');
const app = express();
const port = 3002;
app.use(express.json());

// --- Mock Data (예매 내역) ---
const bookings = {}; 
let bookingIdCounter = 1;

// 🚨 5. 예매 완료 내역 전체 조회 (새로 추가됨: GET /list)
// Gateway API에서 /api/v1/bookings 경로가 Strip된 후 넘어오는 /list 요청을 처리합니다.
app.get('/list', (req, res) => {
    // bookings 객체의 모든 값을 배열로 변환하여 반환
    const allBookings = Object.values(bookings);
    console.log(`[Booking Service] GET /list processed. Total: ${allBookings.length}`);
    res.status(200).json(allBookings);
});


// 3. 좌석 선택 + 예매 요청 (중복 예매 X)
app.post('/book', async (req, res) => {
  const { showtimeId, seats, userId } = req.body;
  if (!showtimeId || !seats || !userId || seats.length === 0) {
    return res.status(400).json({ error: '필수 정보 누락' });
  }

  // 1. 좌석 중복 검사 (Showtime Service에 요청)
  try {
    // 이 부분은 실제로 Showtime Service의 내부 API를 호출해야 합니다.
    // 현재는 Mock으로 처리합니다.
    const response = await axios.get(`http://localhost:3001/seats/reserved/${showtimeId}`);
    const reservedSeats = response.data.reserved || [];

    const isDuplicate = seats.some(seat => reservedSeats.includes(seat));
    if (isDuplicate) {
      return res.status(409).json({ error: '선택된 좌석 중 이미 예약된 좌석이 있습니다.' });
    }

    // 2. 예매 처리 (Mock - 실제로는 DB 트랜잭션 처리)
    const newBookingId = `B${bookingIdCounter++}`;
    const newBooking = {
      bookingId: newBookingId,
      showtimeId,
      userId,
      seats,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
    };
    bookings[newBookingId] = newBooking;

    // 3. Showtime Service의 reservedSeats를 업데이트 (Mock - 실제로는 Lock 후 커밋)
    // 이 부분은 복잡하므로 최소 기능에서는 생략하고 성공했다고 가정합니다.

    res.status(201).json({ 
      message: '예매 완료',
      bookingId: newBookingId,
    });

  } catch (error) {
    // Showtime Service 호출 실패 (네트워크/서비스 문제)
    res.status(500).json({ error: '상영 정보 확인 중 오류 발생' });
  }
});

// 4. 예매 완료 내역 조회
app.get('/bookings/:id', (req, res) => {
  const booking = bookings[req.params.id];
  if (!booking) {
    return res.status(404).json({ error: '예매 내역 없음' });
  }
  res.json(booking);
});

app.listen(port, () => {
  console.log(`Booking Service listening on port ${port}`);
});