const express = require('express');
const app = express();
const port = 3001;
app.use(express.json());

// --- Mock Data ---
const showtimes = [
  { id: 'S101', movie: '듄 파트2', time: '14:00', theater: 'T1', totalSeats: 50 },
  { id: 'S102', movie: '파묘', time: '17:30', theater: 'T2', totalSeats: 40 },
];
let reservedSeats = {
  'S101': ['A1', 'A2', 'B5'],
  'S102': ['C3', 'D4'],
};

// 🚨 0. 상영 시간표 전체 목록 조회 (새로 추가됨: GET /list)
// Gateway API에서 /api/v1/showtimes 경로가 Strip된 후 넘어오는 /list 요청을 처리합니다.
app.get('/list', (req, res) => {
    // 기존 /showtimes 라우트와 동일한 로직을 수행합니다.
    console.log('[Showtime Service] GET /list processed.');
    res.status(200).json(showtimes);
});


// 1. 영화/상영시간 목록 보기 (기존 경로 유지)
app.get('/showtimes', (req, res) => {
  res.json(showtimes);
});

// 2. 특정 상영관 좌석 상황 보기 (기존 경로 유지)
app.get('/showtimes/:id/seats', (req, res) => {
  const showtimeId = req.params.id;
  const showtime = showtimes.find(s => s.id === showtimeId);

  if (!showtime) {
    return res.status(404).json({ error: '상영 정보 없음' });
  }

  const totalSeats = Array.from({ length: showtime.totalSeats }, (_, i) => `S${i + 1}`);
  const availableSeats = totalSeats.filter(seat => !reservedSeats[showtimeId].includes(seat));

  res.json({
    showtime: showtime.movie,
    time: showtime.time,
    total: showtime.totalSeats,
    reserved: reservedSeats[showtimeId],
    available: availableSeats,
  });
});

// (Booking Service에서 예약된 좌석 정보를 요청할 때 사용되는 내부 API)
app.get('/seats/reserved/:id', (req, res) => {
    res.json({ reserved: reservedSeats[req.params.id] || [] });
});

app.listen(port, () => {
  console.log(`Showtime Service listening on port ${port}`);
});