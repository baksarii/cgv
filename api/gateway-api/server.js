const express = require('express');
const proxy = require('express-http-proxy');
const app = express();
const port = 3000;

// --- Service Endpoints (Kubernetes Service Name으로 대체될 예정) ---
// 로컬 테스트 환경에서는 localhost를 사용하지만, EKS에서는 Kubernetes Service 이름을 사용합니다.
const SHOWTIME_SERVICE_URL = 'http://localhost:3001'; // EKS: http://showtime-service.default.svc.cluster.local
const BOOKING_SERVICE_URL = 'http://localhost:3002'; // EKS: http://booking-service.default.svc.cluster.local

// Showtime Service로 라우팅
app.use('/api/v1/showtimes', proxy(SHOWTIME_SERVICE_URL, {
  proxyReqPathResolver: req => `/showtimes${req.url}`
}));

// Booking Service로 라우팅
app.use('/api/v1/booking', proxy(BOOKING_SERVICE_URL, {
  proxyReqPathResolver: req => `/book${req.url}`
}));

app.use('/api/v1/bookings', proxy(BOOKING_SERVICE_URL, {
  proxyReqPathResolver: req => `/bookings${req.url}`
}));

// 기본 헬스 체크
app.get('/health', (req, res) => {
    res.send('Gateway is healthy.');
});

app.listen(port, () => {
  console.log(`Gateway API listening on port ${port}`);
});